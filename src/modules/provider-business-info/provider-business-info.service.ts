import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderProfile, User, UserStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { ProviderBusinessInfoRepository } from './provider-business-info.repository';
import { UpdateProviderBusinessInfoDto } from './dto/provider-business-info.dto';

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
      'fulfillmentMethods',
    ].some((key) => dto[key as keyof UpdateProviderBusinessInfoDto] !== undefined);

    const updated = await this.repository.updateProvider(user.uid, {
        status: materialChange ? UserStatus.PENDING : provider.status,
      }, {
        businessName: dto.businessName?.trim(),
        legalName: dto.legalName?.trim(),
        taxId: dto.taxId?.trim(),
        businessCategoryId: dto.businessCategoryId,
        businessEmail: dto.email?.trim(),
        businessPhone: dto.phone?.trim(),
        businessAddress: dto.businessAddress?.trim(),
        fulfillmentMethods: dto.fulfillmentMethods,
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
      fulfillmentMethods: this.stringArray(profile.fulfillmentMethods),
      verificationRequired: provider.status !== UserStatus.APPROVED,
      businessAddress: profile.businessAddress,
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
      fulfillmentMethods: this.stringArray(profile.fulfillmentMethods),
    };
  }

  private profile(provider: ProviderUser): Partial<ProviderProfile> {
    return provider.providerProfile ?? {};
  }

  private stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
