import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export enum BroadcastAudienceDto { ALL_USERS = 'ALL_USERS', PROVIDER = 'PROVIDER', USER = 'USER' }

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Maintenance Notice', maxLength: 50 }) @IsString() @MinLength(1) @MaxLength(50) title!: string;
  @ApiProperty({ example: 'Type your message here...' }) @IsString() @MinLength(1) message!: string;
  @ApiProperty({ enum: BroadcastAudienceDto, example: BroadcastAudienceDto.ALL_USERS }) @IsIn(Object.values(BroadcastAudienceDto)) audience!: BroadcastAudienceDto;
}
