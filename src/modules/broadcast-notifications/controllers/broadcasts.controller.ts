import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BroadcastActionDto, CreateBroadcastDto, ListBroadcastsDto, ListRecipientsDto, UpdateBroadcastDto } from '../dto/broadcast-notifications.dto';
import { BroadcastsService } from '../services/broadcasts.service';

const baseBroadcastPayload = {
  content: {
    title: 'Maintenance Notice',
    message: 'Type your message here...',
    imageUrl: 'https://cdn.yourdomain.com/broadcast-images/notice.png',
    ctaLabel: 'View Details',
    ctaUrl: 'https://gift.dcodax.net/notice',
  },
  channels: ['IN_APP', 'PUSH', 'EMAIL'],
  priority: 'NORMAL',
  targeting: {
    mode: 'SPECIFIC_ROLES',
    roles: ['ADMIN', 'PROVIDER', 'REGISTERED_USER'],
    filters: {
      onlyVerifiedEmails: true,
      excludeUnsubscribed: true,
      excludeSuspended: true,
    },
  },
};

@ApiTags('06 Broadcast Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create or estimate broadcast wizard',
    description: "Three-step frontend flow: Step 1 Notification Content, Step 2 Targeting, Step 3 Schedule. Use action=ESTIMATE_REACH with 'broadcasts.read' to calculate reach without creating a broadcast. Use SAVE_DRAFT, SEND_NOW, or SCHEDULE with 'broadcasts.create'.",
  })
  @ApiBody({
    type: CreateBroadcastDto,
    examples: {
      estimateReach: { value: { action: 'ESTIMATE_REACH', ...baseBroadcastPayload, schedule: { type: 'SEND_NOW', sendAt: null, timezone: 'UTC', recurring: { enabled: false, frequency: null } } } },
      saveDraft: { value: { action: 'SAVE_DRAFT', ...baseBroadcastPayload, schedule: { type: 'SEND_NOW', sendAt: null, timezone: 'UTC', recurring: { enabled: false, frequency: null } } } },
      sendNow: { value: { action: 'SEND_NOW', ...baseBroadcastPayload, schedule: { type: 'SEND_NOW', sendAt: null, timezone: 'UTC', recurring: { enabled: false, frequency: null } } } },
      scheduleLater: { value: { action: 'SCHEDULE', ...baseBroadcastPayload, schedule: { type: 'SCHEDULED', sendAt: '2027-11-24T09:00:00.000Z', timezone: 'UTC', recurring: { enabled: false, frequency: null } } } },
      recurringDaily: { value: { action: 'SCHEDULE', ...baseBroadcastPayload, schedule: { type: 'SCHEDULED', sendAt: '2027-11-24T09:00:00.000Z', timezone: 'UTC', recurring: { enabled: true, frequency: 'DAILY' } } } },
    },
  })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateBroadcastDto) { return this.broadcasts.create(user, dto); }

  @Get() @Permissions('broadcasts.read') list(@Query() query: ListBroadcastsDto) { return this.broadcasts.list(query); }
  @Get(':id') @Permissions('broadcasts.read') details(@Param('id') id: string) { return this.broadcasts.details(id); }

  @Patch(':id')
  @Permissions('broadcasts.update')
  @ApiOperation({ summary: 'Update draft or scheduled broadcast', description: 'Edit draft or scheduled broadcast content, targeting, channels, priority, and schedule in one request. Targeting changes recalculate estimated reach.' })
  @ApiBody({
    type: UpdateBroadcastDto,
    examples: {
      updateDraft: { value: { content: { title: 'Updated Notice', message: 'Updated message text.' }, priority: 'HIGH', targeting: baseBroadcastPayload.targeting, schedule: { type: 'SEND_NOW', sendAt: null, timezone: 'UTC', recurring: { enabled: false, frequency: null } } } },
    },
  })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateBroadcastDto) { return this.broadcasts.update(user, id, dto); }

  @Post(':id/action')
  @ApiOperation({ summary: 'Run broadcast action', description: "Run a supported broadcast action such as CANCEL with 'broadcasts.cancel' or SEND_NOW with 'broadcasts.send'. ARCHIVE is accepted by the request schema but returns a clear unsupported error unless archive persistence is added later." })
  @ApiBody({ type: BroadcastActionDto, examples: { cancelBroadcast: { value: { action: 'CANCEL', reason: 'Campaign no longer needed.' } } } })
  action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: BroadcastActionDto) { return this.broadcasts.action(user, id, dto); }

  @Get(':id/report') @Permissions('broadcasts.report.read') report(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.broadcasts.report(user, id); }
  @Get(':id/recipients') @Permissions('broadcasts.report.read') recipients(@Param('id') id: string, @Query() query: ListRecipientsDto) { return this.broadcasts.recipients(id, query); }
}
