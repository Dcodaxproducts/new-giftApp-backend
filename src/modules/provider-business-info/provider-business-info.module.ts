import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ProviderBusinessInfoController } from './provider-business-info.controller';
import { ProviderBusinessInfoRepository } from './provider-business-info.repository';
import { ProviderBusinessInfoService } from './provider-business-info.service';
@Module({ imports: [JwtModule.register({}), DatabaseModule], controllers: [ProviderBusinessInfoController], providers: [ProviderBusinessInfoService, ProviderBusinessInfoRepository] })
export class ProviderBusinessInfoModule {}
