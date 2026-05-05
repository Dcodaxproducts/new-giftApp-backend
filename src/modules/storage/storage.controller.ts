import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePresignedUploadDto } from './dto/create-presigned-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  createPresignedUpload(@Body() dto: CreatePresignedUploadDto) {
    return this.storageService.createPresignedUpload(dto);
  }
}
