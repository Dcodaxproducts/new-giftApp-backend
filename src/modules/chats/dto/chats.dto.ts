import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SenderType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListConversationsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class ListMessagesDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 50, default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'Hello, can you confirm delivery time?' }) @IsOptional() @IsString() @MaxLength(2000) content?: string;
  @ApiPropertyOptional({ example: 'https://storage.example.com/photo.jpg' }) @IsOptional() @IsString() attachmentUrl?: string;
}

export class StartConversationDto {
  @ApiProperty({ example: 'order_id' }) @IsString() orderId!: string;
  @ApiPropertyOptional({ example: 'Hello, I have a question about my order.' }) @IsOptional() @IsString() @MaxLength(2000) initialMessage?: string;
}
