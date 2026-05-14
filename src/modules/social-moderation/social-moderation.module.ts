import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { SocialModerationController, SocialReportingRulesController } from './social-moderation.controller';
import { SocialModerationService } from './social-moderation.service';

@Module({ imports: [JwtModule.register({})], controllers: [SocialModerationController, SocialReportingRulesController], providers: [SocialModerationService, AuditLogWriterService, PrismaService] })
export class SocialModerationModule {}
