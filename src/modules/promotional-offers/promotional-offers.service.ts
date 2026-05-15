import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Gift, Prisma, PromotionalOffer, PromotionalOfferApprovalStatus, PromotionalOfferDiscountType, PromotionalOfferStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { OfferWithRelations, PromotionalOffersRepository, promotionalOfferInclude } from './promotional-offers.repository';
import { ProviderOffersRepository } from './provider-offers.repository';
import { ApproveOfferDto, CreateAdminOfferDto, CreateProviderOfferDto, ListPromotionalOffersDto, ListProviderOffersDto, PromotionalOfferApprovalFilter, PromotionalOfferSortBy, PromotionalOfferStatusFilter, RejectOfferDto, SortOrder, UpdateOfferStatusDto, UpdatePromotionalOfferDto } from './dto/promotional-offers.dto';

;

@Injectable()
export class PromotionalOffersService {
  constructor(
    private readonly promotionalOffersRepository: PromotionalOffersRepository,
    private readonly providerOffersRepository: ProviderOffersRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async listProvider(user: AuthUserContext, query: ListProviderOffersDto) {
    return this.list({ ...query, providerId: user.uid });
  }

  async createProvider(user: AuthUserContext, dto: CreateProviderOfferDto) {
    const item = await this.getProviderItem(user.uid, dto.itemId);
    this.validateDiscount(dto.discountType, dto.discountValue, Number(item.price));
    this.validateDates(dto.startDate, dto.endDate);
    const approvalStatus = PromotionalOfferApprovalStatus.PENDING;
    const offer = await this.providerOffersRepository.createProviderOffer( {
        providerId: user.uid,
        itemId: item.id,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        eligibilityRules: dto.eligibilityRules?.trim(),
        isActive: dto.isActive ?? true,
        approvalStatus,
        status: this.computeStatus(dto.isActive ?? true, approvalStatus, new Date(dto.startDate), dto.endDate ? new Date(dto.endDate) : null),
        createdBy: user.uid,
      });
    await this.audit(user.uid, offer.id, 'PROVIDER_PROMOTIONAL_OFFER_CREATED', undefined, this.toDetail(offer));
    return { data: this.toDetail(offer), message: 'Promotional offer created successfully' };
  }

  async providerDetails(user: AuthUserContext, id: string) {
    const offer = await this.getOffer(id, user.uid);
    return { data: this.toDetail(offer), message: 'Promotional offer fetched successfully' };
  }

  async updateProvider(user: AuthUserContext, id: string, dto: UpdatePromotionalOfferDto) {
    const offer = await this.getOffer(id, user.uid);
    return this.updateOffer(user.uid, offer, dto, 'PROVIDER_PROMOTIONAL_OFFER_UPDATED', true);
  }

  async updateProviderStatus(user: AuthUserContext, id: string, dto: UpdateOfferStatusDto) {
    const offer = await this.getOffer(id, user.uid);
    return this.updateStatus(user.uid, offer, dto, 'PROVIDER_PROMOTIONAL_OFFER_STATUS_CHANGED');
  }

  async deleteProvider(user: AuthUserContext, id: string) {
    const offer = await this.getOffer(id, user.uid);
    return this.deleteOffer(user.uid, offer, 'PROVIDER_PROMOTIONAL_OFFER_DELETED');
  }

  async listAdmin(query: ListPromotionalOffersDto) { return this.list(query); }
  async adminDetails(id: string) { const offer = await this.getOffer(id); return { data: this.toDetail(offer), message: 'Promotional offer fetched successfully' }; }

  async createAdmin(user: AuthUserContext, dto: CreateAdminOfferDto) {
    const item = await this.getProviderItem(dto.providerId, dto.itemId);
    this.validateDiscount(dto.discountType, dto.discountValue, Number(item.price));
    this.validateDates(dto.startDate, dto.endDate);
    const approvalStatus = dto.approvalStatus ?? PromotionalOfferApprovalStatus.APPROVED;
    const offer = await this.promotionalOffersRepository.createOffer( {
        providerId: dto.providerId,
        itemId: item.id,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        eligibilityRules: dto.eligibilityRules?.trim(),
        isActive: dto.isActive ?? true,
        approvalStatus,
        status: this.computeStatus(dto.isActive ?? true, approvalStatus, new Date(dto.startDate), dto.endDate ? new Date(dto.endDate) : null),
        approvedAt: approvalStatus === PromotionalOfferApprovalStatus.APPROVED ? new Date() : null,
        approvedBy: approvalStatus === PromotionalOfferApprovalStatus.APPROVED ? user.uid : null,
        createdBy: user.uid,
      });
    await this.audit(user.uid, offer.id, 'ADMIN_PROMOTIONAL_OFFER_CREATED', undefined, this.toDetail(offer));
    return { data: this.toDetail(offer), message: 'Promotional offer created successfully' };
  }

  async updateAdmin(user: AuthUserContext, id: string, dto: UpdatePromotionalOfferDto) {
    const offer = await this.getOffer(id);
    return this.updateOffer(user.uid, offer, dto, 'ADMIN_PROMOTIONAL_OFFER_UPDATED', false);
  }

  async approve(user: AuthUserContext, id: string, dto: ApproveOfferDto) {
    const offer = await this.getOffer(id);
    const updated = await this.promotionalOffersRepository.approveOffer(id, { approvalStatus: PromotionalOfferApprovalStatus.APPROVED, approvedAt: new Date(), approvedBy: user.uid, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null, status: this.computeStatus(offer.isActive, PromotionalOfferApprovalStatus.APPROVED, offer.startDate, offer.endDate), updatedBy: user.uid });
    await this.audit(user.uid, id, 'PROMOTIONAL_OFFER_APPROVED', { ...this.toDetail(offer), comment: dto.comment, notifyProvider: dto.notifyProvider }, this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Promotional offer approved successfully' };
  }

  async reject(user: AuthUserContext, id: string, dto: RejectOfferDto) {
    const offer = await this.getOffer(id);
    const updated = await this.promotionalOffersRepository.rejectOffer(id, { approvalStatus: PromotionalOfferApprovalStatus.REJECTED, rejectedAt: new Date(), rejectedBy: user.uid, rejectionReason: dto.reason, rejectionComment: dto.comment, status: PromotionalOfferStatus.REJECTED, updatedBy: user.uid });
    await this.audit(user.uid, id, 'PROMOTIONAL_OFFER_REJECTED', this.toDetail(offer), { ...this.toDetail(updated), notifyProvider: dto.notifyProvider });
    return { data: this.toDetail(updated), message: 'Promotional offer rejected successfully' };
  }

  async updateAdminStatus(user: AuthUserContext, id: string, dto: UpdateOfferStatusDto) {
    const offer = await this.getOffer(id);
    return this.updateStatus(user.uid, offer, dto, 'ADMIN_PROMOTIONAL_OFFER_STATUS_CHANGED');
  }

  async deleteAdmin(user: AuthUserContext, id: string) {
    const offer = await this.getOffer(id);
    return this.deleteOffer(user.uid, offer, 'ADMIN_PROMOTIONAL_OFFER_DELETED');
  }

  async stats() {
    const now = new Date();
    const { totalOffers, activeOffers, scheduledOffers, pendingApproval, expiredOffers, rejectedOffers } = await this.promotionalOffersRepository.countOfferStats(now);
    return { data: { totalOffers, activeOffers, scheduledOffers, pendingApproval, expiredOffers, rejectedOffers }, message: 'Promotional offer stats fetched successfully' };
  }

  async export(user: AuthUserContext, query: ListPromotionalOffersDto) {
    const items = await this.promotionalOffersRepository.findManyOffers({ where: this.where(query), include: this.include(), orderBy: this.order(query.sortBy, query.sortOrder), take: 10000 });
    const rows = [['ID', 'Title', 'Provider', 'Item', 'Discount Type', 'Discount Value', 'Status', 'Approval', 'Start Date', 'End Date'], ...items.map((offer) => [offer.id, offer.title, this.providerName(offer.provider), offer.item.name, offer.discountType, offer.discountValue.toString(), this.computeOfferStatus(offer), offer.approvalStatus, offer.startDate.toISOString(), offer.endDate?.toISOString() ?? ''])];
    await this.audit(user.uid, null, 'PROMOTIONAL_OFFERS_EXPORTED', undefined, { filters: query, count: items.length });
    return { content: rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'), filename: 'promotional-offers.csv', contentType: 'text/csv' };
  }

  private async list(query: ListPromotionalOffersDto | (ListProviderOffersDto & { providerId: string })) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.where(query);
    const [items, total] = 'providerId' in query && query.providerId
      ? await this.providerOffersRepository.findProviderOffersAndCount({ where, include: this.include(), orderBy: this.order(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit })
      : await this.promotionalOffersRepository.findOffersAndCount({ where, include: this.include(), orderBy: this.order(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return { data: items.map((offer) => this.toListItem(offer)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Promotional offers fetched successfully' };
  }

  private where(query: ListPromotionalOffersDto | (ListProviderOffersDto & { providerId?: string })): Prisma.PromotionalOfferWhereInput {
    return {
      deletedAt: null,
      providerId: query.providerId,
      itemId: query.itemId,
      discountType: 'discountType' in query ? query.discountType : undefined,
      ...this.statusWhere(query.status),
      ...('approvalStatus' in query && query.approvalStatus && query.approvalStatus !== PromotionalOfferApprovalFilter.ALL ? { approvalStatus: query.approvalStatus } : {}),
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }, { item: { name: { contains: query.search, mode: 'insensitive' } } }] } : {}),
      ...('startFrom' in query && (query.startFrom || query.startTo) ? { startDate: { ...(query.startFrom ? { gte: new Date(query.startFrom) } : {}), ...(query.startTo ? { lte: new Date(query.startTo) } : {}) } } : {}),
    };
  }

  private statusWhere(status?: PromotionalOfferStatusFilter): Prisma.PromotionalOfferWhereInput {
    const now = new Date();
    switch (status) {
      case PromotionalOfferStatusFilter.ACTIVE:
        return { isActive: true, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gt: now } }] };
      case PromotionalOfferStatusFilter.SCHEDULED:
        return { isActive: true, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { gt: now } };
      case PromotionalOfferStatusFilter.EXPIRED:
        return { endDate: { lte: now } };
      case PromotionalOfferStatusFilter.INACTIVE:
        return { isActive: false };
      case PromotionalOfferStatusFilter.PENDING:
        return { approvalStatus: PromotionalOfferApprovalStatus.PENDING };
      case PromotionalOfferStatusFilter.REJECTED:
        return { approvalStatus: PromotionalOfferApprovalStatus.REJECTED };
      default:
        return {};
    }
  }

  private async updateOffer(actorId: string, offer: OfferWithRelations, dto: UpdatePromotionalOfferDto, action: string, resetApprovalOnMaterialChange: boolean) {
    const discountType = dto.discountType ?? offer.discountType;
    const discountValue = dto.discountValue ?? Number(offer.discountValue);
    this.validateDiscount(discountType, discountValue, Number(offer.item.price));
    const startDate = dto.startDate ? new Date(dto.startDate) : offer.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : offer.endDate;
    this.validateDates(startDate.toISOString(), endDate?.toISOString());
    const materialChanged = this.materialChanged(dto);
    const approvalStatus = resetApprovalOnMaterialChange && materialChanged && offer.approvalStatus === PromotionalOfferApprovalStatus.APPROVED ? PromotionalOfferApprovalStatus.PENDING : offer.approvalStatus;
    const updated = await this.updateOfferRecord(offer, { title: dto.title?.trim(), description: dto.description?.trim(), discountType: dto.discountType, discountValue: dto.discountValue === undefined ? undefined : new Prisma.Decimal(dto.discountValue), startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined, eligibilityRules: dto.eligibilityRules?.trim(), isActive: dto.isActive, approvalStatus, approvedAt: approvalStatus === PromotionalOfferApprovalStatus.PENDING ? null : offer.approvedAt, approvedBy: approvalStatus === PromotionalOfferApprovalStatus.PENDING ? null : offer.approvedBy, status: this.computeStatus(dto.isActive ?? offer.isActive, approvalStatus, startDate, endDate), updatedBy: actorId });
    await this.audit(actorId, offer.id, action, this.toDetail(offer), this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Promotional offer updated successfully' };
  }

  private async updateStatus(actorId: string, offer: OfferWithRelations, dto: UpdateOfferStatusDto, action: string) {
    if (dto.isActive && offer.approvalStatus !== PromotionalOfferApprovalStatus.APPROVED) throw new BadRequestException('Offer cannot be active until approved');
    const updated = await this.updateOfferStatusRecord(offer, { isActive: dto.isActive, status: this.computeStatus(dto.isActive, offer.approvalStatus, offer.startDate, offer.endDate), updatedBy: actorId });
    await this.audit(actorId, offer.id, action, { ...this.toDetail(offer), reason: dto.reason }, this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Promotional offer status updated successfully' };
  }

  private async deleteOffer(actorId: string, offer: OfferWithRelations, action: string) {
    await this.deleteOfferRecord(offer);
    await this.audit(actorId, offer.id, action, this.toDetail(offer), null);
    return { data: null, message: 'Promotional offer deleted successfully' };
  }


  private updateOfferRecord(offer: OfferWithRelations, data: Prisma.PromotionalOfferUncheckedUpdateInput) {
    return offer.providerId ? this.providerOffersRepository.updateProviderOffer(offer.id, data) : this.promotionalOffersRepository.updateOffer(offer.id, data);
  }

  private updateOfferStatusRecord(offer: OfferWithRelations, data: Prisma.PromotionalOfferUncheckedUpdateInput) {
    return offer.providerId ? this.providerOffersRepository.updateProviderOfferStatus(offer.id, data) : this.promotionalOffersRepository.updateOfferStatus(offer.id, data);
  }

  private deleteOfferRecord(offer: OfferWithRelations) {
    return offer.providerId ? this.providerOffersRepository.deleteProviderOffer(offer.id) : this.promotionalOffersRepository.deleteOffer(offer.id);
  }

  private async getOffer(id: string, providerId?: string): Promise<OfferWithRelations> {
    const offer = providerId ? await this.providerOffersRepository.findProviderOfferById(providerId, id) : await this.promotionalOffersRepository.findOfferById(id);
    if (!offer) throw new NotFoundException('Promotional offer not found');
    return offer;
  }

  private async getProviderItem(providerId: string, itemId: string): Promise<Gift> {
    const item = await this.providerOffersRepository.findProviderItem(providerId, itemId);
    if (!item) throw new ForbiddenException('Item does not belong to provider');
    return item;
  }

  private validateDiscount(type: PromotionalOfferDiscountType, value: number, itemPrice: number) {
    if (type === PromotionalOfferDiscountType.PERCENTAGE && (value < 1 || value > 100)) throw new BadRequestException('Percentage discount must be between 1 and 100');
    if (type === PromotionalOfferDiscountType.FIXED_AMOUNT && (value <= 0 || value >= itemPrice)) throw new BadRequestException('Fixed discount must be greater than 0 and less than item price');
  }

  private validateDates(startDate: string, endDate?: string) { if (endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) throw new BadRequestException('endDate cannot be before startDate'); }
  private materialChanged(dto: UpdatePromotionalOfferDto) { return dto.title !== undefined || dto.description !== undefined || dto.discountType !== undefined || dto.discountValue !== undefined || dto.startDate !== undefined || dto.endDate !== undefined || dto.eligibilityRules !== undefined; }
  private computeStatus(isActive: boolean, approvalStatus: PromotionalOfferApprovalStatus, startDate: Date, endDate: Date | null): PromotionalOfferStatus { if (approvalStatus === PromotionalOfferApprovalStatus.PENDING) return PromotionalOfferStatus.PENDING; if (approvalStatus === PromotionalOfferApprovalStatus.REJECTED) return PromotionalOfferStatus.REJECTED; if (!isActive) return PromotionalOfferStatus.INACTIVE; const now = new Date(); if (endDate && endDate.getTime() <= now.getTime()) return PromotionalOfferStatus.EXPIRED; if (startDate.getTime() > now.getTime()) return PromotionalOfferStatus.SCHEDULED; return PromotionalOfferStatus.ACTIVE; }
  private computeOfferStatus(offer: PromotionalOffer) { return this.computeStatus(offer.isActive, offer.approvalStatus, offer.startDate, offer.endDate); }
  private order(sortBy?: PromotionalOfferSortBy, sortOrder?: SortOrder): Prisma.PromotionalOfferOrderByWithRelationInput { const field = sortBy ?? PromotionalOfferSortBy.CREATED_AT; return { [field]: sortOrder === SortOrder.ASC ? 'asc' : 'desc' }; }
  private include() { return promotionalOfferInclude; }
  private toListItem(offer: OfferWithRelations) { return { id: offer.id, title: offer.title, description: offer.description, discountType: offer.discountType, discountValue: Number(offer.discountValue), status: this.computeOfferStatus(offer), approvalStatus: offer.approvalStatus, startDate: offer.startDate, endDate: offer.endDate, isActive: offer.isActive, item: { id: offer.item.id, name: offer.item.name, imageUrl: this.firstImage(offer.item.imageUrls) }, endsInText: this.endsInText(offer.endDate) }; }
  private toDetail(offer: OfferWithRelations) { return { ...this.toListItem(offer), eligibilityRules: offer.eligibilityRules, provider: { id: offer.provider.id, name: this.providerName(offer.provider), email: offer.provider.email }, rejectionReason: offer.rejectionReason, rejectionComment: offer.rejectionComment, createdAt: offer.createdAt, updatedAt: offer.updatedAt }; }
  private providerName(provider: OfferWithRelations['provider']) { return provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private firstImage(value: Prisma.JsonValue) { return Array.isArray(value) ? value.find((item): item is string => typeof item === 'string') ?? null : null; }
  private endsInText(endDate: Date | null) { if (!endDate) return 'Ongoing'; const diff = endDate.getTime() - Date.now(); if (diff <= 0) return 'Expired'; const days = Math.ceil(diff / 86_400_000); return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`; }
  private async audit(actorId: string, targetId: string | null, action: string, beforeJson: unknown, afterJson: unknown) { await this.auditLog.write({ actorId, targetId, targetType: 'PROMOTIONAL_OFFER', action, beforeJson, afterJson }); }
}
