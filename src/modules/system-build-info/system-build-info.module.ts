import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SystemBuildInfoController } from './system-build-info.controller';
import { SystemBuildInfoService } from './system-build-info.service';

@Module({
  imports: [ConfigModule],
  controllers: [SystemBuildInfoController],
  providers: [SystemBuildInfoService],
})
export class SystemBuildInfoModule {}
