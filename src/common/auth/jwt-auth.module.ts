import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtAuthRepository } from '../repositories/jwt-auth.repository';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, JwtAuthRepository, PrismaService],
  exports: [JwtModule, JwtAuthGuard, JwtAuthRepository],
})
export class JwtAuthModule {}
