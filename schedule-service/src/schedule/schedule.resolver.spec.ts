import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleResolver } from './schedule.resolver';
import { ScheduleService } from './schedule.service';
import { ScheduleModel } from './models/schedule.model';
import { SchedulePaginatedResult } from './models/schedule-paginated.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockSchedule = {
  id: 'sched-uuid-001',
  objective: 'General check-up',
  customerId: 'cust-001',
  doctorId: 'doc-001',
  scheduledAt: new Date('2024-06-15T09:00:00Z'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  customer: { id: 'cust-001', name: 'Budi', email: 'budi@example.com', createdAt: new Date(), updatedAt: new Date() },
  doctor: { id: 'doc-001', name: 'Dr. Siti', createdAt: new Date(), updatedAt: new Date() },
} as unknown as ScheduleModel;

const mockPaginated: SchedulePaginatedResult = {
  data: [mockSchedule],
  total: 1,
  page: 1,
  limit: 10,
};

const mockScheduleService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

const mockUser = {
  id: 'user-001',
  email: 'admin@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ScheduleResolver', () => {
  let resolver: ScheduleResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleResolver,
        { provide: ScheduleService, useValue: mockScheduleService },
      ],
    })
      .overrideGuard(require('../common/guards/auth.guard').AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<ScheduleResolver>(ScheduleResolver);
    jest.clearAllMocks();
  });

  // ── createSchedule ────────────────────────────────────────────────────────

  describe('createSchedule', () => {
    const input = {
      objective: 'General check-up',
      customerId: 'cust-001',
      doctorId: 'doc-001',
      scheduledAt: '2024-06-15T09:00:00Z',
    };

    it('should call service.create and return the result', async () => {
      mockScheduleService.create.mockResolvedValue(mockSchedule);

      const result = await resolver.createSchedule(input, mockUser);

      expect(mockScheduleService.create).toHaveBeenCalledWith(input);
      expect(result.id).toBe('sched-uuid-001');
      expect(result.objective).toBe('General check-up');
    });

    it('should propagate errors from service.create', async () => {
      mockScheduleService.create.mockRejectedValue(new Error('Conflict'));
      await expect(resolver.createSchedule(input, mockUser)).rejects.toThrow('Conflict');
    });
  });

  // ── schedules ─────────────────────────────────────────────────────────────

  describe('schedules', () => {
    it('should return paginated schedule results', async () => {
      mockScheduleService.findAll.mockResolvedValue(mockPaginated);

      const args = { page: 1, limit: 10 };
      const result = await resolver.schedules(args as any, mockUser);

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(args);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should pass filter args to service.findAll', async () => {
      mockScheduleService.findAll.mockResolvedValue(mockPaginated);

      const args = {
        page: 1,
        limit: 5,
        doctorId: 'doc-001',
        fromDate: '2024-06-01T00:00:00Z',
      };
      await resolver.schedules(args as any, mockUser);

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(args);
    });
  });

  // ── schedule ──────────────────────────────────────────────────────────────

  describe('schedule', () => {
    it('should return a single schedule by ID', async () => {
      mockScheduleService.findOne.mockResolvedValue(mockSchedule);

      const result = await resolver.schedule('sched-uuid-001', mockUser);

      expect(mockScheduleService.findOne).toHaveBeenCalledWith('sched-uuid-001');
      expect(result.objective).toBe('General check-up');
    });

    it('should propagate NotFoundException from service', async () => {
      mockScheduleService.findOne.mockRejectedValue(new Error('Not found'));
      await expect(resolver.schedule('bad-id', mockUser)).rejects.toThrow('Not found');
    });
  });

  // ── deleteSchedule ────────────────────────────────────────────────────────

  describe('deleteSchedule', () => {
    it('should delete and return the schedule', async () => {
      mockScheduleService.delete.mockResolvedValue(mockSchedule);

      const result = await resolver.deleteSchedule('sched-uuid-001', mockUser);

      expect(mockScheduleService.delete).toHaveBeenCalledWith('sched-uuid-001');
      expect(result.id).toBe('sched-uuid-001');
    });

    it('should propagate errors from service.delete', async () => {
      mockScheduleService.delete.mockRejectedValue(new Error('Not found'));
      await expect(resolver.deleteSchedule('bad-id', mockUser)).rejects.toThrow('Not found');
    });
  });
});
