import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderApprovalStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { MailerService } from '../../mailer/mailer.service';
import {
  CreateProviderDto,
  ExportFormat,
  ExportProvidersDto,
  ListProviderActivityDto,
  ListProviderItemsDto,
  ListProvidersDto,
  MessageProviderDto,
  ProviderActivityType,
  ProviderLifecycleAction,
  ProviderLifecycleReason,
  ProviderLookupDto,
  ProviderSortBy,
  ProviderStatusFilter,
  ProviderStatusUpdate,
  SortOrder,
  UpdateProviderDto,
  UpdateProviderStatusDto,
} from '../dto/provider-management.dto';
import { ProviderAggregateStats, ProviderManagementRepository } from '../repositories/provider-management.repository';
import { getPagination } from '../../../common/pagination/pagination.util';

interface ProviderActivityItem {
  id: string;
  type: Exclude<ProviderActivityType, ProviderActivityType.ALL>;
  title: string;
  description: string;
  createdAt: Date;
}

interface ProviderAssetMetadata {
  businessBio?: string;
  coverImageUrl?: string;
}

@Injectable()
export class ProviderManagementService {
  private readonly logger = new Logger(ProviderManagementService.name);

  constructor(
    private readonly repository: ProviderManagementRepository,
    private readonly mailerService: MailerService,
  ) {}

  async list(query: ListProvidersDto) {
    const { page, limit, skip, take } = getPagination(query);

    if (query.sortBy === ProviderSortBy.REVENUE) {
      const providers = await this.repository.findManyProviders(query, { skip: 0, take: 10000 });
      const aggregateMap = await this.repository.findProviderAggregateMap(providers.map((provider) => provider.id));
      const direction = query.sortOrder === SortOrder.ASC ? 1 : -1;
      const sorted = [...providers].sort((left, right) => {
        const leftRevenue = aggregateMap.get(left.id)?.revenue ?? 0;
        const rightRevenue = aggregateMap.get(right.id)?.revenue ?? 0;
        return ((leftRevenue - rightRevenue) * direction) || (right.createdAt.getTime() - left.createdAt.getTime());
      });
      const paged = sorted.slice(skip, skip + take);

      return {
        data: paged.map((provider) => this.toListItem(provider, aggregateMap.get(provider.id) ?? this.zeroStats())),
        meta: { page, limit, total: sorted.length, totalPages: Math.ceil(sorted.length / limit) },
        message: 'Providers fetched successfully',
      };
    }

    const [items, total] = await Promise.all([
      this.repository.findManyProviders(query, { skip, take }),
      this.repository.countProviders(query),
    ]);
    const aggregateMap = await this.repository.findProviderAggregateMap(items.map((provider) => provider.id));

    return {
      data: items.map((provider) => this.toListItem(provider, aggregateMap.get(provider.id) ?? this.zeroStats())),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Providers fetched successfully',
    };
  }

  async stats() {
    const stats = await this.repository.findProviderPlatformStats();
    const inactiveRate = stats.totalProviders === 0 ? 0 : this.round((stats.inactiveProviders / stats.totalProviders) * 100);
    const previousInactiveRate = stats.totalProvidersPreviousPeriod === 0
      ? 0
      : this.round((stats.inactiveProvidersPreviousPeriod / stats.totalProvidersPreviousPeriod) * 100);

    return {
      data: {
        totalProviders: stats.totalProviders,
        totalProvidersChangePercent: this.changePercent(stats.totalProvidersCurrentPeriod, stats.totalProvidersPreviousPeriod),
        pendingApproval: stats.pendingApproval,
        activeRevenue: stats.activeRevenue,
        activeRevenueChangePercent: this.changePercent(stats.activeRevenueCurrentPeriod, stats.activeRevenuePreviousPeriod),
        inactiveRate,
        inactiveRateChangePercent: this.changePercent(inactiveRate, previousInactiveRate),
      },
      message: 'Provider stats fetched successfully',
    };
  }

  async details(id: string) {
    const provider = await this.getProvider(id);
    const stats = await this.repository.findSingleProviderAggregate(id);
    return {
      data: this.toDetail(provider, stats),
      message: 'Provider details fetched successfully',
    };
  }

  async lookup(query: ProviderLookupDto) {
    const providers = await this.repository.findProviderLookup(query);

    return {
      data: providers.map((provider) => ({ id: provider.id, businessName: this.businessName(provider), email: provider.email })),
      message: 'Provider lookup fetched successfully',
    };
  }

  async create(user: AuthUserContext, dto: CreateProviderDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.repository.findProviderByEmail(email);
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Email already exists');
    }
    await this.getProviderBusinessCategory(dto.businessCategoryId);
    await this.validateBrandingUploads(dto);

    const shouldGeneratePassword = dto.generateTemporaryPassword ?? true;
    if (!shouldGeneratePassword && !dto.password) {
      throw new BadRequestException('Password is required when generateTemporaryPassword is false');
    }
    const password = shouldGeneratePassword ? this.generateTemporaryPassword() : dto.password;
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    this.assertPasswordMeetsSecurity(password);

    const approvalStatus = dto.approvalStatus ?? ProviderApprovalStatus.PENDING;
    const provider = await this.repository.createProviderWithUser({
        email,
        password: await bcrypt.hash(password, 10),
        firstName: dto.name.trim(),
        lastName: '',
        phone: dto.contact.trim(),
        avatarUrl: dto.companyLogoUrl?.trim(),
        role: UserRole.PROVIDER,
        isActive: dto.isActive ?? true,
        isApproved: approvalStatus === ProviderApprovalStatus.APPROVED,
        isVerified: true,
        mustChangePassword: dto.mustChangePassword ?? true,
        location: dto.location ? `${dto.location.lat},${dto.location.lng}` : undefined,
        providerLegalName: dto.businessName.trim(),
        providerBusinessEmail: email,
        providerBusinessPhone: dto.contact.trim(),
        providerBusinessName: dto.businessName.trim(),
        providerBusinessCategoryId: dto.businessCategoryId,
        providerTaxId: dto.taxId?.trim(),
        providerBusinessAddress: dto.businessAddress.trim(),
        providerStoreAddress: dto.location ? { lat: dto.location.lat, lng: dto.location.lng } : undefined,
        providerDocuments: this.providerAssetMetadata(dto),
        providerApprovalStatus: approvalStatus,
        providerApprovedAt: approvalStatus === ProviderApprovalStatus.APPROVED ? new Date() : null,
        providerApprovedBy: approvalStatus === ProviderApprovalStatus.APPROVED ? user.uid : null,
    });

    const inviteEmailSent = dto.sendInviteEmail ?? true
      ? await this.sendProviderInvite(provider, password, approvalStatus)
      : false;

    await this.recordAudit(user.uid, provider.id, 'PROVIDER_CREATED_BY_ADMIN', null, {
      actorId: user.uid,
      targetId: provider.id,
      action: 'PROVIDER_CREATED_BY_ADMIN',
      approvalStatus,
      inviteEmailSent,
    });

    return {
      data: {
        id: provider.id,
        userId: provider.id,
        name: this.name(provider),
        email: provider.email,
        contact: provider.phone,
        businessName: this.businessName(provider),
        companyLogoUrl: provider.avatarUrl,
        coverImageUrl: this.providerAssets(provider).coverImageUrl ?? null,
        approvalStatus: provider.providerApprovalStatus,
        isActive: provider.isActive,
        inviteEmailSent,
      },
      message: (dto.sendInviteEmail ?? true) && !inviteEmailSent
        ? 'Provider created successfully, but invite email could not be sent.'
        : inviteEmailSent
          ? 'Provider created successfully and invite email sent.'
          : 'Provider created successfully.',
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderDto) {
    const provider = await this.getProvider(id);
    const stats = await this.repository.findSingleProviderAggregate(id);
    const before = this.toDetail(provider, stats);
    const updated = await this.repository.updateProvider(provider.id, {
        firstName: dto.businessName?.trim(),
        lastName: dto.businessName ? 'Provider' : undefined,
        phone: dto.phone?.trim(),
        avatarUrl: dto.avatarUrl?.trim(),
        location: dto.headquarters?.trim(),
        providerBusinessName: dto.businessName?.trim(),
        providerServiceArea: dto.serviceArea?.trim(),
        providerDocuments: dto.documentUrls,
    });
    await this.recordAudit(user.uid, provider.id, 'PROVIDER_UPDATED', before, this.toDetail(updated, stats));

    return {
      data: this.toDetail(updated, stats),
      message: 'Provider updated successfully',
    };
  }

  async updateStatus(user: AuthUserContext, id: string, dto: UpdateProviderStatusDto) {
    this.assertCanRunLifecycleAction(user, dto.action);
    const provider = await this.getProvider(id);
    this.validateLifecycleAction(provider, dto);

    switch (dto.action) {
      case ProviderLifecycleAction.APPROVE:
        return this.approveProvider(user, provider, dto);
      case ProviderLifecycleAction.REJECT:
        return this.rejectProvider(user, provider, dto);
      case ProviderLifecycleAction.SUSPEND:
        return this.suspendProvider(user, provider, dto);
      case ProviderLifecycleAction.UNSUSPEND:
        return this.unsuspendProvider(user, provider, dto);
      case ProviderLifecycleAction.UPDATE_STATUS:
        return this.updateProviderStatus(user, provider, dto);
    }
  }

  private assertCanRunLifecycleAction(user: AuthUserContext, action: ProviderLifecycleAction): void {
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Your role does not have the required provider lifecycle permission');
    }

    const requiredPermission = this.lifecyclePermission(action);
    const grantedPermissions = this.flattenPermissions(user.permissions);
    if (!grantedPermissions.has(requiredPermission)) {
      throw new ForbiddenException('Your role does not have the required provider lifecycle permission');
    }
  }

  private lifecyclePermission(action: ProviderLifecycleAction): string {
    switch (action) {
      case ProviderLifecycleAction.APPROVE:
        return 'providers.approve';
      case ProviderLifecycleAction.REJECT:
        return 'providers.reject';
      case ProviderLifecycleAction.SUSPEND:
      case ProviderLifecycleAction.UNSUSPEND:
        return 'providers.suspend';
      case ProviderLifecycleAction.UPDATE_STATUS:
        return 'providers.updateStatus';
    }
  }

  private flattenPermissions(permissions?: AuthUserContext['permissions']): Set<string> {
    const granted = new Set<string>();
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
      return granted;
    }

    for (const [module, values] of Object.entries(permissions)) {
      if (!Array.isArray(values)) {
        continue;
      }

      for (const value of values) {
        if (typeof value === 'string') {
          granted.add(`${module}.${value}`);
          granted.add(`${module}.${this.normalizePermission(value)}`);
        }
      }
    }

    return granted;
  }

  private normalizePermission(permission: string): string {
    if (permission === 'updateStatus') {
      return 'status.update';
    }

    if (permission === 'status.update') {
      return 'updateStatus';
    }

    return permission;
  }


  async permanentlyDelete(user: AuthUserContext, id: string) {
    const provider = await this.getProvider(id);
    const activeOrders = await this.repository.countActiveProcessingOrders(provider.id);
    if (activeOrders > 0) {
      throw new ConflictException('Provider has active processing orders and cannot be permanently deleted');
    }

    await this.repository.deleteProviderPermanently({
      actorId: user.uid,
      providerId: provider.id,
      providerEmail: provider.email,
      providerRole: provider.role,
      reason: 'Deleted by Super Admin',
      deleteRelatedRecords: true,
    });

    return {
      data: { deletedProviderId: provider.id, deletedRelatedRecords: true },
      message: 'Provider permanently deleted successfully.',
    };
  }

  async items(id: string, query: ListProviderItemsDto) {
    await this.getProvider(id);
    const { page, limit, skip, take } = getPagination(query);
    const { items, total } = await this.repository.findProviderListedItems(id, query);

    return {
      data: items.slice(skip, skip + take),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Provider items fetched successfully',
    };
  }

  async activity(id: string, query: ListProviderActivityDto) {
    const provider = await this.getProvider(id);
    const { page, limit, skip, take } = getPagination(query);
    const requestedType = query.type ?? ProviderActivityType.ALL;
    const logs = await this.repository.findProviderActivity(provider.id);
    const activities = logs
      .map((log): ProviderActivityItem => this.toAuditActivity(log))
      .filter((activity) => requestedType === ProviderActivityType.ALL || activity.type === requestedType);

    return {
      data: activities.slice(skip, skip + take),
      meta: { page, limit, total: activities.length, totalPages: Math.ceil(activities.length / limit) },
      message: 'Provider activity fetched successfully',
    };
  }

  async export(query: ExportProvidersDto) {
    const providers = await this.repository.findManyProviders(query, { skip: 0, take: 10000 });
    const aggregateMap = await this.repository.findProviderAggregateMap(providers.map((provider) => provider.id));
    const rows = this.toExportRows(providers, aggregateMap);
    const isXlsx = query.format === ExportFormat.XLSX;

    return {
      filename: `providers.${isXlsx ? 'xlsx' : 'csv'}`,
      contentType: isXlsx
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8',
      content: isXlsx ? this.buildXlsxExport(rows) : this.buildCsvExport(rows),
    };
  }

  async message(user: AuthUserContext, id: string, dto: MessageProviderDto) {
    const provider = await this.getProvider(id);
    await this.mailerService.sendProviderMessageEmail(provider.email, dto.subject, dto.message);
    await this.recordAudit(user.uid, provider.id, 'PROVIDER_MESSAGE_SENT', null, { subject: dto.subject, channel: dto.channel });

    return { data: null, message: 'Message sent to provider successfully' };
  }

  private async getProvider(id: string): Promise<User> {
    const provider = await this.repository.findProviderById(id);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  private toListItem(provider: User, stats: ProviderAggregateStats) {
    return {
      id: provider.id,
      providerCode: this.providerCode(provider.id),
      businessName: this.businessName(provider),
      email: provider.email,
      phone: provider.phone,
      avatarUrl: provider.avatarUrl,
      name: this.name(provider),
      companyLogoUrl: provider.avatarUrl,
      coverImageUrl: this.providerAssets(provider).coverImageUrl ?? null,
      status: this.toStatus(provider),
      isActive: provider.isActive,
      approvalStatus: provider.providerApprovalStatus ?? ProviderApprovalStatus.PENDING,
      revenue: stats.revenue,
      listedItems: stats.listedItems,
      performanceStats: stats.performanceStats,
      registeredSince: provider.createdAt,
      createdAt: provider.createdAt,
    };
  }

  private toDetail(provider: User, stats: ProviderAggregateStats) {
    return {
      ...this.toListItem(provider, stats),
      headquarters: provider.location,
      location: this.providerLocation(provider),
      serviceArea: provider.providerServiceArea,
      businessBio: this.providerAssets(provider).businessBio ?? null,
      verification: {
        status: provider.isVerified ? 'TIER_2_VERIFIED' : 'UNVERIFIED',
        label: provider.isVerified ? 'Tier 2 Verified Provider' : 'Unverified Provider',
      },
      stats: {
        performanceStats: stats.performanceStats,
        performanceChangePercent: stats.performanceChangePercent,
        listedItems: stats.listedItems,
        listedItemsChange: stats.listedItemsChange,
        orderFulfillment: stats.orderFulfillment,
        orderFulfillmentChangePercent: stats.orderFulfillmentChangePercent,
        disputeCount: stats.disputeCount,
        disputeChangePercent: stats.disputeChangePercent,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
      },
      suspension: this.toSuspension(provider),
    };
  }

  private toStatus(provider: User): ProviderStatusFilter {
    if (provider.suspendedAt) {
      return ProviderStatusFilter.SUSPENDED;
    }

    if (!provider.isActive) {
      return ProviderStatusFilter.INACTIVE;
    }

    return provider.providerApprovalStatus === ProviderApprovalStatus.APPROVED
      ? ProviderStatusFilter.ACTIVE
      : ProviderStatusFilter.INACTIVE;
  }

  private toSuspension(provider: User) {
    return {
      isSuspended: !!provider.suspendedAt,
      reason: provider.suspensionReason,
      comment: provider.suspensionComment,
      suspendedAt: provider.suspendedAt,
      suspendedBy: provider.suspendedBy,
    };
  }

  private toAuditActivity(log: { id: string; action: string; createdAt: Date }): ProviderActivityItem {
    const type = this.toActivityType(log.action);
    return {
      id: log.id,
      type,
      title: this.titleCase(log.action.replace('PROVIDER_', '').replaceAll('_', ' ')),
      description: 'Provider management action recorded',
      createdAt: log.createdAt,
    };
  }

  private toActivityType(action: string): Exclude<ProviderActivityType, ProviderActivityType.ALL> {
    if (action.includes('APPROVED')) {
      return ProviderActivityType.APPROVAL;
    }

    if (action.includes('REJECTED')) {
      return ProviderActivityType.REJECTION;
    }

    if (action.includes('STATUS')) {
      return ProviderActivityType.STATUS_CHANGE;
    }

    return ProviderActivityType.PROFILE_UPDATE;
  }

  private toExportRows(providers: User[], aggregateMap: Map<string, ProviderAggregateStats>): string[][] {
    return [
      ['ID', 'Provider Code', 'Business Name', 'Email', 'Phone', 'Status', 'Approval Status', 'Revenue', 'Listed Items', 'Order Fulfillment', 'Dispute Count', 'Average Rating', 'Review Count', 'Registered Since'],
      ...providers.map((provider) => {
        const stats = aggregateMap.get(provider.id) ?? this.zeroStats();
        return [
        provider.id,
        this.providerCode(provider.id),
        this.businessName(provider),
        provider.email,
        provider.phone ?? '',
        this.toStatus(provider),
        provider.providerApprovalStatus ?? ProviderApprovalStatus.PENDING,
        String(stats.revenue),
        String(stats.listedItems),
        String(stats.orderFulfillment),
        String(stats.disputeCount),
        String(stats.averageRating),
        String(stats.reviewCount),
        provider.createdAt.toISOString(),
      ];
      }),
    ];
  }

  private buildCsvExport(rows: string[][]): string {
    return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
  }

  private buildXlsxExport(rows: string[][]): Buffer {
    const sheetRows = rows
      .map((row, rowIndex) => `<row r="${rowIndex + 1}">${row
        .map((cell, cellIndex) => `<c r="${this.columnName(cellIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${this.xmlEscape(cell)}</t></is></c>`)
        .join('')}</row>`)
      .join('');
    return this.zipStore({
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Providers" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
    });
  }

  private zipStore(files: Record<string, string>): Buffer {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
      const nameBuffer = Buffer.from(name);
      const contentBuffer = Buffer.from(content);
      const crc = this.crc32(contentBuffer);
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(contentBuffer.length, 18);
      localHeader.writeUInt32LE(contentBuffer.length, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);
      localParts.push(localHeader, nameBuffer, contentBuffer);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(contentBuffer.length, 20);
      centralHeader.writeUInt32LE(contentBuffer.length, 24);
      centralHeader.writeUInt16LE(nameBuffer.length, 28);
      centralHeader.writeUInt32LE(offset, 42);
      centralParts.push(centralHeader, nameBuffer);
      offset += localHeader.length + nameBuffer.length + contentBuffer.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(Object.keys(files).length, 8);
    end.writeUInt16LE(Object.keys(files).length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);

    return Buffer.concat([...localParts, centralDirectory, end]);
  }

  private crc32(buffer: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  private columnName(index: number): string {
    let column = '';
    let cursor = index + 1;
    while (cursor > 0) {
      const remainder = (cursor - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      cursor = Math.floor((cursor - 1) / 26);
    }

    return column;
  }

  private xmlEscape(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }



  private async sendProviderInvite(provider: User, temporaryPassword: string, approvalStatus: ProviderApprovalStatus): Promise<boolean> {
    try {
      await this.mailerService.sendProviderInviteEmail({
        email: provider.email,
        providerName: `${provider.firstName} ${provider.lastName}`.trim(),
        businessName: this.businessName(provider),
        temporaryPassword,
        mustChangePassword: provider.mustChangePassword,
        approvalStatus,
      });
      return true;
    } catch {
      return false;
    }
  }

  private assertPasswordMeetsSecurity(password: string): void {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      throw new BadRequestException('Password does not meet security requirements.');
    }
  }

  private async getProviderBusinessCategory(categoryId: string): Promise<void> {
    const category = await this.repository.findProviderBusinessCategory(categoryId);
    if (!category) {
      throw new NotFoundException('Provider business category not found');
    }
  }

  private async validateBrandingUploads(dto: CreateProviderDto): Promise<void> {
    const requested = [
      ...(dto.companyLogoUrl ? [{ kind: 'company logo', url: dto.companyLogoUrl.trim(), allowedFolders: ['provider-logos'] }] : []),
      ...(dto.coverImageUrl ? [{ kind: 'cover image', url: dto.coverImageUrl.trim(), allowedFolders: ['provider-covers', 'provider-cover'] }] : []),
    ];

    if (!requested.length) {
      return;
    }

    const uploads = await this.repository.findCompletedUploadsByUrls(requested.map((item) => item.url));
    const uploadByUrl = new Map(uploads.map((upload) => [upload.fileUrl, upload]));

    for (const item of requested) {
      const upload = uploadByUrl.get(item.url);
      if (!upload) {
        continue;
      }

      if (!item.allowedFolders.includes(upload.folder)) {
        throw new BadRequestException(`${this.titleCase(item.kind)} must use ${item.allowedFolders.join(' or ')} uploads.`);
      }

      if (upload.sizeBytes !== null && upload.sizeBytes > 5 * 1024 * 1024) {
        throw new BadRequestException(`${this.titleCase(item.kind)} must be 5MB or smaller.`);
      }
    }
  }

  private providerAssetMetadata(dto: CreateProviderDto): Prisma.InputJsonObject | undefined {
    const metadata: Record<string, string> = {};
    if (dto.businessBio?.trim()) {
      metadata.businessBio = dto.businessBio.trim();
    }
    if (dto.coverImageUrl?.trim()) {
      metadata.coverImageUrl = dto.coverImageUrl.trim();
    }
    return Object.keys(metadata).length ? metadata : undefined;
  }

  private providerAssets(provider: User): ProviderAssetMetadata {
    const value = provider.providerDocuments;
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {};
    }

    return {
      businessBio: typeof value.businessBio === 'string' ? value.businessBio : undefined,
      coverImageUrl: typeof value.coverImageUrl === 'string' ? value.coverImageUrl : undefined,
    };
  }

  private providerLocation(provider: User): { lat: number; lng: number } | null {
    const value = provider.providerStoreAddress;
    if (value && !Array.isArray(value) && typeof value === 'object') {
      const lat = value.lat;
      const lng = value.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }
    }
    return null;
  }

  private validateLifecycleAction(provider: User, dto: UpdateProviderStatusDto): void {
    if (dto.action === ProviderLifecycleAction.REJECT && !dto.reason) {
      throw new BadRequestException('Reason is required when rejecting a provider');
    }

    if (dto.action === ProviderLifecycleAction.SUSPEND && !dto.reason) {
      throw new BadRequestException('Reason is required when suspending a provider');
    }

    if (dto.action === ProviderLifecycleAction.UPDATE_STATUS && !dto.status) {
      throw new BadRequestException('Status is required when updating provider status');
    }

    if (dto.action === ProviderLifecycleAction.UPDATE_STATUS && dto.status === ProviderStatusUpdate.SUSPENDED && !dto.reason) {
      throw new BadRequestException('Reason is required when suspending a provider');
    }

    if (dto.action === ProviderLifecycleAction.UNSUSPEND) {
      if (provider.providerApprovalStatus !== ProviderApprovalStatus.APPROVED) {
        throw new BadRequestException('Only approved providers can be unsuspended');
      }

      if (provider.isActive && !provider.suspendedAt) {
        throw new BadRequestException('Provider is not suspended or inactive');
      }
    }
  }

  private async approveProvider(user: AuthUserContext, provider: User, dto: UpdateProviderStatusDto) {
    const before = this.toLifecycleResponse(provider);
    const updated = await this.repository.updateProviderLifecycleStatus(provider.id, {
        isApproved: true,
        isActive: true,
        providerApprovalStatus: ProviderApprovalStatus.APPROVED,
        providerApprovedAt: new Date(),
        providerApprovedBy: user.uid,
        providerRejectedAt: null,
        providerRejectedBy: null,
        providerRejectionReason: null,
        providerRejectionComment: null,
        suspensionReason: null,
        suspensionComment: null,
        suspendedAt: null,
        suspendedBy: null,
    });
    await this.repository.deactivateActiveAccountSuspensions(provider.id, user.uid);
    return this.completeLifecycleAction(user, provider.id, 'PROVIDER_APPROVED', before, updated, dto, 'Provider approved successfully.');
  }

  private async rejectProvider(user: AuthUserContext, provider: User, dto: UpdateProviderStatusDto) {
    const before = this.toLifecycleResponse(provider);
    const updated = await this.repository.updateProviderLifecycleStatus(provider.id, {
        isApproved: false,
        isActive: false,
        providerApprovalStatus: ProviderApprovalStatus.REJECTED,
        providerRejectedAt: new Date(),
        providerRejectedBy: user.uid,
        providerRejectionReason: dto.reason,
        providerRejectionComment: dto.comment?.trim(),
        refreshTokenHash: null,
    });
    return this.completeLifecycleAction(user, provider.id, 'PROVIDER_REJECTED', before, updated, dto, 'Provider rejected successfully.');
  }

  private async updateProviderStatus(user: AuthUserContext, provider: User, dto: UpdateProviderStatusDto) {
    if (dto.status === ProviderStatusUpdate.SUSPENDED) {
      return this.suspendProvider(user, provider, { ...dto, action: ProviderLifecycleAction.SUSPEND });
    }

    const before = this.toLifecycleResponse(provider);
    if (provider.suspendedAt && dto.status === ProviderStatusUpdate.ACTIVE) {
      await this.repository.deactivateActiveAccountSuspensions(provider.id, user.uid);
    }
    const updated = await this.repository.updateProviderLifecycleStatus(provider.id, {
        isActive: dto.status === ProviderStatusUpdate.ACTIVE,
        suspensionReason: null,
        suspensionComment: null,
        suspendedAt: null,
        suspendedBy: null,
        refreshTokenHash: dto.status === ProviderStatusUpdate.ACTIVE ? provider.refreshTokenHash : null,
    });
    return this.completeLifecycleAction(user, provider.id, 'PROVIDER_STATUS_UPDATED', before, updated, dto, 'Provider status updated successfully.');
  }

  private async suspendProvider(user: AuthUserContext, provider: User, dto: UpdateProviderStatusDto) {
    const before = this.toLifecycleResponse(provider);
    await this.repository.createAccountSuspension({
      accountId: provider.id,
      reason: dto.reason ?? ProviderLifecycleReason.OTHER,
      comment: dto.comment?.trim(),
      suspendedBy: user.uid,
    });
    const updated = await this.repository.updateProviderLifecycleStatus(provider.id, {
        isActive: false,
        suspensionReason: dto.reason,
        suspensionComment: dto.comment?.trim(),
        suspendedAt: new Date(),
        suspendedBy: user.uid,
        refreshTokenHash: null,
    });
    return this.completeLifecycleAction(user, provider.id, 'PROVIDER_SUSPENDED', before, updated, dto, 'Provider suspended successfully.');
  }

  private async unsuspendProvider(user: AuthUserContext, provider: User, dto: UpdateProviderStatusDto) {
    const before = this.toLifecycleResponse(provider);
    await this.repository.deactivateActiveAccountSuspensions(provider.id, user.uid);
    const updated = await this.repository.updateProviderLifecycleStatus(provider.id, {
        isActive: true,
        suspensionReason: null,
        suspensionComment: null,
        suspendedAt: null,
        suspendedBy: null,
    });
    return this.completeLifecycleAction(user, provider.id, 'PROVIDER_UNSUSPENDED', before, updated, dto, 'Provider unsuspended successfully.');
  }

  private async completeLifecycleAction(
    user: AuthUserContext,
    providerId: string,
    action: string,
    beforeJson: unknown,
    updated: User,
    dto: UpdateProviderStatusDto,
    message: string,
  ) {
    const response = this.toLifecycleResponse(updated);
    await this.recordAudit(user.uid, providerId, action, beforeJson, {
      ...response,
      actorId: user.uid,
      targetId: providerId,
      action,
      reason: dto.reason,
      comment: dto.comment,
      notifyProvider: dto.notifyProvider ?? true,
    });
    await this.notifyProvider(updated, dto.notifyProvider ?? true, action, dto.comment);
    return { data: response, message };
  }

  private toLifecycleResponse(provider: User) {
    return {
      id: provider.id,
      approvalStatus: provider.providerApprovalStatus ?? ProviderApprovalStatus.PENDING,
      status: this.toStatus(provider),
      isActive: provider.isActive,
      rejectionReason: provider.providerRejectionReason,
      suspensionReason: provider.suspensionReason,
      approvedAt: provider.providerApprovedAt,
      rejectedAt: provider.providerRejectedAt,
      suspendedAt: provider.suspendedAt,
    };
  }

  private async notifyProvider(
    provider: User,
    notifyProvider: boolean | undefined,
    status: string,
    comment?: string,
  ): Promise<void> {
    if (!notifyProvider) {
      return;
    }

    await this.repository.createProviderNotification({
        recipientId: provider.id,
        recipientType: NotificationRecipientType.PROVIDER,
        title: this.providerNotificationTitle(status),
        message: this.providerNotificationMessage(status),
        type: status,
        metadataJson: { action: status },
    });

    try {
      if (status === 'PROVIDER_APPROVED') {
        await this.mailerService.sendProviderApprovedEmail(provider.email, this.businessName(provider));
        return;
      }

      if (status === 'PROVIDER_REJECTED') {
        await this.mailerService.sendProviderRejectedEmail(provider.email, this.businessName(provider), provider.providerRejectionReason ?? undefined, comment);
        return;
      }

      await this.mailerService.sendAccountStatusEmail(provider.email, this.providerNotificationTitle(status), comment);
    } catch (error) {
      this.logger.warn(`Provider lifecycle email skipped for ${provider.id} (${status}): ${error instanceof Error ? error.message : 'unknown email error'}`);
    }
  }

  private providerNotificationTitle(action: string): string {
    switch (action) {
      case 'PROVIDER_APPROVED':
        return 'Provider approved';
      case 'PROVIDER_REJECTED':
        return 'Provider rejected';
      case 'PROVIDER_SUSPENDED':
        return 'Provider suspended';
      case 'PROVIDER_UNSUSPENDED':
        return 'Provider unsuspended';
      default:
        return 'Provider status updated';
    }
  }

  private providerNotificationMessage(action: string): string {
    switch (action) {
      case 'PROVIDER_APPROVED':
        return 'Your provider account has been approved.';
      case 'PROVIDER_REJECTED':
        return 'Your provider account application was rejected.';
      case 'PROVIDER_SUSPENDED':
        return 'Your provider account has been suspended.';
      case 'PROVIDER_UNSUSPENDED':
        return 'Your provider account has been restored.';
      default:
        return 'Your provider account status has been updated.';
    }
  }

  private async recordAudit(
    actorId: string | null,
    targetId: string | null,
    action: string,
    beforeJson: unknown,
    afterJson: unknown,
  ): Promise<void> {
    await this.repository.createAuditLog({
        actorId,
        targetId,
        targetType: this.inferTargetType(action),
        action,
        beforeJson: beforeJson === null ? undefined : (beforeJson),
        afterJson: afterJson === null ? undefined : (afterJson),
    });
  }

  private businessName(provider: User): string {
    return provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim();
  }

  private name(provider: User): string {
    return `${provider.firstName} ${provider.lastName}`.trim();
  }

  private providerCode(id: string): string {
    return `PROV-${id.slice(-6).toUpperCase()}`;
  }

  private zeroStats(): ProviderAggregateStats {
    return {
      revenue: 0,
      performanceStats: 0,
      performanceChangePercent: 0,
      listedItems: 0,
      listedItemsChange: 0,
      orderFulfillment: 0,
      orderFulfillmentChangePercent: 0,
      disputeCount: 0,
      disputeChangePercent: 0,
      averageRating: 0,
      reviewCount: 0,
    };
  }

  private changePercent(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return this.round(((current - previous) / previous) * 100);
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private generateTemporaryPassword(): string {
    return `Gift-${randomBytes(6).toString('hex')}1!`;
  }

  private inferTargetType(action: string): string | null {
    if (action.startsWith('ADMIN_ROLE')) {
      return 'ADMIN_ROLE';
    }

    if (action.startsWith('ADMIN')) {
      return 'ADMIN';
    }

    if (action.startsWith('REGISTERED_USER')) {
      return 'REGISTERED_USER';
    }

    if (action.startsWith('PROVIDER')) {
      return 'PROVIDER';
    }

    return null;
  }


  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }
}
