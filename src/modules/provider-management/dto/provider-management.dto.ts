import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderApprovalStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { optionalBoolean } from '../../../common/transforms/boolean.transform';

export enum ProviderStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum ProviderSortBy {
  CREATED_AT = 'createdAt',
  BUSINESS_NAME = 'businessName',
  REVENUE = 'revenue',
  APPROVAL_STATUS = 'approvalStatus',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}


export enum ProviderStatusUpdate {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ProviderLifecycleAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  UPDATE_STATUS = 'UPDATE_STATUS',
  SUSPEND = 'SUSPEND',
  UNSUSPEND = 'UNSUSPEND',
}

export enum ProviderLifecycleReason {
  INCOMPLETE_DOCUMENTS = 'INCOMPLETE_DOCUMENTS',
  INVALID_BUSINESS_DETAILS = 'INVALID_BUSINESS_DETAILS',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  DUPLICATE_PROVIDER = 'DUPLICATE_PROVIDER',
  BUSINESS_NOT_ELIGIBLE = 'BUSINESS_NOT_ELIGIBLE',
  OTHER = 'OTHER',
}

export const ProviderSuspensionReason = ProviderLifecycleReason;
export type ProviderSuspensionReason = ProviderLifecycleReason;
export const ProviderRejectionReason = ProviderLifecycleReason;
export type ProviderRejectionReason = ProviderLifecycleReason;

export enum ProviderItemStatus {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INACTIVE = 'INACTIVE',
}

export enum ProviderItemSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  PRICE = 'price',
  SALES_COUNT = 'salesCount',
}

export enum ProviderActivityType {
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ITEM_UPDATE = 'ITEM_UPDATE',
  PAYMENT = 'PAYMENT',
  ALL = 'ALL',
}

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
}

export enum ProviderMessageChannel {
  EMAIL = 'EMAIL',
}

export class ListProvidersDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'blooms' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProviderStatusFilter })
  @IsOptional()
  @IsEnum(ProviderStatusFilter)
  status?: ProviderStatusFilter;

  @ApiPropertyOptional({ enum: ['ALL', ...Object.values(ProviderApprovalStatus)] })
  @IsOptional()
  @IsEnum({ ALL: 'ALL', ...ProviderApprovalStatus })
  approvalStatus?: 'ALL' | ProviderApprovalStatus;

  @ApiPropertyOptional({ enum: ProviderSortBy })
  @IsOptional()
  @IsEnum(ProviderSortBy)
  sortBy?: ProviderSortBy;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export class ProviderLocationDto {
  @ApiProperty({ example: 31.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 74.3 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class CreateProviderDto {
  @ApiProperty({ example: 'Ali Raza', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'contact@giftsandblooms.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+15551234567' })
  @IsString()
  @IsNotEmpty()
  contact!: string;

  @ApiProperty({ example: 'Provider@123456', description: 'Password set by the admin for this provider account.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password does not meet security requirements.',
  })
  password!: string;

  @ApiProperty({ example: 'Gifts & Blooms Co. Ltd' })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty({ example: 'provider_business_category_id' })
  @IsString()
  @IsNotEmpty()
  businessCategoryId!: string;

  @ApiPropertyOptional({ example: 'TAX-12345' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ example: '123 Gift Street' })
  @IsString()
  @IsNotEmpty()
  businessAddress!: string;

  @ApiPropertyOptional({ example: 'Short customer-facing business summary.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessBio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/provider-logos/logo.png', description: 'Provider logo URL. If completed upload metadata exists, it must be a provider-logo asset no larger than 5MB.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  companyLogoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/provider-covers/cover.png', description: 'Provider cover image URL. If completed upload metadata exists, it must be a provider-cover asset no larger than 5MB.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverImageUrl?: string;

  @ApiPropertyOptional({
    example: { lat: 31.5, lng: 74.3 },
    description: 'Optional provider coordinates for future routing, proximity, delivery availability, distance sorting, and order assignment.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderLocationDto)
  location?: ProviderLocationDto;

  @ApiPropertyOptional({ enum: ProviderApprovalStatus, default: ProviderApprovalStatus.PENDING })
  @IsOptional()
  @IsEnum(ProviderApprovalStatus)
  approvalStatus?: ProviderApprovalStatus;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'Gifts & Blooms Co. Ltd' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New York, USA' })
  @IsOptional()
  @IsString()
  serviceArea?: string;

  @ApiPropertyOptional({ example: 'New York, USA' })
  @IsOptional()
  @IsString()
  headquarters?: string;

  @ApiPropertyOptional({ example: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/provider-logos/logo.png' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  documentUrls?: string[];
}

export class ApproveProviderDto {
  @ApiPropertyOptional({ example: 'Documents verified successfully.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyProvider?: boolean;
}

export class RejectProviderDto {
  @ApiProperty({ enum: ProviderRejectionReason })
  @IsEnum(ProviderRejectionReason)
  reason!: ProviderRejectionReason;

  @ApiPropertyOptional({ example: 'Business license document is missing.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyProvider?: boolean;
}

export class UpdateProviderStatusDto {
  @ApiProperty({ enum: ProviderLifecycleAction, example: ProviderLifecycleAction.APPROVE })
  @IsEnum(ProviderLifecycleAction)
  action!: ProviderLifecycleAction;

  @ApiPropertyOptional({ enum: ProviderStatusUpdate, example: ProviderStatusUpdate.ACTIVE })
  @ValidateIf((dto: UpdateProviderStatusDto) => dto.action === ProviderLifecycleAction.UPDATE_STATUS)
  @IsEnum(ProviderStatusUpdate)
  status?: ProviderStatusUpdate;

  @ApiPropertyOptional({ enum: ProviderLifecycleReason, example: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS })
  @IsOptional()
  @IsEnum(ProviderLifecycleReason)
  reason?: ProviderLifecycleReason;

  @ApiPropertyOptional({ example: 'Documents verified successfully.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  notifyProvider?: boolean;
}

export class ListProviderItemsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProviderItemStatus })
  @IsOptional()
  @IsEnum(ProviderItemStatus)
  status?: ProviderItemStatus;

  @ApiPropertyOptional({ enum: ProviderItemSortBy })
  @IsOptional()
  @IsEnum(ProviderItemSortBy)
  sortBy?: ProviderItemSortBy;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export class ListProviderActivityDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ProviderActivityType })
  @IsOptional()
  @IsEnum(ProviderActivityType)
  type?: ProviderActivityType;
}

export class ExportProvidersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProviderStatusFilter })
  @IsOptional()
  @IsEnum(ProviderStatusFilter)
  status?: ProviderStatusFilter;

  @ApiPropertyOptional({ enum: ['ALL', ...Object.values(ProviderApprovalStatus)] })
  @IsOptional()
  @IsEnum({ ALL: 'ALL', ...ProviderApprovalStatus })
  approvalStatus?: 'ALL' | ProviderApprovalStatus;

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class MessageProviderDto {
  @ApiProperty({ example: 'Account update' })
  @IsString()
  @MinLength(2)
  subject!: string;

  @ApiProperty({ example: 'Please update your business documents.' })
  @IsString()
  @MinLength(2)
  message!: string;

  @ApiProperty({ enum: ProviderMessageChannel })
  @IsEnum(ProviderMessageChannel)
  channel!: ProviderMessageChannel;
}

export class ProviderLookupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProviderApprovalStatus })
  @IsOptional()
  @IsEnum(ProviderApprovalStatus)
  approvalStatus?: ProviderApprovalStatus;

  @ApiPropertyOptional({ description: 'Lookup defaults to active providers only for dropdowns. Use false only for admin-managed inactive lookups.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => optionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
