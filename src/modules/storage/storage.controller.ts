import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePresignedUploadDto } from './dto/create-presigned-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTERED_USER, UserRole.PROVIDER)
@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  createPresignedUpload(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: CreatePresignedUploadDto,
    @Req() request: Request,
  ) {
    return this.storageService.createPresignedUpload(
      user,
      dto,
      request.ip,
      request.headers['user-agent'],
    );
  }
}
