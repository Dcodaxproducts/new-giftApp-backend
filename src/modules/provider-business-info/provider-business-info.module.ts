import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderBusinessInfoController } from './provider-business-info.controller';
import { ProviderBusinessInfoRepository } from './provider-business-info.repository';
import { ProviderBusinessInfoService } from './provider-business-info.service';
@Module({ imports: [JwtModule.register({})], controllers: [ProviderBusinessInfoController], providers: [ProviderBusinessInfoService, ProviderBusinessInfoRepository, PrismaService] })
export class ProviderBusinessInfoModule {}
