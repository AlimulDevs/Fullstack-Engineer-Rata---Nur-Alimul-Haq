import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

// ─── Mocks ────────────────────────────────────────────────────────────────
const mockPrisma = {
  customer: { findUnique: jest.fn() },
  doctor: { findUnique: jest.fn() },
  schedule: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockNotificationService = {
  sendScheduleCreatedNotification: jest.fn().mockResolvedValue(undefined),
  sendScheduleDeletedNotification: jest.fn().mockResolvedValue(undefined),
};

const mockCustomer = {
  id: 'cust-001',
  name: 'Budi',
  email: 'budi@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDoctor = {
  id: 'doc-001',
  name: 'Dr. Siti',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSchedule = {
  id: 'sched-001',
  objective: 'General check-up',
  customerId: 'cust-001',
  doctorId: 'doc-001',
  scheduledAt: new Date('2024-06-15T09:00:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: mockCustomer,
  doctor: mockDoctor,
};

// ─── Tests ────────────────────────────────────────────────────────────────
describe('ScheduleService', () => {
  let service: ScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    const createInput = {
      objective: 'General check-up',
      customerId: 'cust-001',
      doctorId: 'doc-001',
      scheduledAt: '2024-06-15T09:00:00Z',
    };

    it('should create a schedule and queue notification', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.schedule.findFirst.mockResolvedValue(null); // no conflict
      mockPrisma.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(createInput);

      expect(result.objective).toBe('General check-up');
      expect(mockNotificationService.sendScheduleCreatedNotification).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(createInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if doctor does not exist', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.create(createInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on scheduling conflict', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.schedule.findFirst.mockResolvedValue(mockSchedule); // conflict!

      await expect(service.create(createInput)).rejects.toThrow(ConflictException);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated schedules with no filters', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrisma.schedule.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should apply doctorId filter', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrisma.schedule.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, doctorId: 'doc-001' });

      const findManyCall = mockPrisma.schedule.findMany.mock.calls[0][0];
      expect(findManyCall.where).toMatchObject({ doctorId: 'doc-001' });
    });

    it('should apply date range filter', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([mockSchedule]);
      mockPrisma.schedule.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        fromDate: '2024-06-01T00:00:00Z',
        toDate: '2024-06-30T23:59:59Z',
      });

      const findManyCall = mockPrisma.schedule.findMany.mock.calls[0][0];
      expect(findManyCall.where.scheduledAt).toBeDefined();
      expect(findManyCall.where.scheduledAt.gte).toBeInstanceOf(Date);
      expect(findManyCall.where.scheduledAt.lte).toBeInstanceOf(Date);
    });

    it('should use default page=1 limit=10 when not provided', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([]);
      mockPrisma.schedule.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a schedule by ID', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findOne('sched-001');
      expect(result.id).toBe('sched-001');
    });

    it('should throw NotFoundException for unknown ID', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete schedule and queue notification', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrisma.schedule.delete.mockResolvedValue(mockSchedule);

      const result = await service.delete('sched-001');
      expect(result.id).toBe('sched-001');
      expect(mockNotificationService.sendScheduleDeletedNotification).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.delete('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
