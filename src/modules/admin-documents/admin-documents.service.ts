import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { getPagination } from '../../common/pagination/pagination.util';
import { AdminDocumentsRepository } from './admin-documents.repository';
import { CreateDocumentDto, ListDocumentsDto, UpdateDocumentDto } from './dto/admin-documents.dto';

@Injectable()
export class AdminDocumentsService {
  constructor(
    private readonly repository: AdminDocumentsRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async create(actorId: string, dto: CreateDocumentDto) {
    const existing = await this.repository.findByName(dto.name.trim());
    if (existing) {
      throw new BadRequestException('Document with this name already exists.');
    }

    const document = await this.repository.create({
      name: dto.name.trim(),
      isRequired: dto.isRequired ?? false,
    });

    await this.auditLog.write({
      actorId,
      targetId: document.id,
      targetType: 'DOCUMENT',
      action: 'DOCUMENT_CREATED',
      module: 'Document Management',
      afterJson: { name: document.name, isRequired: document.isRequired },
    });

    return { data: document, message: 'Document created successfully.' };
  }

  async list(query: ListDocumentsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Record<string, unknown> = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [documents, total] = await this.repository.findMany(where, skip, take);

    return {
      data: documents,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Documents fetched successfully.',
    };
  }

  async update(actorId: string, id: string, dto: UpdateDocumentDto) {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    if (dto.name && dto.name.trim() !== document.name) {
      const existing = await this.repository.findByName(dto.name.trim());
      if (existing) {
        throw new BadRequestException('Document with this name already exists.');
      }
    }

    const before = { name: document.name, isRequired: document.isRequired, isActive: document.isActive };
    const updated = await this.repository.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    await this.auditLog.write({
      actorId,
      targetId: id,
      targetType: 'DOCUMENT',
      action: 'DOCUMENT_UPDATED',
      module: 'Document Management',
      beforeJson: before,
      afterJson: { name: updated.name, isRequired: updated.isRequired, isActive: updated.isActive },
    });

    return { data: updated, message: 'Document updated successfully.' };
  }

  async delete(actorId: string, id: string) {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    const updated = await this.repository.update(id, { isActive: false });

    await this.auditLog.write({
      actorId,
      targetId: id,
      targetType: 'DOCUMENT',
      action: 'DOCUMENT_DEACTIVATED',
      module: 'Document Management',
      beforeJson: { isActive: true },
      afterJson: { isActive: false },
    });

    return { data: updated, message: 'Document deactivated successfully.' };
  }
}
