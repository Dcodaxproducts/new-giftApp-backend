import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderBusinessInfoController } from './provider-business-info.controller';
import { ProviderBusinessInfoRepository } from './provider-business-info.repository';
import { ProviderBusinessInfoService } from './provider-business-info.service';
@Module({ imports: [DatabaseModule], controllers: [ProviderBusinessInfoController], providers: [ProviderBusinessInfoService, ProviderBusinessInfoRepository] })
export class ProviderBusinessInfoModule {}
