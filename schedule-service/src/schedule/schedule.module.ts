import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleResolver } from './schedule.resolver';
import { NotificationModule } from '../notification/notification.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [NotificationModule, CommonModule],
  providers: [ScheduleService, ScheduleResolver],
  exports: [ScheduleService],
})
export class ScheduleModule {}
