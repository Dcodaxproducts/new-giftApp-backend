import { ApiProperty } from '@nestjs/swagger';

export class PlatformAnalyticsMetricDto {
  @ApiProperty({ example: 154320 })
  value!: number;

  @ApiProperty({ example: 8.1 })
  changePercent!: number;
}

export class PlatformAnalyticsSummaryDto {
  @ApiProperty({ type: PlatformAnalyticsMetricDto })
  totalRevenue!: PlatformAnalyticsMetricDto;

  @ApiProperty({ type: PlatformAnalyticsMetricDto })
  newSubscriptions!: PlatformAnalyticsMetricDto;

  @ApiProperty({ type: PlatformAnalyticsMetricDto })
  churnRate!: PlatformAnalyticsMetricDto;

  @ApiProperty({ type: PlatformAnalyticsMetricDto })
  activeUsers!: PlatformAnalyticsMetricDto;
}

export class PlatformAnalyticsRelationDto {
  @ApiProperty({ example: 'category_id' })
  id!: string;

  @ApiProperty({ example: 'Flowers' })
  name!: string;
}

export class PlatformAnalyticsProviderDto {
  @ApiProperty({ example: 'provider_id' })
  id!: string;

  @ApiProperty({ example: 'Gift Provider' })
  businessName!: string;
}

export class PlatformAnalyticsRevenueTransactionDto {
  @ApiProperty({ example: 'transaction_id' })
  id!: string;

  @ApiProperty({ example: '2023-09-17T00:00:00.000Z' })
  date!: Date;

  @ApiProperty({ example: 'alex.rivera@gmail.com' })
  userEmail!: string;

  @ApiProperty({ example: 150 })
  amount!: number;

  @ApiProperty({ example: 'PKR' })
  currency!: string;

  @ApiProperty({ type: PlatformAnalyticsProviderDto, nullable: true })
  provider!: PlatformAnalyticsProviderDto | null;

  @ApiProperty({ type: PlatformAnalyticsRelationDto, nullable: true })
  category!: PlatformAnalyticsRelationDto | null;
}
