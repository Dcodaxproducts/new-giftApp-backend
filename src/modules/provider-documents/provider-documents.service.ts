import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProviderDocumentStatus } from '@prisma/client';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { ProviderDocumentsRepository } from './provider-documents.repository';
import { SubmitProviderDocumentDto, UpdateProviderDocumentDto } from './dto/provider-documents.dto';

@Injectable()
export class ProviderDocumentsService {
  constructor(
    private readonly repository: ProviderDocumentsRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async listDocuments() {
    const documents = await this.repository.findActiveDocuments();
    return { data: documents, message: 'Documents fetched successfully.' };
  }

  async myDocuments(userId: string) {
    const profile = await this.getProviderProfile(userId);
    const [documents, submissions] = await Promise.all([
      this.repository.findActiveDocuments(),
      this.repository.findProviderDocuments(profile.id),
    ]);

    const submissionMap = new Map(submissions.map((s) => [s.documentTypeId, s]));

    const data = documents.map((doc) => {
      const submission = submissionMap.get(doc.id);
      return {
        document: { id: doc.id, name: doc.name, isRequired: doc.isRequired },
        submission: submission
          ? { id: submission.id, fileUrl: submission.fileUrl, status: submission.status, createdAt: submission.createdAt, updatedAt: submission.updatedAt }
          : null,
      };
    });

    return { data, message: 'My documents fetched successfully.' };
  }

  async submit(actorId: string, providerProfileId: string, dto: SubmitProviderDocumentDto) {
    const document = await this.repository.findDocumentById(dto.documentId);
    if (!document || !document.isActive) {
      throw new NotFoundException('Document not found or inactive.');
    }

    const existing = await this.repository.findProviderDocument(providerProfileId, dto.documentId);
    if (existing) {
      throw new BadRequestException('Document already submitted. Use update to re-upload.');
    }

    const providerDoc = await this.repository.createProviderDocument({
      providerProfileId,
      documentTypeId: dto.documentId,
      fileUrl: dto.fileUrl.trim(),
      status: ProviderDocumentStatus.PENDING,
    });

    await this.auditLog.write({
      actorId,
      targetId: providerDoc.id,
      targetType: 'PROVIDER_DOCUMENT',
      action: 'PROVIDER_DOCUMENT_SUBMITTED',
      module: 'Provider Documents',
      afterJson: { documentName: document.name, fileUrl: providerDoc.fileUrl },
    });

    return { data: providerDoc, message: 'Document submitted successfully.' };
  }

  async update(actorId: string, providerDocumentId: string, providerProfileId: string, dto: UpdateProviderDocumentDto) {
    const providerDoc = await this.repository.updateProviderDocument(providerDocumentId, {}).catch(() => null);
    if (!providerDoc || providerDoc.providerProfileId !== providerProfileId) {
      throw new NotFoundException('Provider document not found.');
    }

    const before = { fileUrl: providerDoc.fileUrl, status: providerDoc.status };
    const updated = await this.repository.updateProviderDocument(providerDocumentId, {
      fileUrl: dto.fileUrl.trim(),
      status: ProviderDocumentStatus.PENDING,
    });

    await this.auditLog.write({
      actorId,
      targetId: providerDocumentId,
      targetType: 'PROVIDER_DOCUMENT',
      action: 'PROVIDER_DOCUMENT_UPDATED',
      module: 'Provider Documents',
      beforeJson: before,
      afterJson: { fileUrl: updated.fileUrl, status: updated.status },
    });

    return { data: updated, message: 'Document updated successfully.' };
  }

  async submitByAdmin(actorId: string, providerUserId: string, dto: SubmitProviderDocumentDto) {
    const provider = await this.repository.findProviderUserById(providerUserId);
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }

    const profile = await this.repository.findProviderProfileByUserId(providerUserId);
    if (!profile) {
      throw new NotFoundException('Provider profile not found.');
    }

    return this.submit(actorId, profile.id, dto);
  }

  async submitByProvider(userId: string, dto: SubmitProviderDocumentDto) {
    const profile = await this.getProviderProfile(userId);
    return this.submit(userId, profile.id, dto);
  }

  async updateByProvider(userId: string, providerDocumentId: string, dto: UpdateProviderDocumentDto) {
    const profile = await this.getProviderProfile(userId);
    return this.update(userId, providerDocumentId, profile.id, dto);
  }

  private async getProviderProfile(userId: string) {
    const profile = await this.repository.findProviderProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Provider profile not found.');
    }
    return profile;
  }
}
