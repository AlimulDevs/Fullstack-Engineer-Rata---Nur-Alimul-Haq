import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthResponse, ValidateTokenResponse } from './models/auth-response.model';
import { UserModel } from './models/user.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUser: UserModel = {
  id: 'uuid-123',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'mock_token',
  user: mockUser,
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  validateToken: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    jest.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await resolver.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should propagate errors thrown by authService.register', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Conflict'));

      await expect(
        resolver.register({ email: 'dupe@example.com', password: 'pass123' }),
      ).rejects.toThrow('Conflict');
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await resolver.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.accessToken).toBe('mock_token');
      expect(result.user.id).toBe('uuid-123');
    });

    it('should propagate errors thrown by authService.login', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        resolver.login({ email: 'bad@example.com', password: 'wrongpass' }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  // ── validateToken ─────────────────────────────────────────────────────────

  describe('validateToken', () => {
    it('should return isValid=true with user for a valid token', async () => {
      const response: ValidateTokenResponse = { isValid: true, user: mockUser };
      mockAuthService.validateToken.mockResolvedValue(response);

      const result = await resolver.validateToken('valid_token');

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid_token');
      expect(result.isValid).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should return isValid=false for an invalid token', async () => {
      const response: ValidateTokenResponse = { isValid: false };
      mockAuthService.validateToken.mockResolvedValue(response);

      const result = await resolver.validateToken('invalid_token');

      expect(result.isValid).toBe(false);
      expect(result.user).toBeUndefined();
    });

    it('should propagate errors thrown by authService.validateToken', async () => {
      mockAuthService.validateToken.mockRejectedValue(new Error('Service error'));

      await expect(resolver.validateToken('token')).rejects.toThrow('Service error');
    });
  });
});
