import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDocumentsService } from './admin-documents.service';
import { CreateDocumentDto, ListDocumentsDto, UpdateDocumentDto } from './dto/admin-documents.dto';

@ApiTags('02 Admin - Document Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/documents')
export class AdminDocumentsController {
  constructor(private readonly documents: AdminDocumentsService) {}

  @Post()
  @Permissions('documents.create')
  @ApiOperation({ summary: 'Create a document definition', description: 'SUPER_ADMIN or STAFF with documents.create. Creates a new document type that providers must upload.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'doc_id', name: 'Business License', isRequired: true, isActive: true, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }, message: 'Document created successfully.' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateDocumentDto) {
    return this.documents.create(user.uid, dto);
  }

  @Get()
  @Permissions('documents.read')
  @ApiOperation({ summary: 'List all document definitions', description: 'SUPER_ADMIN or STAFF with documents.read. Supports pagination and isActive filter.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'doc_id', name: 'Business License', isRequired: true, isActive: true, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Documents fetched successfully.' } } })
  list(@Query() query: ListDocumentsDto) {
    return this.documents.list(query);
  }

  @Patch(':id')
  @Permissions('documents.update')
  @ApiOperation({ summary: 'Update a document definition', description: 'SUPER_ADMIN or STAFF with documents.update. Update name, isRequired, or isActive.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'doc_id', name: 'Tax Certificate', isRequired: false, isActive: true, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }, message: 'Document updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(user.uid, id, dto);
  }

  @Delete(':id')
  @Permissions('documents.delete')
  @ApiOperation({ summary: 'Permanently delete a document definition', description: 'SUPER_ADMIN or STAFF with documents.delete. Permanently removes the document from the database.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: null, message: 'Document deleted successfully.' } } })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.documents.delete(user.uid, id);
  }
}
