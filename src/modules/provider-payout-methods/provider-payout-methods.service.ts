import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderApprovalStatus, ProviderPayoutExternalProvider, ProviderPayoutMethod, ProviderPayoutMethodType, ProviderPayoutVerificationStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { ProviderPayoutMethodsRepository } from './provider-payout-methods.repository';
import { CreateProviderBankAccountDto, UpdateProviderPayoutMethodDto, VerifyProviderPayoutMethodDto } from './dto/provider-payout-methods.dto';

@Injectable()
export class ProviderPayoutMethodsService {
  constructor(private readonly repository: ProviderPayoutMethodsRepository) {}

  async list(user: AuthUserContext) {
    await this.getApprovedActiveProvider(user.uid);
    const methods = await this.repository.findManyByProviderId(user.uid);
    return { data: { primary: methods.find((method) => method.isDefault && method.verificationStatus === ProviderPayoutVerificationStatus.VERIFIED) ? this.toListItem(methods.find((method) => method.isDefault && method.verificationStatus === ProviderPayoutVerificationStatus.VERIFIED) as ProviderPayoutMethod) : null, methods: methods.map((method) => this.toListItem(method)) }, message: 'Provider payout methods fetched successfully.' };
  }

  async createBankAccount(user: AuthUserContext, dto: CreateProviderBankAccountDto) {
    const provider = await this.getApprovedActiveProvider(user.uid);
    const sourceNumber = dto.accountNumber ?? dto.iban;
    if (!sourceNumber) throw new BadRequestException('accountNumber or iban is required');
    const last4 = this.last4(sourceNumber);
    const maskedAccount = `${this.accountTypeLabel(dto.accountType)} **** ${last4}`;
    const method = await this.repository.createBankAccount({
        providerId: provider.id,
        type: ProviderPayoutMethodType.BANK_ACCOUNT,
        accountHolderName: dto.accountHolderName.trim(),
        bankName: dto.bankName.trim(),
        accountType: dto.accountType,
        country: dto.country.toUpperCase(),
        currency: dto.currency.toUpperCase(),
        maskedAccount,
        last4,
        payerId: this.payerId(provider, last4),
        externalProvider: ProviderPayoutExternalProvider.MANUAL,
        verificationStatus: ProviderPayoutVerificationStatus.PENDING,
        isDefault: false,
    });
    await this.notify(provider.id, 'Payout method added', `${method.bankName} payout method was added and is pending verification.`, 'PROVIDER_PAYOUT_METHOD_ADDED', { payoutMethodId: method.id });
    return { data: this.toCreateResponse(method), message: 'Provider bank account added successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    await this.getApprovedActiveProvider(user.uid);
    const method = await this.getOwnedMethod(user.uid, id);
    return { data: this.toDetail(method), message: 'Provider payout method fetched successfully.' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderPayoutMethodDto) {
    await this.getApprovedActiveProvider(user.uid);
    const method = await this.getOwnedMethod(user.uid, id);
    const updated = await this.repository.updateMetadata(method.id, { accountHolderName: dto.accountHolderName?.trim(), bankName: dto.bankName?.trim(), isActive: dto.isActive });
    return { data: this.toDetail(updated), message: 'Provider payout method updated successfully.' };
  }

  async setDefault(user: AuthUserContext, id: string) {
    await this.getApprovedActiveProvider(user.uid);
    const method = await this.getOwnedMethod(user.uid, id);
    if (!method.isActive) throw new ConflictException('Only active payout methods can be set as default');
    if (method.verificationStatus !== ProviderPayoutVerificationStatus.VERIFIED) throw new ConflictException('Only verified payout methods can be set as default');
    await this.repository.setDefault(user.uid, method.id);
    return { data: { id: method.id, isDefault: true }, message: 'Default payout method updated successfully.' };
  }

  async delete(user: AuthUserContext, id: string) {
    await this.getApprovedActiveProvider(user.uid);
    const method = await this.getOwnedMethod(user.uid, id);
    await this.assertNoPendingPayoutUsage(user.uid);
    await this.repository.softDeleteAndPromoteNextDefault(user.uid, method.id, method.isDefault);
    return { data: null, message: 'Provider payout method deleted successfully.' };
  }

  async verify(user: AuthUserContext, id: string, dto: VerifyProviderPayoutMethodDto) {
    await this.getApprovedActiveProvider(user.uid);
    const method = await this.getOwnedMethod(user.uid, id);
    const updated = await this.repository.markVerificationStatus(method.id, { externalProvider: dto.verificationMethod, verificationStatus: ProviderPayoutVerificationStatus.PENDING, externalAccountId: undefined });
    return { data: { id: updated.id, verificationStatus: updated.verificationStatus, externalProvider: updated.externalProvider }, message: 'Provider payout method verification submitted successfully.' };
  }

  private async getApprovedActiveProvider(id: string) {
    const provider = await this.repository.findApprovedProviderById(id);
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.providerApprovalStatus !== ProviderApprovalStatus.APPROVED || !provider.isActive || !provider.isApproved || provider.suspendedAt) throw new ForbiddenException('Only approved active providers can access payout methods');
    return provider;
  }

  private async getOwnedMethod(providerId: string, id: string): Promise<ProviderPayoutMethod> {
    const method = await this.repository.findByIdForProvider(providerId, id);
    if (!method) throw new NotFoundException('Provider payout method not found');
    return method;
  }

  private async assertNoPendingPayoutUsage(providerId: string): Promise<void> {
    const pending = await this.repository.findPendingPayoutUsage(providerId);
    if (pending) throw new ConflictException('Cannot delete payout method while a provider payout is pending');
  }

  private toListItem(method: ProviderPayoutMethod) {
    return { id: method.id, type: method.type, bankName: method.bankName, maskedAccount: method.maskedAccount, accountHolderName: method.accountHolderName, payerId: method.payerId, verificationStatus: method.verificationStatus, isDefault: method.isDefault, isActive: method.isActive };
  }

  private toCreateResponse(method: ProviderPayoutMethod) {
    return { id: method.id, type: method.type, bankName: method.bankName, maskedAccount: method.maskedAccount, verificationStatus: method.verificationStatus, isDefault: method.isDefault };
  }

  private toDetail(method: ProviderPayoutMethod) {
    return { ...this.toListItem(method), accountType: method.accountType, country: method.country, currency: method.currency, externalProvider: method.externalProvider, createdAt: method.createdAt };
  }

  private last4(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 4) throw new BadRequestException('Bank account number or IBAN must include at least 4 digits');
    return digits.slice(-4);
  }

  private accountTypeLabel(accountType: string): string {
    return accountType.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
  }

  private payerId(provider: { id: string; firstName: string; lastName: string; providerBusinessName: string | null }, last4: string): string {
    const source = provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`;
    const initials = source.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PV';
    return `${initials}-${provider.id.slice(-4).toUpperCase()}-${last4}`;
  }

  private async notify(recipientId: string, title: string, message: string, type: string, metadata: Prisma.InputJsonObject): Promise<void> {
    await this.repository.createNotification({ recipientId, recipientType: NotificationRecipientType.PROVIDER, title, message, type, metadataJson: metadata });
  }
}
