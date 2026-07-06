import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Dispute, DisputeStatus, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { getPagination } from '../../common/pagination/pagination.util';
import { AdminDisputesRepository, DISPUTE_INCLUDE } from './admin-disputes.repository';
import { CreateDisputeDto, DisputeRange, DisputeSortBy, ListDisputesDto, RespondDisputeDto, ReviewDisputeDto, SortOrder } from './dto/admin-disputes.dto';

type DisputeView = Prisma.DisputeGetPayload<{ include: typeof DISPUTE_INCLUDE }>;
type DisputeExtras = {
  evidenceUrlsJson?: Prisma.JsonValue;
  providerResponse?: string | null;
  providerEvidenceUrlsJson?: Prisma.JsonValue;
  providerRespondedAt?: Date | null;
  decidedAt?: Date | null;
};

@Injectable()
export class AdminDisputesService {
  constructor(private readonly disputesRepository: AdminDisputesRepository, private readonly auditLog: AuditLogWriterService) {}

  async stats(query: ListDisputesDto) {
    const [total, open, approved, rejected] = await this.disputesRepository.countStats(this.where(query));
    return { data: { total, open, approved, rejected }, message: 'Dispute stats fetched successfully.' };
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
    if (!dto.userId || !dto.providerId || !dto.orderId) throw new BadRequestException('userId, providerId, and orderId are required for admin dispute creation');
    const dispute = await this.disputesRepository.create(this.createData(dto.userId, dto.providerId, dto.orderId, dto));
    await this.auditLog.write({ actorId: user.uid, actorType: user.role, targetId: dispute.id, targetType: 'DISPUTE', action: 'DISPUTE_CREATED', module: 'Disputes', afterJson: this.snapshot(dispute) });
    return { data: this.item(dispute), message: 'Dispute created successfully.' };
  }

  async createForCustomer(user: AuthUserContext, orderId: string, dto: CreateDisputeDto) {
    const order = await this.disputesRepository.findCustomerOrder(user.uid, orderId);
    if (!order) throw new NotFoundException('Order not found');
    const providerId = dto.providerId ?? order.providerOrders[0]?.providerId;
    if (!providerId) throw new BadRequestException('Provider is required to create a dispute for this order');
    const dispute = await this.disputesRepository.create(this.createData(user.uid, providerId, orderId, dto));
    await this.auditLog.write({ actorId: user.uid, actorType: user.role, targetId: dispute.id, targetType: 'DISPUTE', action: 'DISPUTE_CREATED_BY_CUSTOMER', module: 'Disputes', afterJson: this.snapshot(dispute) });
    return { data: this.item(dispute), message: 'Dispute created successfully.' };
  }

  async customerList(user: AuthUserContext, query: ListDisputesDto) {
    const { page, limit, skip, take } = getPagination(query);
    const [items, total] = await this.disputesRepository.findCustomerDisputesAndCount({ userId: user.uid, orderBy: this.orderBy(query), skip, take });
    return { data: items.map((item) => this.item(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Disputes fetched successfully.' };
  }

  async customerDetails(user: AuthUserContext, id: string) {
    const dispute = await this.disputesRepository.findCustomerDispute(user.uid, id);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return { data: this.item(dispute), message: 'Dispute fetched successfully.' };
  }

  async providerList(user: AuthUserContext, query: ListDisputesDto) {
    const { page, limit, skip, take } = getPagination(query);
    const [items, total] = await this.disputesRepository.findProviderDisputesAndCount({ providerId: user.uid, orderBy: this.orderBy(query), skip, take });
    return { data: items.map((item) => this.item(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider disputes fetched successfully.' };
  }

  async providerDetails(user: AuthUserContext, id: string) {
    const dispute = await this.disputesRepository.findProviderDispute(user.uid, id);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return { data: this.item(dispute), message: 'Provider dispute fetched successfully.' };
  }

  async respondAsProvider(user: AuthUserContext, id: string, dto: RespondDisputeDto) {
    const current = await this.disputesRepository.findProviderDispute(user.uid, id);
    if (!current) throw new NotFoundException('Dispute not found');
    const updated = await this.disputesRepository.respondAsProvider(id, {
      status: this.status('UNDER_REVIEW'),
      providerResponse: dto.response.trim(),
      providerEvidenceUrlsJson: this.evidence(dto.evidenceUrls),
      providerRespondedAt: new Date(),
    });
    await this.auditLog.write({ actorId: user.uid, actorType: user.role, targetId: id, targetType: 'DISPUTE', action: 'DISPUTE_RESPONDED_BY_PROVIDER', module: 'Disputes', beforeJson: this.snapshot(current), afterJson: this.snapshot(updated) });
    return { data: this.item(updated), message: 'Dispute response submitted successfully.' };
  }

  async review(user: AuthUserContext, id: string, dto: ReviewDisputeDto) {
    const current = await this.getDispute(id);
    const updated = await this.disputesRepository.updateStatus(id, { status: this.status(dto.status), adminNote: dto.adminNote?.trim() || null, decidedAt: new Date() });
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
      status: query.status ? this.status(query.status) : undefined,
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
    const extras = dispute as DisputeView & DisputeExtras;
    return { id: dispute.id, user: { id: dispute.user.id, name: this.name(dispute.user), email: dispute.user.email }, provider: { id: dispute.provider.id, name: dispute.provider.providerProfile?.businessName ?? this.name(dispute.provider), email: dispute.provider.email }, order: dispute.order, reason: dispute.reason, description: dispute.description, evidenceUrls: this.stringArray(extras.evidenceUrlsJson), status: dispute.status, providerResponse: extras.providerResponse ?? null, providerEvidenceUrls: this.stringArray(extras.providerEvidenceUrlsJson), providerRespondedAt: extras.providerRespondedAt ?? null, adminNote: dispute.adminNote, decidedAt: extras.decidedAt ?? null, createdAt: dispute.createdAt, updatedAt: dispute.updatedAt };
  }

  private createData(userId: string, providerId: string, orderId: string, dto: CreateDisputeDto): Prisma.DisputeUncheckedCreateInput & Record<string, unknown> {
    return { userId, providerId, orderId, reason: dto.reason.trim(), description: dto.description.trim(), evidenceUrlsJson: this.evidence(dto.evidenceUrls), status: this.status('OPEN') };
  }

  private evidence(urls?: string[]): Prisma.InputJsonValue {
    return urls ?? [];
  }

  private stringArray(value: Prisma.JsonValue | undefined): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private status(value: string): DisputeStatus {
    return value as DisputeStatus;
  }

  private snapshot(dispute: Dispute | DisputeView) {
    const extras = dispute as (Dispute | DisputeView) & DisputeExtras;
    return { id: dispute.id, reason: dispute.reason, status: dispute.status, evidenceUrls: this.stringArray(extras.evidenceUrlsJson), providerResponse: extras.providerResponse ?? null, providerEvidenceUrls: this.stringArray(extras.providerEvidenceUrlsJson), adminNote: dispute.adminNote };
  }
  private name(user: { firstName: string; lastName: string }) { return `${user.firstName} ${user.lastName}`.trim(); }
}
