import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProviderDocumentsService } from './provider-documents.service';
import { SubmitProviderDocumentDto, UpdateProviderDocumentDto } from './dto/provider-documents.dto';

@ApiTags('03 Provider - Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/documents')
export class ProviderDocumentsController {
  constructor(private readonly providerDocuments: ProviderDocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all active document definitions', description: 'PROVIDER only. Returns list of all active documents that provider needs to submit.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'doc_id', name: 'Business License', isRequired: true, isActive: true }], message: 'Documents fetched successfully.' } } })
  list() {
    return this.providerDocuments.listDocuments();
  }

  @Get('my')
  @ApiOperation({ summary: 'Fetch my submitted documents with status', description: 'PROVIDER only. Returns all active documents with submission status (PENDING/APPROVED/REJECTED) for the logged-in provider.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ document: { id: 'doc_id', name: 'Business License', isRequired: true }, submission: { id: 'provider_doc_id', fileUrl: 'provider-documents/license.pdf', status: 'PENDING', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' } }], message: 'My documents fetched successfully.' } } })
  my(@CurrentUser() user: AuthUserContext) {
    return this.providerDocuments.myDocuments(user.uid);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a document', description: 'PROVIDER only. Submit a document against a document definition. Upload file first via storage presigned URL, then submit fileUrl here.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'provider_doc_id', providerProfileId: 'profile_id', documentTypeId: 'doc_id', fileUrl: 'provider-documents/license.pdf', status: 'PENDING', documentType: { id: 'doc_id', name: 'Business License', isRequired: true } }, message: 'Document submitted successfully.' } } })
  submit(@CurrentUser() user: AuthUserContext, @Body() dto: SubmitProviderDocumentDto) {
    return this.providerDocuments.submitByProvider(user.uid, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Re-upload a document', description: 'PROVIDER only. Update fileUrl for an existing submission. Status resets to PENDING.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'provider_doc_id', fileUrl: 'provider-documents/updated-license.pdf', status: 'PENDING', documentType: { id: 'doc_id', name: 'Business License', isRequired: true } }, message: 'Document updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderDocumentDto) {
    return this.providerDocuments.updateByProvider(user.uid, id, dto);
  }
}
