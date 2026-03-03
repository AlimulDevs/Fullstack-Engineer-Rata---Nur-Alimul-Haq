import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  NOTIFICATION_QUEUE,
  NotificationJobNames,
} from './constants/notification.constants';
import { ScheduleNotificationPayload } from './interfaces/notification-payload.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue<ScheduleNotificationPayload>,
  ) {}

  async sendScheduleCreatedNotification(
    payload: ScheduleNotificationPayload,
  ): Promise<void> {
    await this.notificationQueue.add(
      NotificationJobNames.SCHEDULE_CREATED,
      payload,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued [${NotificationJobNames.SCHEDULE_CREATED}] notification for ${payload.customerEmail}`,
    );
  }

  async sendScheduleDeletedNotification(
    payload: ScheduleNotificationPayload,
  ): Promise<void> {
    await this.notificationQueue.add(
      NotificationJobNames.SCHEDULE_DELETED,
      payload,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued [${NotificationJobNames.SCHEDULE_DELETED}] notification for ${payload.customerEmail}`,
    );
  }
}
