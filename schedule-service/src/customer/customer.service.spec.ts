import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────
const mockPrisma = {
  customer: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockCustomer = {
  id: 'cust-uuid-001',
  name: 'Budi Santoso',
  email: 'budi@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────
describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a customer successfully', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create({
        name: 'Budi Santoso',
        email: 'budi@example.com',
      });

      expect(result.name).toBe('Budi Santoso');
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: { name: 'Budi Santoso', email: 'budi@example.com' },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        service.create({ name: 'Other', email: 'budi@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated customers', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrisma.customer.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a customer by ID', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne('cust-uuid-001');
      expect(result.id).toBe('cust-uuid-001');
    });

    it('should throw NotFoundException for unknown ID', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete and return the customer', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.customer.delete.mockResolvedValue(mockCustomer);

      const result = await service.delete('cust-uuid-001');
      expect(result.id).toBe('cust-uuid-001');
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.delete('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
