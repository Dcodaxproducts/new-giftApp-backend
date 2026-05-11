import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerWalletService } from './customer-wallet.service';
import { AddWalletFundsDto, CreateBankAccountDto, ListWalletHistoryDto, WalletHistoryStatus, WalletHistoryType } from './dto/customer-wallet.dto';

@ApiTags('Customer Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/wallet')
export class CustomerWalletController {
  constructor(private readonly wallet: CustomerWalletService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch own wallet', description: 'REGISTERED_USER only. Wallet is lazily created and balances are backed by wallet ledger entries.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalBalance: 1240.5, giftCredits: 350, cashBalance: 890.5, currency: 'USD', defaultPaymentMethod: { id: 'pm_xxx', type: 'CARD', brand: 'visa', last4: '4242', expiryMonth: 9, expiryYear: 2025, isDefault: true }, defaultBankAccount: { id: 'bank_account_id', bankName: 'Chase Bank', last4: '8821', isDefault: false } }, message: 'Wallet fetched successfully.' } } })
  overview(@CurrentUser() user: AuthUserContext) { return this.wallet.overview(user); }

  @Post('add-funds')
  @ApiOperation({ summary: 'Create wallet top-up payment', description: 'Uses Stripe PaymentIntent. Wallet is credited only after successful server-side confirmation/webhook.' })
  addFunds(@CurrentUser() user: AuthUserContext, @Body() dto: AddWalletFundsDto) { return this.wallet.addFunds(user, dto); }

  @Get('history')
  @ApiOperation({ summary: 'List own wallet history', description: 'Positive amounts are credits, negative amounts are debits. Results are scoped to the logged-in customer.' })
  @ApiQuery({ name: 'type', enum: WalletHistoryType, required: false })
  @ApiQuery({ name: 'status', enum: WalletHistoryStatus, required: false })
  history(@CurrentUser() user: AuthUserContext, @Query() query: ListWalletHistoryDto) { return this.wallet.history(user, query); }
}

@ApiTags('Customer Payment Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/bank-accounts')
export class CustomerBankAccountsController {
  constructor(private readonly wallet: CustomerWalletService) {}

  @Post()
  @ApiOperation({ summary: 'Link placeholder bank account', description: 'Stores only masked display data. Full IBAN/account number is never returned.' })
  link(@CurrentUser() user: AuthUserContext, @Body() dto: CreateBankAccountDto) { return this.wallet.linkBankAccount(user, dto); }

  @Get()
  @ApiOperation({ summary: 'List own bank accounts' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'bank_account_id', accountHolderName: 'John Smith', bankName: 'Chase Bank', last4: '8821', maskedAccount: '**** 8821', isDefault: false }], message: 'Bank accounts fetched successfully.' } } })
  list(@CurrentUser() user: AuthUserContext) { return this.wallet.bankAccounts(user); }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set own default bank account' })
  setDefault(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.wallet.setDefaultBankAccount(user, id); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own bank account' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.wallet.deleteBankAccount(user, id); }
}
