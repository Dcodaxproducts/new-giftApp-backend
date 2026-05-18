import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { WorkflowMetadataService } from '../services/workflow-metadata.service';
@ApiTags('02 Admin - Workflow Metadata') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @Controller('admin/workflows')
export class WorkflowMetadataController { constructor(private readonly service: WorkflowMetadataService) {} @Get('app-flow') @Permissions('workflowMetadata.read') @ApiOperation({ summary: 'Fetch whole-system workflow app flow metadata' }) appFlow() { return this.service.appFlow(); } @Get('state-machines') @Permissions('workflowMetadata.read') @ApiOperation({ summary: 'Fetch declared system state machines' }) stateMachines() { return this.service.stateMachines(); } @Get('transition-rules') @Permissions('workflowMetadata.read') @ApiOperation({ summary: 'Fetch workflow transition guardrails and aliases' }) transitionRules() { return this.service.transitionRules(); } }
