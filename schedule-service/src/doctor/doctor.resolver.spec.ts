import { Test, TestingModule } from '@nestjs/testing';
import { DoctorResolver } from './doctor.resolver';
import { DoctorService } from './doctor.service';
import { DoctorModel } from './models/doctor.model';
import { DoctorPaginatedResult } from './models/doctor-paginated.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockDoctor: DoctorModel = {
  id: 'doc-uuid-001',
  name: 'Dr. Siti Rahayu',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockPaginated: DoctorPaginatedResult = {
  data: [mockDoctor],
  total: 1,
  page: 1,
  limit: 10,
};

const mockDoctorService = {
  create: jest.fn(),
  update: jest.fn(),
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

describe('DoctorResolver', () => {
  let resolver: DoctorResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorResolver,
        { provide: DoctorService, useValue: mockDoctorService },
      ],
    })
      .overrideGuard(require('../common/guards/auth.guard').AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<DoctorResolver>(DoctorResolver);
    jest.clearAllMocks();
  });

  // ── createDoctor ──────────────────────────────────────────────────────────

  describe('createDoctor', () => {
    it('should call service.create and return the result', async () => {
      mockDoctorService.create.mockResolvedValue(mockDoctor);

      const result = await resolver.createDoctor({ name: 'Dr. Siti Rahayu' }, mockUser);

      expect(mockDoctorService.create).toHaveBeenCalledWith({ name: 'Dr. Siti Rahayu' });
      expect(result.id).toBe('doc-uuid-001');
    });

    it('should propagate errors from service.create', async () => {
      mockDoctorService.create.mockRejectedValue(new Error('DB error'));
      await expect(
        resolver.createDoctor({ name: 'X' }, mockUser),
      ).rejects.toThrow('DB error');
    });
  });

  // ── updateDoctor ──────────────────────────────────────────────────────────

  describe('updateDoctor', () => {
    it('should call service.update and return updated doctor', async () => {
      const updated = { ...mockDoctor, name: 'Dr. Updated' };
      mockDoctorService.update.mockResolvedValue(updated);

      const result = await resolver.updateDoctor(
        { id: 'doc-uuid-001', name: 'Dr. Updated' },
        mockUser,
      );

      expect(mockDoctorService.update).toHaveBeenCalledWith({
        id: 'doc-uuid-001',
        name: 'Dr. Updated',
      });
      expect(result.name).toBe('Dr. Updated');
    });
  });

  // ── doctors ───────────────────────────────────────────────────────────────

  describe('doctors', () => {
    it('should return paginated doctor results', async () => {
      mockDoctorService.findAll.mockResolvedValue(mockPaginated);

      const result = await resolver.doctors({ page: 1, limit: 10 }, mockUser);

      expect(mockDoctorService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should use defaults when page/limit are undefined', async () => {
      mockDoctorService.findAll.mockResolvedValue(mockPaginated);

      await resolver.doctors({}, mockUser);

      expect(mockDoctorService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  // ── doctor ────────────────────────────────────────────────────────────────

  describe('doctor', () => {
    it('should return a single doctor by ID', async () => {
      mockDoctorService.findOne.mockResolvedValue(mockDoctor);

      const result = await resolver.doctor('doc-uuid-001', mockUser);

      expect(mockDoctorService.findOne).toHaveBeenCalledWith('doc-uuid-001');
      expect(result.name).toBe('Dr. Siti Rahayu');
    });

    it('should propagate NotFoundException', async () => {
      mockDoctorService.findOne.mockRejectedValue(new Error('Not found'));
      await expect(resolver.doctor('bad-id', mockUser)).rejects.toThrow('Not found');
    });
  });

  // ── deleteDoctor ──────────────────────────────────────────────────────────

  describe('deleteDoctor', () => {
    it('should delete and return the doctor', async () => {
      mockDoctorService.delete.mockResolvedValue(mockDoctor);

      const result = await resolver.deleteDoctor('doc-uuid-001', mockUser);

      expect(mockDoctorService.delete).toHaveBeenCalledWith('doc-uuid-001');
      expect(result.id).toBe('doc-uuid-001');
    });

    it('should propagate errors from service.delete', async () => {
      mockDoctorService.delete.mockRejectedValue(new Error('Not found'));
      await expect(resolver.deleteDoctor('bad-id', mockUser)).rejects.toThrow('Not found');
    });
  });
});
