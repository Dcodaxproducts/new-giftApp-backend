import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, CustomerSubscriptionCancelMode, CustomerSubscriptionInvoiceStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export enum InvoiceStatusFilter { ALL = 'ALL', PAID = 'PAID', FAILED = 'FAILED', OPEN = 'OPEN' }

export class ListCustomerSubscriptionPlansDto { @ApiPropertyOptional({ enum: BillingCycle }) @IsOptional() @IsEnum(BillingCycle) billingCycle?: BillingCycle; }
export class SubscriptionCheckoutDto { @ApiProperty() @IsString() planId!: string; @ApiProperty({ enum: BillingCycle }) @IsEnum(BillingCycle) billingCycle!: BillingCycle; @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE_CARD }) @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod; @ApiPropertyOptional({ example: 'pm_xxx' }) @IsOptional() @IsString() stripePaymentMethodId?: string; @ApiPropertyOptional({ example: 'SAVE30' }) @IsOptional() @IsString() couponCode?: string; }
export class ConfirmSubscriptionDto { @ApiProperty() @IsString() customerSubscriptionId!: string; @ApiProperty() @IsString() stripeSubscriptionId!: string; }
export class CancelSubscriptionDto { @ApiProperty({ enum: CustomerSubscriptionCancelMode }) @IsEnum(CustomerSubscriptionCancelMode) cancelMode!: CustomerSubscriptionCancelMode; @ApiPropertyOptional() @IsOptional() @IsString() reason?: string; }
export class ListSubscriptionInvoicesDto { @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; @ApiPropertyOptional({ enum: InvoiceStatusFilter }) @IsOptional() @IsEnum(InvoiceStatusFilter) status?: InvoiceStatusFilter; }
export class ApplyCouponDto { @ApiProperty() @IsString() planId!: string; @ApiProperty({ enum: BillingCycle }) @IsEnum(BillingCycle) billingCycle!: BillingCycle; @ApiProperty() @IsString() couponCode!: string; }
export { BillingCycle, CustomerSubscriptionCancelMode, CustomerSubscriptionInvoiceStatus };
