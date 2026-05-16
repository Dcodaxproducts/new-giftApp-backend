import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { GiftCategoriesController } from './controllers/gift-categories.controller';
import { GiftCategoriesLookupController } from './controllers/gift-categories-lookup.controller';
import { GiftModerationController } from './controllers/gift-moderation.controller';
import { GiftManagementRepository } from './repositories/gift-management.repository';
import { GiftManagementService } from './services/gift-management.service';
import { GiftsController } from './controllers/gifts.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [GiftCategoriesLookupController, GiftCategoriesController, GiftsController, GiftModerationController],
  providers: [GiftManagementService, GiftManagementRepository, PrismaService, AuditLogWriterRepository, AuditLogWriterService],
})
export class GiftManagementModule {}
