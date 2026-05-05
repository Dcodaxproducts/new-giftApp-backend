import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { LoginAttemptsController } from './login-attempts.controller';
import { LoginAttemptsService } from './login-attempts.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LoginAttemptsController],
  providers: [LoginAttemptsService, PrismaService],
  exports: [LoginAttemptsService],
})
export class LoginAttemptsModule {}
