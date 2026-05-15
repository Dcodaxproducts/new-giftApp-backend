import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { GiftCategoriesController } from './gift-categories.controller';
import { GiftCategoriesLookupController } from './gift-categories-lookup.controller';
import { GiftModerationController } from './gift-moderation.controller';
import { GiftManagementRepository } from './gift-management.repository';
import { GiftManagementService } from './gift-management.service';
import { GiftsController } from './gifts.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [GiftCategoriesLookupController, GiftCategoriesController, GiftsController, GiftModerationController],
  providers: [GiftManagementService, GiftManagementRepository, PrismaService, AuditLogWriterService],
})
export class GiftManagementModule {}
