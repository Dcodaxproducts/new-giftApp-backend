import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderApprovalStatus, ProviderProfile, User } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { ProviderBusinessInfoRepository } from './provider-business-info.repository';
import { ProviderBusinessHourDto, UpdateProviderBusinessInfoDto } from './dto/provider-business-info.dto';

type ProviderUser = User & { providerProfile?: ProviderProfile | null };

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
        location: dto.headquarters?.trim(),
        isApproved: materialChange ? false : provider.isApproved,
      }, {
        businessName: dto.businessName?.trim(),
        legalName: dto.legalName?.trim(),
        taxId: dto.taxId?.trim(),
        businessCategoryId: dto.businessCategoryId,
        businessEmail: dto.email?.trim(),
        businessPhone: dto.phone?.trim(),
        businessAddress: dto.businessAddress?.trim(),
        storeAddress: dto.storeAddress === undefined ? undefined : this.toJson(dto.storeAddress),
        businessHours: dto.businessHours === undefined ? undefined : this.toJson(dto.businessHours),
        serviceArea: dto.serviceArea?.trim(),
        website: dto.website?.trim(),
        fulfillmentMethods: dto.fulfillmentMethods,
        autoAcceptOrders: dto.autoAcceptOrders,
        approvalStatus: materialChange ? ProviderApprovalStatus.PENDING : this.profile(provider).approvalStatus,
    });

    await this.repository.createAuditLog({
        actorId: user.uid,
        targetId: user.uid,
        targetType: 'PROVIDER',
        action: 'PROVIDER_BUSINESS_INFO_UPDATED',
        beforeJson: this.toJson(this.auditInfo(provider)),
        afterJson: this.toJson({ ...this.auditInfo(updated), verificationRequired: materialChange }),
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
    const profile = this.profile(provider);
    const category = profile.businessCategoryId
      ? await this.repository.findBusinessCategoryByIdIncludingInactive(profile.businessCategoryId)
      : null;

    return {
      businessName: profile.businessName,
      legalName: profile.legalName,
      businessCategory: category ? { id: category.id, name: category.name } : null,
      businessCategoryId: profile.businessCategoryId,
      taxId: profile.taxId,
      email: profile.businessEmail ?? provider.email,
      phone: profile.businessPhone ?? provider.phone,
      website: profile.website,
      storeAddress: this.storeAddress(profile.storeAddress ?? null, profile.businessAddress ?? null),
      businessHours: this.businessHours(profile.businessHours ?? null),
      fulfillmentMethods: this.stringArray(profile.fulfillmentMethods),
      autoAcceptOrders: profile.autoAcceptOrders ?? false,
      verificationRequired: profile.approvalStatus === ProviderApprovalStatus.PENDING || !provider.isApproved,
      businessAddress: profile.businessAddress,
      serviceArea: profile.serviceArea,
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

  private auditInfo(provider: ProviderUser) {
    const profile = this.profile(provider);
    return {
      businessName: profile.businessName,
      legalName: profile.legalName,
      taxId: profile.taxId,
      businessCategoryId: profile.businessCategoryId,
      email: profile.businessEmail,
      phone: profile.businessPhone,
      businessAddress: profile.businessAddress,
      storeAddress: this.storeAddress(profile.storeAddress ?? null, profile.businessAddress ?? null),
      businessHours: this.businessHours(profile.businessHours ?? null),
      serviceArea: profile.serviceArea,
      website: profile.website,
      headquarters: provider.location,
      fulfillmentMethods: this.stringArray(profile.fulfillmentMethods),
      autoAcceptOrders: profile.autoAcceptOrders ?? false,
      approvalStatus: profile.approvalStatus,
    };
  }

  private profile(provider: ProviderUser): Partial<ProviderProfile> {
    return provider.providerProfile ?? {};
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
