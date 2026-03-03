import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  NOTIFICATION_QUEUE,
  NotificationJobNames,
} from './constants/notification.constants';
import { ScheduleNotificationPayload } from './interfaces/notification-payload.interface';
import {
  buildScheduleCreatedEmail,
  buildScheduleDeletedEmail,
} from './templates/email.templates';

/**
 * NotificationProcessor
 *
 * Processes Bull queue jobs for sending email notifications.
 *
 * ─── To activate email sending ──────────────────────────────────────────────
 * 1. Set SMTP credentials in your .env file:
 *    MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM
 * 2. The `createTransporter()` method will use those credentials automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly configService: ConfigService) {}

  @Process(NotificationJobNames.SCHEDULE_CREATED)
  async handleScheduleCreated(
    job: Job<ScheduleNotificationPayload>,
  ): Promise<void> {
    this.logger.log(
      `Processing [${NotificationJobNames.SCHEDULE_CREATED}] job #${job.id} for ${job.data.customerEmail}`,
    );

    const { subject, html, text } = buildScheduleCreatedEmail(job.data);
    await this.sendEmail(job.data.customerEmail, subject, html, text);
  }

  @Process(NotificationJobNames.SCHEDULE_DELETED)
  async handleScheduleDeleted(
    job: Job<ScheduleNotificationPayload>,
  ): Promise<void> {
    this.logger.log(
      `Processing [${NotificationJobNames.SCHEDULE_DELETED}] job #${job.id} for ${job.data.customerEmail}`,
    );

    const { subject, html, text } = buildScheduleDeletedEmail(job.data);
    await this.sendEmail(job.data.customerEmail, subject, html, text);
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<void> {
    const mailHost = this.configService.get<string>('MAIL_HOST');
    const mailUser = this.configService.get<string>('MAIL_USER');

    // If SMTP is not configured, log and skip (template-only mode)
    if (!mailHost || mailHost === 'smtp.example.com' || !mailUser) {
      this.logger.warn(
        `Email sending skipped – SMTP not configured. Would have sent "${subject}" to ${to}`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: mailUser,
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });

    await transporter.sendMail({
      from: this.configService.get<string>(
        'MAIL_FROM',
        'Healthcare System <no-reply@example.com>',
      ),
      to,
      subject,
      html,
      text,
    });

    this.logger.log(`Email sent successfully to ${to}: "${subject}"`);
  }
}
