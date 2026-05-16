import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoginAttemptsController } from './login-attempts.controller';
import { LoginAttemptsRepository } from './login-attempts.repository';
import { LoginAttemptsService } from './login-attempts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LoginAttemptsController],
  providers: [LoginAttemptsService, LoginAttemptsRepository],
  exports: [LoginAttemptsService],
})
export class LoginAttemptsModule {}
