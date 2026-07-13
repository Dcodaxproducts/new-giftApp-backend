import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { JwtAuthRepository } from '../repositories/jwt-auth.repository';

@Global()
@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  providers: [JwtAuthGuard, OptionalJwtAuthGuard, JwtAuthRepository],
  exports: [JwtModule, JwtAuthGuard, OptionalJwtAuthGuard, JwtAuthRepository],
})
export class JwtAuthModule {}
