import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProviderApprovalStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import {
  ApproveProviderDto,
  CreateProviderDto,
  ExportFormat,
  ExportProvidersDto,
  ListProviderActivityDto,
  ListProviderItemsDto,
  ListProvidersDto,
  MessageProviderDto,
  ProviderActivityType,
  ProviderItemStatus,
  ProviderSortBy,
  ProviderStatusFilter,
  ProviderStatusUpdate,
  RejectProviderDto,
  SortOrder,
  UpdateProviderDto,
  UpdateProviderStatusDto,
} from './dto/provider-management.dto';

interface ProviderStats {
  revenue: number;
  performanceStats: number;
  performanceChangePercent: number;
  listedItems: number;
  listedItemsChange: number;
  orderFulfillment: number;
  orderFulfillmentChangePercent: number;
  disputeCount: number;
  disputeChangePercent: number;
}

interface ProviderActivityItem {
  id: string;
  type: Exclude<ProviderActivityType, ProviderActivityType.ALL>;
  title: string;
  description: string;
  createdAt: Date;
}

@Injectable()
export class ProviderManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async list(query: ListProvidersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildProviderWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: this.toOrderBy(query.sortBy, query.sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items.map((provider) => this.toListItem(provider, this.emptyProviderStats())),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Providers fetched successfully',
    };
  }

  async stats() {
    const [totalProviders, pendingApproval, inactiveProviders] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, deletedAt: null } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, deletedAt: null, providerApprovalStatus: ProviderApprovalStatus.PENDING } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, deletedAt: null, isActive: false } }),
    ]);
    const inactiveRate = totalProviders === 0 ? 0 : Number(((inactiveProviders / totalProviders) * 100).toFixed(2));

    return {
      data: {
        totalProviders,
        totalProvidersChangePercent: 0,
        pendingApproval,
        activeRevenue: 0,
        activeRevenueChangePercent: 0,
        inactiveRate,
        inactiveRateChangePercent: 0,
      },
      message: 'Provider stats fetched successfully',
    };
  }

  async details(id: string) {
    const provider = await this.getProvider(id);
    return {
      data: this.toDetail(provider, this.emptyProviderStats()),
      message: 'Provider details fetched successfully',
    };
  }

  async create(user: AuthUserContext, dto: CreateProviderDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Email already exists');
    }

    const approvalStatus = dto.approvalStatus ?? ProviderApprovalStatus.PENDING;
    const password = this.generateTemporaryPassword();
    const provider = await this.prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        firstName: dto.businessName.trim(),
        lastName: 'Provider',
        phone: dto.phone?.trim(),
        role: UserRole.PROVIDER,
        isActive: dto.isActive ?? true,
        isApproved: approvalStatus === ProviderApprovalStatus.APPROVED,
        isVerified: true,
        mustChangePassword: dto.mustChangePassword ?? true,
        location: dto.headquarters?.trim(),
        providerBusinessName: dto.businessName.trim(),
        providerServiceArea: dto.serviceArea?.trim(),
        providerDocuments: dto.documentUrls ?? [],
        providerApprovalStatus: approvalStatus,
        providerApprovedAt: approvalStatus === ProviderApprovalStatus.APPROVED ? new Date() : null,
        providerApprovedBy: approvalStatus === ProviderApprovalStatus.APPROVED ? user.uid : null,
      },
    });
    await this.recordAudit(user.uid, provider.id, 'PROVIDER_CREATED', null, this.toDetail(provider, this.emptyProviderStats()));

    return {
      data: this.toDetail(provider, this.emptyProviderStats()),
      message: 'Provider created successfully',
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderDto) {
    const provider = await this.getProvider(id);
    const before = this.toDetail(provider, this.emptyProviderStats());
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        firstName: dto.businessName?.trim(),
        lastName: dto.businessName ? 'Provider' : undefined,
        phone: dto.phone?.trim(),
        avatarUrl: dto.avatarUrl?.trim(),
        location: dto.headquarters?.trim(),
        providerBusinessName: dto.businessName?.trim(),
        providerServiceArea: dto.serviceArea?.trim(),
        providerDocuments: dto.documentUrls,
      },
    });
    await this.recordAudit(user.uid, provider.id, 'PROVIDER_UPDATED', before, this.toDetail(updated, this.emptyProviderStats()));

    return {
      data: this.toDetail(updated, this.emptyProviderStats()),
      message: 'Provider updated successfully',
    };
  }

  async approve(user: AuthUserContext, id: string, dto: ApproveProviderDto) {
    const provider = await this.getProvider(id);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isApproved: true,
        isActive: true,
        providerApprovalStatus: ProviderApprovalStatus.APPROVED,
        providerApprovedAt: new Date(),
        providerApprovedBy: user.uid,
        providerRejectedAt: null,
        providerRejectedBy: null,
        providerRejectionReason: null,
        providerRejectionComment: null,
      },
    });
    const response = {
      id: updated.id,
      approvalStatus: updated.providerApprovalStatus,
      status: this.toStatus(updated),
      approvedAt: updated.providerApprovedAt,
      approvedBy: updated.providerApprovedBy,
    };
    await this.recordAudit(user.uid, provider.id, 'PROVIDER_APPROVED', null, response);
    await this.notifyProvider(updated, dto.notifyProvider, 'APPROVED', dto.comment);

    return { data: response, message: 'Provider approved successfully' };
  }

  async reject(user: AuthUserContext, id: string, dto: RejectProviderDto) {
    const provider = await this.getProvider(id);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isApproved: false,
        providerApprovalStatus: ProviderApprovalStatus.REJECTED,
        providerRejectedAt: new Date(),
        providerRejectedBy: user.uid,
        providerRejectionReason: dto.reason,
        providerRejectionComment: dto.comment?.trim(),
      },
    });
    const response = {
      id: updated.id,
      approvalStatus: updated.providerApprovalStatus,
      rejectedAt: updated.providerRejectedAt,
      rejectedBy: updated.providerRejectedBy,
      rejectionReason: updated.providerRejectionReason,
      rejectionComment: updated.providerRejectionComment,
    };
    await this.recordAudit(user.uid, provider.id, 'PROVIDER_REJECTED', null, response);
    await this.notifyProvider(updated, dto.notifyProvider, 'REJECTED', dto.comment);

    return { data: response, message: 'Provider rejected successfully' };
  }

  async updateStatus(user: AuthUserContext, id: string, dto: UpdateProviderStatusDto) {
    if (dto.status === ProviderStatusUpdate.SUSPENDED && !dto.reason) {
      throw new BadRequestException('Suspension reason is required');
    }

    const provider = await this.getProvider(id);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isActive: dto.status === ProviderStatusUpdate.ACTIVE,
        suspensionReason: dto.status === ProviderStatusUpdate.SUSPENDED ? dto.reason : null,
        suspensionComment: dto.status === ProviderStatusUpdate.SUSPENDED ? dto.comment?.trim() : null,
        suspendedAt: dto.status === ProviderStatusUpdate.SUSPENDED ? new Date() : null,
        suspendedBy: dto.status === ProviderStatusUpdate.SUSPENDED ? user.uid : null,
        refreshTokenHash: dto.status === ProviderStatusUpdate.ACTIVE ? provider.refreshTokenHash : null,
      },
    });
    const response = {
      id: updated.id,
      status: this.toStatus(updated),
      isActive: updated.isActive,
      suspension: this.toSuspension(updated),
    };
    await this.recordAudit(user.uid, provider.id, `PROVIDER_STATUS_${dto.status}`, null, response);
    await this.notifyProvider(updated, dto.notifyProvider, dto.status, dto.comment);

    return {
      data: response,
      message: dto.status === ProviderStatusUpdate.SUSPENDED
        ? 'Provider suspended successfully'
        : 'Provider status updated successfully',
    };
  }

  async items(id: string, query: ListProviderItemsDto) {
    await this.getProvider(id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sampleItems = [
      {
        id: 'demo-item-1',
        name: 'Premium Gift Box',
        price: 45,
        currency: 'USD',
        salesCount: 850,
        salesPercentage: 70,
        status: ProviderItemStatus.ACTIVE,
        imageUrl: 'https://cdn.example.com/items/gift-box.png',
      },
    ].filter((item) => query.status && query.status !== ProviderItemStatus.ALL ? item.status === query.status : true)
      .filter((item) => query.search ? item.name.toLowerCase().includes(query.search.toLowerCase()) : true);
    const start = (page - 1) * limit;

    return {
      data: sampleItems.slice(start, start + limit),
      meta: { page, limit, total: sampleItems.length, totalPages: Math.ceil(sampleItems.length / limit) },
      message: 'Provider items fetched successfully',
    };
  }

  async activity(id: string, query: ListProviderActivityDto) {
    const provider = await this.getProvider(id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const requestedType = query.type ?? ProviderActivityType.ALL;
    const logs = await this.prisma.adminAuditLog.findMany({
      where: { targetId: provider.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const activities = logs
      .map((log): ProviderActivityItem => this.toAuditActivity(log))
      .filter((activity) => requestedType === ProviderActivityType.ALL || activity.type === requestedType);
    const start = (page - 1) * limit;

    return {
      data: activities.slice(start, start + limit),
      meta: { page, limit, total: activities.length, totalPages: Math.ceil(activities.length / limit) },
      message: 'Provider activity fetched successfully',
    };
  }

  async export(query: ExportProvidersDto) {
    const providers = await this.prisma.user.findMany({
      where: this.buildProviderWhere(query),
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });
    const rows = this.toExportRows(providers);
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
    const provider = await this.prisma.user.findFirst({
      where: { id, role: UserRole.PROVIDER, deletedAt: null },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  private buildProviderWhere(query: ListProvidersDto | ExportProvidersDto): Prisma.UserWhereInput {
    return {
      role: UserRole.PROVIDER,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { providerBusinessName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...this.statusWhere(query.status),
      ...(query.approvalStatus && query.approvalStatus !== 'ALL'
        ? { providerApprovalStatus: query.approvalStatus }
        : {}),
    };
  }

  private statusWhere(status?: ProviderStatusFilter): Prisma.UserWhereInput {
    switch (status) {
      case ProviderStatusFilter.ACTIVE:
        return { isActive: true, suspendedAt: null, providerApprovalStatus: ProviderApprovalStatus.APPROVED };
      case ProviderStatusFilter.INACTIVE:
      case ProviderStatusFilter.DISABLED:
        return { isActive: false, suspendedAt: null };
      case ProviderStatusFilter.SUSPENDED:
        return { suspendedAt: { not: null } };
      case ProviderStatusFilter.ALL:
      case undefined:
        return {};
    }
  }

  private toOrderBy(sortBy?: ProviderSortBy, sortOrder?: SortOrder): Prisma.UserOrderByWithRelationInput {
    const direction = sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    if (sortBy === ProviderSortBy.BUSINESS_NAME) {
      return { providerBusinessName: direction };
    }

    if (sortBy === ProviderSortBy.APPROVAL_STATUS) {
      return { providerApprovalStatus: direction };
    }

    return { createdAt: direction };
  }

  private toListItem(provider: User, stats: ProviderStats) {
    return {
      id: provider.id,
      providerCode: this.providerCode(provider.id),
      businessName: this.businessName(provider),
      email: provider.email,
      phone: provider.phone,
      avatarUrl: provider.avatarUrl,
      status: this.toStatus(provider),
      isActive: provider.isActive,
      approvalStatus: provider.providerApprovalStatus ?? ProviderApprovalStatus.PENDING,
      revenue: stats.revenue,
      registeredSince: provider.createdAt,
      createdAt: provider.createdAt,
    };
  }

  private toDetail(provider: User, stats: ProviderStats) {
    return {
      ...this.toListItem(provider, stats),
      headquarters: provider.location,
      serviceArea: provider.providerServiceArea,
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
      },
      suspension: this.toSuspension(provider),
    };
  }

  private toStatus(provider: User): ProviderStatusFilter {
    if (provider.suspendedAt) {
      return ProviderStatusFilter.SUSPENDED;
    }

    if (!provider.isActive) {
      return ProviderStatusFilter.DISABLED;
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

  private toExportRows(providers: User[]): string[][] {
    return [
      ['ID', 'Provider Code', 'Business Name', 'Email', 'Phone', 'Status', 'Approval Status', 'Revenue', 'Registered Since'],
      ...providers.map((provider) => [
        provider.id,
        this.providerCode(provider.id),
        this.businessName(provider),
        provider.email,
        provider.phone ?? '',
        this.toStatus(provider),
        provider.providerApprovalStatus ?? ProviderApprovalStatus.PENDING,
        '0',
        provider.createdAt.toISOString(),
      ]),
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

  private async notifyProvider(
    provider: User,
    notifyProvider: boolean | undefined,
    status: string,
    comment?: string,
  ): Promise<void> {
    if (!notifyProvider) {
      return;
    }

    await this.mailerService.sendAccountStatusEmail(provider.email, status, comment);
  }

  private async recordAudit(
    actorId: string | null,
    targetId: string | null,
    action: string,
    beforeJson: unknown,
    afterJson: unknown,
  ): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorId,
        targetId,
        action,
        beforeJson: beforeJson === null ? undefined : (beforeJson as Prisma.InputJsonValue),
        afterJson: afterJson === null ? undefined : (afterJson as Prisma.InputJsonValue),
      },
    });
  }

  private businessName(provider: User): string {
    return provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim();
  }

  private providerCode(id: string): string {
    return `PROV-${id.slice(-6).toUpperCase()}`;
  }

  private emptyProviderStats(): ProviderStats {
    return {
      revenue: 0,
      performanceStats: 94.8,
      performanceChangePercent: 0,
      listedItems: 0,
      listedItemsChange: 0,
      orderFulfillment: 0,
      orderFulfillmentChangePercent: 0,
      disputeCount: 0,
      disputeChangePercent: 0,
    };
  }

  private generateTemporaryPassword(): string {
    return `Gift-${randomBytes(6).toString('hex')}1!`;
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
