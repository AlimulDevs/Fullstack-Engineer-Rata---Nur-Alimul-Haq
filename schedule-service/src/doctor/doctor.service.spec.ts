import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────
const mockPrisma = {
  doctor: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockDoctor = {
  id: 'doc-uuid-001',
  name: 'Dr. Siti Rahayu',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────
describe('DoctorService', () => {
  let service: DoctorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a doctor successfully', async () => {
      mockPrisma.doctor.create.mockResolvedValue(mockDoctor);

      const result = await service.create({ name: 'Dr. Siti Rahayu' });
      expect(result.name).toBe('Dr. Siti Rahayu');
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated doctors', async () => {
      mockPrisma.doctor.findMany.mockResolvedValue([mockDoctor]);
      mockPrisma.doctor.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a doctor by ID', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(mockDoctor);

      const result = await service.findOne('doc-uuid-001');
      expect(result.id).toBe('doc-uuid-001');
    });

    it('should throw NotFoundException for unknown ID', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete a doctor', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.doctor.delete.mockResolvedValue(mockDoctor);

      const result = await service.delete('doc-uuid-001');
      expect(result.id).toBe('doc-uuid-001');
    });

    it('should throw NotFoundException if doctor not found', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.delete('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
