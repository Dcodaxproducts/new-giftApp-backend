import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, CustomerSubscriptionInvoiceStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

export enum InvoiceStatusFilter { ALL = 'ALL', PAID = 'PAID', FAILED = 'FAILED', OPEN = 'OPEN' }
export enum CustomerSubscriptionAction { CANCEL = 'CANCEL', REACTIVATE = 'REACTIVATE' }

export class ListCustomerSubscriptionPlansDto { @ApiPropertyOptional({ enum: BillingCycle }) @IsOptional() @IsEnum(BillingCycle) billingCycle?: BillingCycle; }
export class SubscriptionCheckoutDto { @ApiProperty() @IsString() planId!: string; @ApiProperty({ enum: BillingCycle }) @IsEnum(BillingCycle) billingCycle!: BillingCycle; @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE_CARD }) @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod; @ApiPropertyOptional({ example: 'pm_xxx' }) @IsOptional() @IsString() stripePaymentMethodId?: string; @ApiProperty({ example: 'sub_checkout_2026_001', description: 'Client-generated unique key (e.g. UUID) per checkout attempt. Reuse the SAME value across retries so the subscription is never created twice.' }) @IsString() @IsNotEmpty() @MaxLength(120) idempotencyKey!: string; }
export class ConfirmSubscriptionDto { @ApiProperty() @IsString() customerSubscriptionId!: string; @ApiProperty() @IsString() stripeSubscriptionId!: string; @ApiPropertyOptional({ example: 'sub_confirm_2026_001' }) @IsOptional() @IsString() @MaxLength(120) idempotencyKey?: string; }
export class CustomerSubscriptionActionDto { @ApiProperty({ enum: CustomerSubscriptionAction, example: CustomerSubscriptionAction.CANCEL }) @IsEnum(CustomerSubscriptionAction) action!: CustomerSubscriptionAction; @ApiPropertyOptional({ example: true, description: 'Supported for CANCEL. When true, cancellation is scheduled at period end.' }) @IsOptional() @IsBoolean() cancelAtPeriodEnd?: boolean; @ApiPropertyOptional({ example: 'USER_REQUEST' }) @IsOptional() @IsString() reason?: string; @ApiPropertyOptional({ example: 'User requested cancellation.' }) @IsOptional() @IsString() comment?: string; }
export class ListSubscriptionInvoicesDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; @ApiPropertyOptional({ enum: InvoiceStatusFilter }) @IsOptional() @IsEnum(InvoiceStatusFilter) status?: InvoiceStatusFilter; }
export { BillingCycle, CustomerSubscriptionInvoiceStatus };
