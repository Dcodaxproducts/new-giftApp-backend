import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, ProviderApprovalStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProviderBusinessInfoDto } from './dto/provider-business-info.dto';

@Injectable()
export class ProviderBusinessInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async get(user: AuthUserContext) {
    const provider = await this.getProvider(user.uid);
    return {
      data: await this.toBusinessInfo(provider),
      message: 'Business information fetched successfully.',
    };
  }

  async update(user: AuthUserContext, dto: UpdateProviderBusinessInfoDto) {
    const provider = await this.getProvider(user.uid);
    if (dto.businessCategoryId) {
      await this.getProviderBusinessCategory(dto.businessCategoryId);
    }

    const materialChange = ['businessName', 'taxId', 'businessCategoryId', 'businessAddress'].some(
      (key) => dto[key as keyof UpdateProviderBusinessInfoDto] !== undefined,
    );

    const updated = await this.prisma.user.update({
      where: { id: user.uid },
      data: {
        providerBusinessName: dto.businessName?.trim(),
        providerTaxId: dto.taxId?.trim(),
        providerBusinessCategoryId: dto.businessCategoryId,
        providerBusinessAddress: dto.businessAddress?.trim(),
        providerServiceArea: dto.serviceArea?.trim(),
        providerWebsite: dto.website?.trim(),
        location: dto.headquarters?.trim(),
        providerFulfillmentMethods: dto.fulfillmentMethods,
        providerAutoAcceptOrders: dto.autoAcceptOrders,
        providerApprovalStatus: materialChange ? ProviderApprovalStatus.PENDING : provider.providerApprovalStatus,
        isApproved: materialChange ? false : provider.isApproved,
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: user.uid,
        targetId: user.uid,
        targetType: 'PROVIDER',
        action: 'PROVIDER_BUSINESS_INFO_UPDATED',
        beforeJson: this.auditInfo(provider),
        afterJson: this.auditInfo(updated),
      },
    });

    if (materialChange) {
      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null },
        select: { id: true },
      });
      await Promise.all(
        admins.map((admin) =>
          this.prisma.notification.create({
            data: {
              recipientId: admin.id,
              recipientType: NotificationRecipientType.ADMIN,
              title: 'Provider business info changed',
              message: 'A provider updated business information and needs review.',
              type: 'ADMIN_PROVIDER_REVIEW_NEEDED',
              metadataJson: { providerId: user.uid },
            },
          }),
        ),
      );
    }

    return {
      data: await this.toBusinessInfo(updated),
      message: 'Business information updated successfully.',
    };
  }

  private async getProvider(id: string) {
    const provider = await this.prisma.user.findFirst({
      where: { id, role: UserRole.PROVIDER, deletedAt: null },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  private async getProviderBusinessCategory(id: string) {
    const category = await this.prisma.providerBusinessCategory.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundException('Provider business category not found');
    return category;
  }

  private async toBusinessInfo(provider: Awaited<ReturnType<ProviderBusinessInfoService['getProvider']>>) {
    const category = provider.providerBusinessCategoryId
      ? await this.prisma.providerBusinessCategory.findUnique({ where: { id: provider.providerBusinessCategoryId } })
      : null;

    return {
      businessName: provider.providerBusinessName,
      taxId: provider.providerTaxId,
      businessCategory: category ? { id: category.id, name: category.name } : null,
      businessCategoryId: provider.providerBusinessCategoryId,
      businessAddress: provider.providerBusinessAddress,
      serviceArea: provider.providerServiceArea,
      headquarters: provider.location,
      website: provider.providerWebsite,
      fulfillmentMethods: Array.isArray(provider.providerFulfillmentMethods) ? provider.providerFulfillmentMethods : [],
      autoAcceptOrders: provider.providerAutoAcceptOrders,
      verificationRequired: provider.providerApprovalStatus === ProviderApprovalStatus.PENDING || !provider.isApproved,
    };
  }

  private auditInfo(provider: {
    providerBusinessName: string | null;
    providerTaxId: string | null;
    providerBusinessCategoryId: string | null;
    providerBusinessAddress: string | null;
    providerServiceArea: string | null;
    providerWebsite: string | null;
    location: string | null;
    providerFulfillmentMethods: unknown;
    providerAutoAcceptOrders: boolean;
    providerApprovalStatus: ProviderApprovalStatus | null;
  }) {
    return {
      businessName: provider.providerBusinessName,
      taxId: provider.providerTaxId,
      businessCategoryId: provider.providerBusinessCategoryId,
      businessAddress: provider.providerBusinessAddress,
      serviceArea: provider.providerServiceArea,
      website: provider.providerWebsite,
      headquarters: provider.location,
      fulfillmentMethods: Array.isArray(provider.providerFulfillmentMethods)
        ? provider.providerFulfillmentMethods.map(String)
        : [],
      autoAcceptOrders: provider.providerAutoAcceptOrders,
      approvalStatus: provider.providerApprovalStatus,
    };
  }
}
