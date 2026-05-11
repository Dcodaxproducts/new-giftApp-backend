import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerEventsService } from './customer-events.service';
import { CalendarEventsDto, CreateCustomerEventDto, ListCustomerEventsDto, UpcomingEventsDto, UpdateCustomerEventDto, UpdateReminderSettingsDto } from './dto/customer-events.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/events')
export class CustomerEventsController {
  constructor(private readonly events: CustomerEventsService) {}

  @Get()
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'List customer events', description: 'REGISTERED_USER only. Lists only events owned by the authenticated customer.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'recipientId', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiResponse({ status: 200, description: 'Events fetched successfully' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerEventsDto) { return this.events.list(user, query); }

  @Post()
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Create customer event', description: 'REGISTERED_USER only. recipientId must belong to the authenticated customer.' })
  @ApiBody({ type: CreateCustomerEventDto })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerEventDto) { return this.events.create(user, dto); }

  @Get('calendar')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Fetch monthly calendar events', description: 'REGISTERED_USER only. Returns marked dates and own events.' })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  @ApiQuery({ name: 'eventType', required: false })
  calendar(@CurrentUser() user: AuthUserContext, @Query() query: CalendarEventsDto) { return this.events.calendar(user, query); }

  @Get('upcoming')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Fetch upcoming customer events', description: 'REGISTERED_USER only. Defaults to 10 events within 30 days.' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'daysAhead', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  upcoming(@CurrentUser() user: AuthUserContext, @Query() query: UpcomingEventsDto) { return this.events.upcoming(user, query); }

  @Get(':id/reminder-settings')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Fetch event reminder settings', description: 'REGISTERED_USER only. Event must belong to the authenticated customer.' })
  reminderSettings(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.events.reminderSettings(user, id); }

  @Patch(':id/reminder-settings')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Update event reminder settings', description: 'REGISTERED_USER only. Event must belong to the authenticated customer.' })
  @ApiBody({ type: UpdateReminderSettingsDto })
  updateReminderSettings(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateReminderSettingsDto) { return this.events.updateReminderSettings(user, id, dto); }

  @Get(':id')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Fetch customer event details', description: 'REGISTERED_USER only. Event must belong to the authenticated customer.' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.events.details(user, id); }

  @Patch(':id')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Update customer event', description: 'REGISTERED_USER only. Event and recipient contact must belong to the authenticated customer.' })
  @ApiBody({ type: UpdateCustomerEventDto })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerEventDto) { return this.events.update(user, id, dto); }

  @Delete(':id')
  @ApiTags('05 Customer - Events')
  @ApiOperation({ summary: 'Soft-delete customer event', description: 'REGISTERED_USER only. Soft deletes only own event and cancels pending reminder jobs.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.events.delete(user, id); }
}
