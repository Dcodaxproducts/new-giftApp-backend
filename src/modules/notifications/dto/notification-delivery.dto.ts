import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationDeliveryStatus, NotificationRecipientType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListNotificationDeliveryLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: NotificationDeliveryStatus }) @IsOptional() @IsEnum(NotificationDeliveryStatus) status?: NotificationDeliveryStatus;
  @ApiPropertyOptional({ enum: NotificationRecipientType }) @IsOptional() @IsEnum(NotificationRecipientType) recipientType?: NotificationRecipientType;
  @ApiPropertyOptional({ example: 'REGISTERED_USER_ORDER_PLACED' }) @IsOptional() @IsString() notificationType?: string;
  @ApiPropertyOptional({ example: 'user_id' }) @IsOptional() @IsString() recipientId?: string;
}
