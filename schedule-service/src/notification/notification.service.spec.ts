import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getQueueToken } from '@nestjs/bull';
import { NOTIFICATION_QUEUE, NotificationJobNames } from './constants/notification.constants';
import { ScheduleNotificationPayload } from './interfaces/notification-payload.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPayload: ScheduleNotificationPayload = {
  customerEmail: 'budi@example.com',
  customerName: 'Budi',
  doctorName: 'Dr. Siti',
  objective: 'General check-up',
  scheduledAt: new Date('2024-06-15T09:00:00Z'),
};

const mockQueue = {
  add: jest.fn().mockResolvedValue({}),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getQueueToken(NOTIFICATION_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── sendScheduleCreatedNotification ───────────────────────────────────────

  describe('sendScheduleCreatedNotification', () => {
    it('should add a SCHEDULE_CREATED job to the queue with correct options', async () => {
      await service.sendScheduleCreatedNotification(mockPayload);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        NotificationJobNames.SCHEDULE_CREATED,
        mockPayload,
        expect.objectContaining({
          attempts: 3,
          removeOnComplete: true,
        }),
      );
    });
  });

  // ── sendScheduleDeletedNotification ───────────────────────────────────────

  describe('sendScheduleDeletedNotification', () => {
    it('should add a SCHEDULE_DELETED job to the queue with correct options', async () => {
      await service.sendScheduleDeletedNotification(mockPayload);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        NotificationJobNames.SCHEDULE_DELETED,
        mockPayload,
        expect.objectContaining({
          attempts: 3,
          removeOnComplete: true,
        }),
      );
    });
  });
});
