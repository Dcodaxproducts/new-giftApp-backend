import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoginAttemptsController } from './controllers/login-attempts.controller';
import { LoginAttemptsRepository } from './repositories/login-attempts.repository';
import { LoginAttemptsService } from './services/login-attempts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LoginAttemptsController],
  providers: [LoginAttemptsService, LoginAttemptsRepository],
  exports: [LoginAttemptsService],
})
export class LoginAttemptsModule {}
