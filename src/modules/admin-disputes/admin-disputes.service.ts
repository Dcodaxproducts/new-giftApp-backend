import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Dispute, DisputeStatus, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { getPagination } from '../../common/pagination/pagination.util';
import { AdminDisputesRepository, DISPUTE_INCLUDE } from './admin-disputes.repository';
import { CreateDisputeDto, DisputeRange, DisputeSortBy, ListDisputesDto, ReviewDisputeDto, SortOrder } from './dto/admin-disputes.dto';

type DisputeView = Prisma.DisputeGetPayload<{ include: typeof DISPUTE_INCLUDE }>;

@Injectable()
export class AdminDisputesService {
  constructor(private readonly disputesRepository: AdminDisputesRepository, private readonly auditLog: AuditLogWriterService) {}

  async stats(query: ListDisputesDto) {
    const [total, pending, approved, rejected] = await this.disputesRepository.countStats(this.where(query));
    return { data: { total, pending, approved, rejected }, message: 'Dispute stats fetched successfully.' };
  }

  async list(query: ListDisputesDto) {
    const { page, limit, skip, take } = getPagination(query);
    const [items, total] = await this.disputesRepository.findDisputesAndCount({ where: this.where(query), orderBy: this.orderBy(query), skip, take });
    return { data: items.map((item) => this.item(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Disputes fetched successfully.' };
  }

  async details(id: string) {
    const dispute = await this.getDispute(id);
    return { data: this.item(dispute), message: 'Dispute fetched successfully.' };
  }

  async create(user: AuthUserContext, dto: CreateDisputeDto) {
    const dispute = await this.disputesRepository.create({ userId: dto.userId, providerId: dto.providerId, orderId: dto.orderId, reason: dto.reason.trim(), description: dto.description.trim() });
    await this.auditLog.write({ actorId: user.uid, actorType: user.role, targetId: dispute.id, targetType: 'DISPUTE', action: 'DISPUTE_CREATED', module: 'Disputes', afterJson: this.snapshot(dispute) });
    return { data: this.item(dispute), message: 'Dispute created successfully.' };
  }

  async review(user: AuthUserContext, id: string, dto: ReviewDisputeDto) {
    if (dto.status === DisputeStatus.PENDING) throw new BadRequestException('Review status must be APPROVED or REJECTED');
    const current = await this.getDispute(id);
    const updated = await this.disputesRepository.updateStatus(id, { status: dto.status, adminNote: dto.adminNote?.trim() || null });
    await this.auditLog.write({ actorId: user.uid, actorType: user.role, targetId: id, targetType: 'DISPUTE', action: `DISPUTE_${dto.status}`, module: 'Disputes', beforeJson: this.snapshot(current), afterJson: this.snapshot(updated) });
    return { data: this.item(updated), message: `Dispute ${dto.status.toLowerCase()} successfully.` };
  }

  private async getDispute(id: string): Promise<DisputeView> {
    const dispute = await this.disputesRepository.findById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  private where(query: ListDisputesDto): Prisma.DisputeWhereInput {
    return {
      ...this.dateWhere(query),
      status: query.status,
      ...(query.search ? { OR: [
        { reason: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { provider: { email: { contains: query.search, mode: 'insensitive' } } },
        { provider: { providerProfile: { is: { businessName: { contains: query.search, mode: 'insensitive' } } } } },
      ] } : {}),
    };
  }

  private dateWhere(query: ListDisputesDto): Prisma.DisputeWhereInput {
    const now = new Date();
    const range = query.range ?? DisputeRange.LAST_30_DAYS;
    const start = query.fromDate ? new Date(query.fromDate) : range === DisputeRange.TODAY ? new Date(now.toISOString().slice(0, 10)) : range === DisputeRange.LAST_7_DAYS ? new Date(now.getTime() - 7 * 86_400_000) : range === DisputeRange.LAST_30_DAYS ? new Date(now.getTime() - 30 * 86_400_000) : undefined;
    return { createdAt: { ...(start ? { gte: start } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } };
  }

  private orderBy(query: ListDisputesDto): Prisma.DisputeOrderByWithRelationInput {
    const order = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    if (query.sortBy === DisputeSortBy.STATUS) return { status: order };
    return { createdAt: order };
  }

  private item(dispute: DisputeView) {
    return { id: dispute.id, user: { id: dispute.user.id, name: this.name(dispute.user), email: dispute.user.email }, provider: { id: dispute.provider.id, name: dispute.provider.providerProfile?.businessName ?? this.name(dispute.provider), email: dispute.provider.email }, order: dispute.order, reason: dispute.reason, description: dispute.description, status: dispute.status, adminNote: dispute.adminNote, createdAt: dispute.createdAt, updatedAt: dispute.updatedAt };
  }

  private snapshot(dispute: Dispute | DisputeView) { return { id: dispute.id, reason: dispute.reason, status: dispute.status, adminNote: dispute.adminNote }; }
  private name(user: { firstName: string; lastName: string }) { return `${user.firstName} ${user.lastName}`.trim(); }
}
