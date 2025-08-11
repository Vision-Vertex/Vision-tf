import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { SessionService } from './session.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let sessionService: jest.Mocked<SessionService>;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: SessionService,
          useValue: {
            validateSession: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    sessionService = module.get(SessionService);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('validate', () => {
    it('should return user payload from JWT token', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        sessionToken: 'session-token-123',
      };

      const mockSession = {
        id: 'session-id',
        sessionToken: 'session-token-123',
        userId: 'user-id',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        user: { id: 'user-id', email: 'test@example.com' },
      };

      sessionService.validateSession.mockResolvedValue(mockSession as any);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        sessionToken: 'session-token-123',
      });
      expect(sessionService.validateSession).toHaveBeenCalledWith('session-token-123');
    });

    it('should handle payload with missing optional fields', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        sessionToken: 'session-token-123',
      };

      const mockSession = {
        id: 'session-id',
        sessionToken: 'session-token-123',
        userId: 'user-id',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user-id', email: 'test@example.com' },
      };

      sessionService.validateSession.mockResolvedValue(mockSession as any);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        sessionToken: 'session-token-123',
      });
    });

    it('should handle payload with only required fields', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        sessionToken: 'session-token-123',
      };

      const mockSession = {
        id: 'session-id',
        sessionToken: 'session-token-123',
        userId: 'user-id',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user-id', email: 'test@example.com' },
      };

      sessionService.validateSession.mockResolvedValue(mockSession as any);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        sessionToken: 'session-token-123',
      });
    });

    it('should handle empty payload', async () => {
      const payload = {};

      await expect(strategy.validate(payload)).rejects.toThrow('Session token missing from JWT payload');
    });

    it('should handle null payload', async () => {
      const payload = null;

      await expect(strategy.validate(payload)).rejects.toThrow('Session token missing from JWT payload');
    });
  });

  describe('constructor', () => {
    it('should initialize with JWT secret from environment', () => {
      process.env.JWT_SECRET = 'test-secret';
      
      expect(() => new JwtStrategy(sessionService)).not.toThrow();
    });

    it('should handle missing JWT_SECRET environment variable', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => new JwtStrategy(sessionService)).toThrow();
    });
  });
});
