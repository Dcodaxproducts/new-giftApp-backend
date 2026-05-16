import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderApprovalStatus } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ProviderBusinessInfoRepository } from '../repositories/provider-business-info.repository';
import { ProviderBusinessHourDto, UpdateProviderBusinessInfoDto } from '../dto/provider-business-info.dto';

@Injectable()
export class ProviderBusinessInfoService {
  constructor(private readonly repository: ProviderBusinessInfoRepository) {}

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

    const materialChange = [
      'businessName',
      'legalName',
      'taxId',
      'businessCategoryId',
      'email',
      'phone',
      'businessAddress',
      'storeAddress',
      'businessHours',
      'fulfillmentMethods',
    ].some((key) => dto[key as keyof UpdateProviderBusinessInfoDto] !== undefined);

    const updated = await this.repository.updateProvider(user.uid, {
        providerBusinessName: dto.businessName?.trim(),
        providerLegalName: dto.legalName?.trim(),
        providerTaxId: dto.taxId?.trim(),
        providerBusinessCategoryId: dto.businessCategoryId,
        providerBusinessEmail: dto.email?.trim(),
        providerBusinessPhone: dto.phone?.trim(),
        providerBusinessAddress: dto.businessAddress?.trim(),
        providerStoreAddress: dto.storeAddress === undefined ? undefined : this.toJson(dto.storeAddress),
        providerBusinessHours: dto.businessHours === undefined ? undefined : this.toJson(dto.businessHours),
        providerServiceArea: dto.serviceArea?.trim(),
        providerWebsite: dto.website?.trim(),
        location: dto.headquarters?.trim(),
        providerFulfillmentMethods: dto.fulfillmentMethods,
        providerAutoAcceptOrders: dto.autoAcceptOrders,
        providerApprovalStatus: materialChange ? ProviderApprovalStatus.PENDING : provider.providerApprovalStatus,
        isApproved: materialChange ? false : provider.isApproved,
    });

    await this.repository.createAuditLog({
        actorId: user.uid,
        targetId: user.uid,
        targetType: 'PROVIDER',
        action: 'PROVIDER_BUSINESS_INFO_UPDATED',
        beforeJson: this.toJson(this.auditInfo(provider)),
        afterJson: this.toJson(this.auditInfo(updated)),
        metadataJson: { verificationRequired: materialChange },
    });

    if (materialChange) {
      const admins = await this.repository.findActiveSuperAdmins();
      await Promise.all(
        admins.map((admin) =>
          this.repository.createNotification({
              recipientId: admin.id,
              recipientType: NotificationRecipientType.ADMIN,
              title: 'Provider business info changed',
              message: 'A provider updated business information and needs review.',
              type: 'ADMIN_PROVIDER_REVIEW_NEEDED',
              metadataJson: { providerId: user.uid },
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
    const provider = await this.repository.findProviderById(id);
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  private async getProviderBusinessCategory(id: string) {
    const category = await this.repository.findBusinessCategoryById(id);
    if (!category) throw new NotFoundException('Provider business category not found');
    return category;
  }

  private async toBusinessInfo(provider: Awaited<ReturnType<ProviderBusinessInfoService['getProvider']>>) {
    const category = provider.providerBusinessCategoryId
      ? await this.repository.findBusinessCategoryByIdIncludingInactive(provider.providerBusinessCategoryId)
      : null;

    return {
      businessName: provider.providerBusinessName,
      legalName: provider.providerLegalName,
      businessCategory: category ? { id: category.id, name: category.name } : null,
      businessCategoryId: provider.providerBusinessCategoryId,
      taxId: provider.providerTaxId,
      email: provider.providerBusinessEmail ?? provider.email,
      phone: provider.providerBusinessPhone ?? provider.phone,
      website: provider.providerWebsite,
      storeAddress: this.storeAddress(provider.providerStoreAddress, provider.providerBusinessAddress),
      businessHours: this.businessHours(provider.providerBusinessHours),
      fulfillmentMethods: this.stringArray(provider.providerFulfillmentMethods),
      autoAcceptOrders: provider.providerAutoAcceptOrders,
      verificationRequired: provider.providerApprovalStatus === ProviderApprovalStatus.PENDING || !provider.isApproved,
      businessAddress: provider.providerBusinessAddress,
      serviceArea: provider.providerServiceArea,
      headquarters: provider.location,
    };
  }

  private storeAddress(value: Prisma.JsonValue, fallback: string | null) {
    if (this.isRecord(value)) {
      return {
        line1: this.optionalString(value.line1) ?? fallback,
        city: this.optionalString(value.city),
        state: this.optionalString(value.state),
        country: this.optionalString(value.country),
        postalCode: this.optionalString(value.postalCode),
        latitude: this.optionalNumber(value.latitude),
        longitude: this.optionalNumber(value.longitude),
      };
    }
    return fallback ? { line1: fallback, city: null, state: null, country: null, postalCode: null, latitude: null, longitude: null } : null;
  }

  private businessHours(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.map((item) => this.businessHour(item)).filter((item): item is ProviderBusinessHourDto => item !== null) : [];
  }

  private businessHour(value: unknown): ProviderBusinessHourDto | null {
    if (!this.isRecord(value)) return null;
    const day = this.optionalString(value.day);
    if (!day) return null;
    return {
      day: day as ProviderBusinessHourDto['day'],
      isOpen: value.isOpen === true,
      openTime: this.optionalString(value.openTime),
      closeTime: this.optionalString(value.closeTime),
    };
  }

  private auditInfo(provider: {
    providerBusinessName: string | null;
    providerLegalName: string | null;
    providerTaxId: string | null;
    providerBusinessCategoryId: string | null;
    providerBusinessEmail: string | null;
    providerBusinessPhone: string | null;
    providerBusinessAddress: string | null;
    providerStoreAddress: Prisma.JsonValue;
    providerBusinessHours: Prisma.JsonValue;
    providerServiceArea: string | null;
    providerWebsite: string | null;
    location: string | null;
    providerFulfillmentMethods: unknown;
    providerAutoAcceptOrders: boolean;
    providerApprovalStatus: ProviderApprovalStatus | null;
  }) {
    return {
      businessName: provider.providerBusinessName,
      legalName: provider.providerLegalName,
      taxId: provider.providerTaxId,
      businessCategoryId: provider.providerBusinessCategoryId,
      email: provider.providerBusinessEmail,
      phone: provider.providerBusinessPhone,
      businessAddress: provider.providerBusinessAddress,
      storeAddress: this.storeAddress(provider.providerStoreAddress, provider.providerBusinessAddress),
      businessHours: this.businessHours(provider.providerBusinessHours),
      serviceArea: provider.providerServiceArea,
      website: provider.providerWebsite,
      headquarters: provider.location,
      fulfillmentMethods: this.stringArray(provider.providerFulfillmentMethods),
      autoAcceptOrders: provider.providerAutoAcceptOrders,
      approvalStatus: provider.providerApprovalStatus,
    };
  }

  private stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private optionalString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private optionalNumber(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
