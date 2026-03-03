import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn(),
};

const mockUser = {
  id: 'uuid-123',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── register ────────────────────────────────────────────────────────────
  describe('register', () => {
    it('should register a new user and return token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ───────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should login an existing user and return token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── validateToken ────────────────────────────────────────────────────────
  describe('validateToken', () => {
    it('should return isValid=true for a valid token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'uuid-123', email: 'test@example.com' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateToken('valid_token');

      expect(result.isValid).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should return isValid=false for an invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await service.validateToken('invalid_token');

      expect(result.isValid).toBe(false);
      expect(result.user).toBeUndefined();
    });

    it('should return isValid=false when user no longer exists', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'uuid-deleted', email: 'deleted@example.com' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateToken('token_for_deleted_user');

      expect(result.isValid).toBe(false);
    });
  });
});
