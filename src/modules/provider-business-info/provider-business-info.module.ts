import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderBusinessInfoController } from './controllers/provider-business-info.controller';
import { ProviderBusinessInfoRepository } from './repositories/provider-business-info.repository';
import { ProviderBusinessInfoService } from './services/provider-business-info.service';
@Module({ imports: [DatabaseModule], controllers: [ProviderBusinessInfoController], providers: [ProviderBusinessInfoService, ProviderBusinessInfoRepository] })
export class ProviderBusinessInfoModule {}
