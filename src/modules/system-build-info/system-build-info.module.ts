import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SystemBuildInfoController } from './controllers/system-build-info.controller';
import { SystemBuildInfoService } from './services/system-build-info.service';

@Module({
  imports: [ConfigModule],
  controllers: [SystemBuildInfoController],
  providers: [SystemBuildInfoService],
})
export class SystemBuildInfoModule {}
