import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerContactsService } from './customer-contacts.service';
import { CreateCustomerContactDto, ListCustomerContactsDto, UpdateCustomerContactDto } from './dto/customer-contacts.dto';

@ApiTags('05 Customer - Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/contacts')
export class CustomerContactsController {
  constructor(private readonly contacts: CustomerContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List customer contacts', description: 'REGISTERED_USER only. Lists only contacts owned by the authenticated customer.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Searches name, phone, email, and relationship.' })
  @ApiQuery({ name: 'relationship', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'updatedAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Contacts fetched successfully' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerContactsDto) { return this.contacts.list(user, query); }

  @Post()
  @ApiOperation({ summary: 'Create customer contact', description: 'REGISTERED_USER only. Creates a personal gift contact owned by the authenticated customer. Requires at least one contact method: phone, email, or address.' })
  @ApiBody({ type: CreateCustomerContactDto, examples: { create: { value: { name: 'Mary Wilson', relationship: 'Mother', phone: '+1234567890', email: 'mary@example.com', address: '387 Merdina', likes: 'Glasses, makeup, dresses', avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/mary.png', birthday: '1990-05-12', notes: 'Prefers elegant gifts.' } } } })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 400, description: 'At least one contact method is required.' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerContactDto) { return this.contacts.create(user, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch customer contact', description: 'REGISTERED_USER only. Contact must belong to the authenticated customer.' })
  @ApiResponse({ status: 200, description: 'Contact fetched successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.contacts.details(user, id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer contact', description: 'REGISTERED_USER only. Updates only contacts owned by the authenticated customer.' })
  @ApiBody({ type: UpdateCustomerContactDto, examples: { update: { value: { name: 'Mary Wilson', relationship: 'Mother', phone: '+1234567890', email: 'mary@example.com', address: '387 Merdina', likes: 'Glasses, makeup, dresses', avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/mary.png', birthday: '1990-05-12', notes: 'Prefers elegant gifts.' } } } })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerContactDto) { return this.contacts.update(user, id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete customer contact', description: 'REGISTERED_USER only. Soft deletes only contacts owned by the authenticated customer.' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.contacts.delete(user, id); }
}
