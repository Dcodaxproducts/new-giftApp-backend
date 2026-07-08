import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProviderDocumentsService } from './provider-documents.service';
import { AdminSubmitProviderDocumentDto, ReviewProviderDocumentDto } from './dto/provider-documents.dto';

@ApiTags('02 Admin - Provider Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/providers')
export class AdminProviderDocumentsController {
  constructor(private readonly providerDocuments: ProviderDocumentsService) {}

  @Get(':id/documents')
  @Permissions('providers.read')
  @ApiOperation({ summary: 'View provider submitted documents', description: 'SUPER_ADMIN or STAFF with providers.read. Returns all documents with submission status for a specific provider.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'doc_id', name: 'Business License', isRequired: true, isSubmitted: true, submission: { id: 'provider_doc_id', fileUrl: 'provider-documents/license.pdf', status: 'APPROVED', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' } }, { id: 'doc_id_2', name: 'Tax Certificate', isRequired: true, isSubmitted: false, submission: null }], message: 'Provider documents fetched successfully.' } } })
  documents(@Param('id') id: string) {
    return this.providerDocuments.myDocuments(id);
  }

  @Post(':id/documents')
  @Permissions('providers.update')
  @ApiOperation({ summary: 'Submit document on behalf of provider', description: 'SUPER_ADMIN or STAFF with providers.update. Admin submits a document for a provider.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'provider_doc_id', providerProfileId: 'profile_id', documentTypeId: 'doc_id', fileUrl: 'provider-documents/license.pdf', status: 'PENDING', documentType: { id: 'doc_id', name: 'Business License', isRequired: true } }, message: 'Document submitted successfully.' } } })
  submit(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AdminSubmitProviderDocumentDto) {
    return this.providerDocuments.submitByAdmin(user.uid, id, dto);
  }

  @Patch('documents/:id/review')
  @Permissions('providers.update')
  @ApiOperation({ summary: 'Review provider document', description: 'SUPER_ADMIN or STAFF with providers.update. Approve or reject a submitted provider document.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'provider_doc_id', fileUrl: 'provider-documents/license.pdf', status: 'APPROVED', documentType: { id: 'doc_id', name: 'Business License', isRequired: true } }, message: 'Document approved successfully.' } } })
  review(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ReviewProviderDocumentDto) {
    return this.providerDocuments.reviewDocument(user.uid, id, dto);
  }
}
