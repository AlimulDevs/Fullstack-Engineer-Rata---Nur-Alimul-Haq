import { Test, TestingModule } from '@nestjs/testing';
import { CustomerResolver } from './customer.resolver';
import { CustomerService } from './customer.service';
import { CustomerModel } from './models/customer.model';
import { CustomerPaginatedResult } from './models/customer-paginated.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockCustomer: CustomerModel = {
  id: 'cust-uuid-001',
  name: 'Budi Santoso',
  email: 'budi@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockPaginated: CustomerPaginatedResult = {
  data: [mockCustomer],
  total: 1,
  page: 1,
  limit: 10,
};

const mockCustomerService = {
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

describe('CustomerResolver', () => {
  let resolver: CustomerResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerResolver,
        { provide: CustomerService, useValue: mockCustomerService },
      ],
    })
      .overrideGuard(require('../common/guards/auth.guard').AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<CustomerResolver>(CustomerResolver);
    jest.clearAllMocks();
  });

  // ── createCustomer ────────────────────────────────────────────────────────

  describe('createCustomer', () => {
    it('should call service.create and return the result', async () => {
      mockCustomerService.create.mockResolvedValue(mockCustomer);

      const result = await resolver.createCustomer(
        { name: 'Budi Santoso', email: 'budi@example.com' },
        mockUser,
      );

      expect(mockCustomerService.create).toHaveBeenCalledWith({
        name: 'Budi Santoso',
        email: 'budi@example.com',
      });
      expect(result.id).toBe('cust-uuid-001');
    });

    it('should propagate errors from service.create', async () => {
      mockCustomerService.create.mockRejectedValue(new Error('Conflict'));
      await expect(
        resolver.createCustomer({ name: 'X', email: 'x@x.com' }, mockUser),
      ).rejects.toThrow('Conflict');
    });
  });

  // ── updateCustomer ────────────────────────────────────────────────────────

  describe('updateCustomer', () => {
    it('should call service.update and return updated customer', async () => {
      const updated = { ...mockCustomer, name: 'Budi Updated' };
      mockCustomerService.update.mockResolvedValue(updated);

      const result = await resolver.updateCustomer(
        { id: 'cust-uuid-001', name: 'Budi Updated' },
        mockUser,
      );

      expect(mockCustomerService.update).toHaveBeenCalledWith({
        id: 'cust-uuid-001',
        name: 'Budi Updated',
      });
      expect(result.name).toBe('Budi Updated');
    });
  });

  // ── customers ─────────────────────────────────────────────────────────────

  describe('customers', () => {
    it('should return paginated customer results', async () => {
      mockCustomerService.findAll.mockResolvedValue(mockPaginated);

      const result = await resolver.customers({ page: 1, limit: 10 }, mockUser);

      expect(mockCustomerService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should use defaults when page/limit are undefined', async () => {
      mockCustomerService.findAll.mockResolvedValue(mockPaginated);

      await resolver.customers({}, mockUser);

      expect(mockCustomerService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  // ── customer ──────────────────────────────────────────────────────────────

  describe('customer', () => {
    it('should return a single customer by ID', async () => {
      mockCustomerService.findOne.mockResolvedValue(mockCustomer);

      const result = await resolver.customer('cust-uuid-001', mockUser);

      expect(mockCustomerService.findOne).toHaveBeenCalledWith('cust-uuid-001');
      expect(result.email).toBe('budi@example.com');
    });

    it('should propagate NotFoundException', async () => {
      mockCustomerService.findOne.mockRejectedValue(new Error('Not found'));
      await expect(resolver.customer('bad-id', mockUser)).rejects.toThrow('Not found');
    });
  });

  // ── deleteCustomer ────────────────────────────────────────────────────────

  describe('deleteCustomer', () => {
    it('should delete and return the customer', async () => {
      mockCustomerService.delete.mockResolvedValue(mockCustomer);

      const result = await resolver.deleteCustomer('cust-uuid-001', mockUser);

      expect(mockCustomerService.delete).toHaveBeenCalledWith('cust-uuid-001');
      expect(result.id).toBe('cust-uuid-001');
    });

    it('should propagate errors from service.delete', async () => {
      mockCustomerService.delete.mockRejectedValue(new Error('Not found'));
      await expect(resolver.deleteCustomer('bad-id', mockUser)).rejects.toThrow('Not found');
    });
  });
});
