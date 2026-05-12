import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompleteUploadDto, CreatePresignedUploadDto, ListUploadsDto } from './dto/create-presigned-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('07 Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTERED_USER, UserRole.PROVIDER)
@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Create presigned upload URL', description: 'Backend derives ownerId/ownerRole from the authenticated JWT. targetAccountId is optional and allowed only for SUPER_ADMIN/authorized ADMIN dashboard uploads. Normal users/providers should not send targetAccountId. Include giftId only for gift image uploads.' })
  @ApiBody({
    type: CreatePresignedUploadDto,
    examples: {
      giftUpload: { summary: 'Normal gift image upload', value: { folder: 'gift-images', fileName: 'perfume.png', contentType: 'image/png', sizeBytes: 1048576, giftId: 'gift_id' } },
      normalUpload: { summary: 'Normal profile/media upload', value: { folder: 'provider-avatars', fileName: 'avatar.png', contentType: 'image/png', sizeBytes: 1048576 } },
      adminOnBehalf: { summary: 'Admin-only dashboard upload on behalf of provider', value: { folder: 'provider-logos', fileName: 'logo.png', contentType: 'image/png', sizeBytes: 1048576, targetAccountId: 'provider_user_id' } },
    },
  })
  createPresignedUpload(@CurrentUser() user: AuthUserContext, @Body() dto: CreatePresignedUploadDto, @Req() request: Request) {
    return this.storageService.createPresignedUpload(user, dto, request.ip, request.headers['user-agent']);
  }

  @Post('complete') complete(@CurrentUser() user: AuthUserContext, @Body() dto: CompleteUploadDto) { return this.storageService.complete(user, dto); }
  @Get() list(@CurrentUser() user: AuthUserContext, @Query() query: ListUploadsDto) { return this.storageService.list(user, query); }
  @Get(':id') details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.storageService.details(user, id); }
  @Delete(':id') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.storageService.delete(user, id); }
}
