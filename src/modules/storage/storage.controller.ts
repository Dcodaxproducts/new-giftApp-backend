import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  createPresignedUpload(@CurrentUser() user: AuthUserContext, @Body() dto: CreatePresignedUploadDto, @Req() request: Request) {
    return this.storageService.createPresignedUpload(user, dto, request.ip, request.headers['user-agent']);
  }

  @Post('complete') complete(@CurrentUser() user: AuthUserContext, @Body() dto: CompleteUploadDto) { return this.storageService.complete(user, dto); }
  @Get() list(@CurrentUser() user: AuthUserContext, @Query() query: ListUploadsDto) { return this.storageService.list(user, query); }
  @Get(':id') details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.storageService.details(user, id); }
  @Delete(':id') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.storageService.delete(user, id); }
}
