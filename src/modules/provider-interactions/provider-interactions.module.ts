import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderInteractionsController } from './provider-interactions.controller';
import { ProviderInteractionsService } from './provider-interactions.service';

@Module({ imports: [JwtModule.register({})], controllers: [ProviderInteractionsController], providers: [ProviderInteractionsService, PrismaService] })
export class ProviderInteractionsModule {}
