import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('02 Admin - System Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/system-settings')
export class SystemSettingsController {
  constructor(private readonly settings: SystemSettingsService) {}

  @Get()
  @Permissions('systemSettings.read')
  @ApiOperation({
    summary: 'Fetch system settings',
    description:
      'SUPER_ADMIN or ADMIN with systemSettings.read. Secret values are masked and never returned in plain text.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        data: {
          platformInfo: {
            applicationName: 'FintechOS Enterprise',
            supportEmail: 'support@fintechos.io',
            platformLogoUrl: 'https://cdn.example.com/logo.png',
          },
          payments: {
            stripePublishableKey: 'pk_live_xxx',
            stripeSecretKey: '************',
            stripeWebhookSecret: '************',
          },
          firebase: {
            firebaseServiceAccountJson: '************',
          },
          storage: {
            awsS3BucketName: 'gift-platform-assets',
            awsRegion: 'us-east-1',
            awsAccessKey: '************',
            awsSecretKey: '************',
          },
          email: {
            smtpHost: 'smtp.mailtrap.io',
            smtpPort: 587,
            smtpUsername: 'smtp-user',
            smtpPassword: '************',
            senderEmail: 'noreply@giftplatform.com',
            senderName: 'Gift Platform',
          },
        },
        message: 'System settings fetched successfully.',
      },
    },
  })
  get() {
    return this.settings.get();
  }

  @Patch()
  @Permissions('systemSettings.update')
  @ApiOperation({
    summary: 'Update system settings',
    description:
      'SUPER_ADMIN or ADMIN with systemSettings.update. Send masked or omitted secret values to preserve existing secrets.',
  })
  @ApiBody({ type: UpdateSystemSettingsDto })
  update(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: UpdateSystemSettingsDto,
    @Req() request: Request,
  ) {
    return this.settings.update(user, dto, request.ip, request.headers['user-agent']);
  }
}