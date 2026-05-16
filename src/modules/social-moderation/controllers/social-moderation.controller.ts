import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateSocialReportingRuleDto, ExportSocialReportsDto, ExportSocialRulesDto, ListSocialReportingRulesDto, ListSocialReportsDto, SocialModerationActionDto, SocialModerationStatsDto, UpdateSocialReportingRuleDto, UpdateSocialReportingRuleStatusDto } from '../dto/social-moderation.dto';
import { SocialModerationService } from '../services/social-moderation.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class SocialModerationBaseController { constructor(protected readonly service: SocialModerationService) {} }

@ApiTags('02 Admin - Social Moderation')
@Controller('admin/social-moderation')
export class SocialModerationController extends SocialModerationBaseController {
  @Get('stats') @Permissions('socialModeration.read') @ApiOperation({ summary: 'Fetch social moderation stats', description: 'SUPER_ADMIN or ADMIN with socialModeration.read.' }) @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalFlaggedPosts: 245, pendingReports: 38, highSeverityReports: 12, removedPosts: 19, hiddenPosts: 44, warningsSent: 28 }, message: 'Social moderation stats fetched successfully.' } } }) stats(@Query() query: SocialModerationStatsDto) { return this.service.stats(query); }
  @Get('export') @Permissions('socialModeration.export') @ApiOperation({ summary: 'Export social moderation log', description: 'SUPER_ADMIN or ADMIN with socialModeration.export. Exports moderation-safe fields only.' }) async export(@CurrentUser() user: AuthUserContext, @Query() query: ExportSocialReportsDto): Promise<StreamableFile> { const file = await this.service.exportReports(user, query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }
  @Get('reports') @Permissions('socialModeration.read') @ApiOperation({ summary: 'List social moderation reports', description: 'SUPER_ADMIN or ADMIN with socialModeration.read. Search supports post content, user name, username, report ID, and post ID.' }) list(@Query() query: ListSocialReportsDto) { return this.service.reports(query); }
  @Get('reports/:id') @Permissions('socialModeration.read') @ApiOperation({ summary: 'Fetch social report inspection details', description: 'SUPER_ADMIN or ADMIN with socialModeration.read. Returns post inspection drawer data and report history.' }) details(@Param('id') id: string) { return this.service.reportDetails(id); }
  @Post('reports/:id/action') @Permissions('socialModeration.moderate') @ApiOperation({ summary: 'Run social moderation action', description: 'SUPER_ADMIN or ADMIN with socialModeration.moderate. HIDE/REMOVE/WARN_USER create moderation logs and audit logs; posts are not physically deleted.' }) @ApiBody({ type: SocialModerationActionDto, examples: { hide: { value: { action: 'HIDE', reason: 'SPAM', comment: 'Post hidden due to deceptive link reports.', notifyUser: true } }, remove: { value: { action: 'REMOVE', reason: 'DECEPTIVE_LINK', comment: 'Post removed after manual review.', notifyUser: true } }, warn: { value: { action: 'WARN_USER', reason: 'INAPPROPRIATE_BEHAVIOR', comment: 'Warning issued for repeated spam behavior.', notifyUser: true } }, reviewed: { value: { action: 'MARK_REVIEWED', comment: 'Reviewed and no additional action required.', notifyUser: false } } } }) action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: SocialModerationActionDto) { return this.service.action(user, id, dto); }
}

@ApiTags('02 Admin - Social Reporting Rules')
@Controller('admin/social-reporting-rules')
export class SocialReportingRulesController extends SocialModerationBaseController {
  @Get('stats') @Permissions('socialReportingRules.read') @ApiOperation({ summary: 'Fetch social reporting rule stats', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.read.' }) stats() { return this.service.ruleStats(); }
  @Get('export') @Permissions('socialReportingRules.export') @ApiOperation({ summary: 'Export social reporting rules', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.export.' }) async exportRules(@CurrentUser() user: AuthUserContext, @Query() query: ExportSocialRulesDto): Promise<StreamableFile> { const file = await this.service.exportRules(user, query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }
  @Get() @Permissions('socialReportingRules.read') @ApiOperation({ summary: 'List social reporting rules', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.read.' }) rules(@Query() query: ListSocialReportingRulesDto) { return this.service.rules(query); }
  @Post() @Permissions('socialReportingRules.create') @ApiOperation({ summary: 'Create social reporting rule', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.create.' }) create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateSocialReportingRuleDto) { return this.service.createRule(user, dto); }
  @Get(':id') @Permissions('socialReportingRules.read') @ApiOperation({ summary: 'Fetch social reporting rule details', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.read.' }) detail(@Param('id') id: string) { return this.service.ruleDetails(id); }
  @Patch(':id') @Permissions('socialReportingRules.update') @ApiOperation({ summary: 'Update social reporting rule', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.update.' }) update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateSocialReportingRuleDto) { return this.service.updateRule(user, id, dto); }
  @Delete(':id') @Permissions('socialReportingRules.delete') @ApiOperation({ summary: 'Soft-delete social reporting rule', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.delete. Historical moderation logs remain intact.' }) remove(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteRule(user, id); }
  @Patch(':id/status') @Permissions('socialReportingRules.update') @ApiOperation({ summary: 'Update social reporting rule status', description: 'SUPER_ADMIN or ADMIN with socialReportingRules.update.' }) status(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateSocialReportingRuleStatusDto) { return this.service.updateRuleStatus(user, id, dto); }
}
