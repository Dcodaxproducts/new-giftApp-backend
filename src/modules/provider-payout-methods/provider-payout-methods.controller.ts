import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProviderBankAccountDto, UpdateProviderPayoutMethodDto, VerifyProviderPayoutMethodDto } from './dto/provider-payout-methods.dto';
import { ProviderPayoutMethodsService } from './provider-payout-methods.service';

@ApiTags('03 Provider - Payout Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/payout-methods')
export class ProviderPayoutMethodsController {
  constructor(private readonly payoutMethods: ProviderPayoutMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'List own provider payout methods', description: 'PROVIDER only. providerId is derived from JWT. Returns masked payout metadata only.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { primary: { id: 'payout_method_id', type: 'BANK_ACCOUNT', bankName: 'Chase Bank', maskedAccount: 'Checking Account **** 5678', accountHolderName: 'Sylvia Bond', payerId: 'SB-4491-001', verificationStatus: 'VERIFIED', isDefault: true, isActive: true }, methods: [{ id: 'payout_method_id', type: 'BANK_ACCOUNT', bankName: 'Chase Bank', maskedAccount: 'Checking Account **** 6789', accountHolderName: 'Sylvia Bond', verificationStatus: 'VERIFIED', isDefault: true, isActive: true }] }, message: 'Provider payout methods fetched successfully.' } } })
  list(@CurrentUser() user: AuthUserContext) { return this.payoutMethods.list(user); }

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Add provider bank payout method', description: 'PROVIDER only. Stores masked metadata only; raw routing/account/IBAN values are never returned or persisted.' })
  @ApiBody({ type: CreateProviderBankAccountDto, examples: { bank: { value: { accountHolderName: 'Sylvia Bond', bankName: 'Chase Bank', accountType: 'CHECKING', country: 'US', currency: 'USD', routingNumber: '110000000', accountNumber: '000123456789', iban: null, isDefault: true } } } })
  createBankAccount(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderBankAccountDto) { return this.payoutMethods.createBankAccount(user, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own provider payout method details', description: 'PROVIDER only. Full account number, IBAN, and routing number are never returned.' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payoutMethods.details(user, id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update provider payout method display metadata', description: 'PROVIDER only. Bank/routing/account numbers cannot be edited; add a new payout method instead.' })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderPayoutMethodDto) { return this.payoutMethods.update(user, id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete own provider payout method', description: 'PROVIDER only. Blocks deletion when pending provider payout adjustments exist.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payoutMethods.delete(user, id); }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set default provider payout method', description: 'PROVIDER only. Only own verified active payout methods can become default.' })
  setDefault(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payoutMethods.setDefault(user, id); }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Start provider payout method verification', description: 'PROVIDER only. If Plaid/Stripe Connect is not configured, MANUAL keeps verification pending for admin/system review.' })
  verify(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: VerifyProviderPayoutMethodDto) { return this.payoutMethods.verify(user, id, dto); }
}
