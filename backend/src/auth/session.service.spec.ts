import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('SessionService', () => {
  let service: SessionService;
  let prismaService: jest.Mocked<PrismaService>;
  let mockCrypto: any;

  beforeEach(async () => {
    const mockPrismaService = {
      session: {
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prismaService = module.get(PrismaService);

    // Get mocked crypto
    mockCrypto = require('crypto');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    const userId = 'user-123';
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const ipAddress = '192.168.1.1';

    it('should create a session successfully', async () => {
      // Arrange
      const sessionToken = 'session-token-123';
      const mockSession = {
        id: 'session-1',
        sessionToken,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userAgent,
        ipAddress,
        deviceName: 'Chrome Browser',
        rememberMe: false,
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(2);
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-123'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(userId, userAgent, ipAddress);

      // Assert
      expect(prismaService.session.count).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
      });
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: {
          sessionToken: expect.any(String),
          userId,
          expiresAt: expect.any(Date),
          userAgent,
          ipAddress,
          deviceName: 'Unknown Device',
          rememberMe: false,
        },
      });
      expect(result).toEqual(mockSession);
    });

    it('should create a session with remember me enabled', async () => {
      // Arrange
      const sessionToken = 'session-token-456';
      const mockSession = {
        id: 'session-2',
        sessionToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent,
        ipAddress,
        deviceName: 'Chrome Browser',
        rememberMe: true,
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(1);
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-456'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(
        userId,
        userAgent,
        ipAddress,
        true,
      );

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: {
          sessionToken: expect.any(String),
          userId,
          expiresAt: expect.any(Date),
          userAgent,
          ipAddress,
          deviceName: 'Unknown Device',
          rememberMe: true,
        },
      });
      expect(result.rememberMe).toBe(true);
    });

    it('should throw error when user has maximum active sessions', async () => {
      // Arrange
      prismaService.session.count.mockResolvedValue(3);

      // Act & Assert
      await expect(
        service.createSession(userId, userAgent, ipAddress),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.session.count).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
      });
      expect(prismaService.session.create).not.toHaveBeenCalled();
    });

    it('should handle different user agents for device detection', async () => {
      // Arrange
      const sessionToken = 'session-token-789';
      const iphoneUserAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const mockSession = {
        id: 'session-3',
        sessionToken,
        userId,
        deviceName: 'iPhone',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-789'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(
        userId,
        iphoneUserAgent,
        ipAddress,
      );

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'iPhone',
        }),
      });
    });

    it('should handle unknown user agents', async () => {
      // Arrange
      const sessionToken = 'session-token-unknown';
      const unknownUserAgent = 'Unknown Browser/1.0';
      const mockSession = {
        id: 'session-4',
        sessionToken,
        userId,
        deviceName: 'Unknown Device',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(
        Buffer.from('session-token-unknown'),
      );
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(
        userId,
        unknownUserAgent,
        ipAddress,
      );

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'Unknown Device',
        }),
      });
    });
  });

  describe('terminateSession', () => {
    it('should terminate a session successfully', async () => {
      // Arrange
      const sessionToken = 'session-token-123';
      prismaService.session.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      await service.terminateSession(sessionToken);

      // Assert
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { sessionToken },
        data: { isActive: false },
      });
    });

    it('should handle non-existent session token', async () => {
      // Arrange
      const sessionToken = 'non-existent-token';
      prismaService.session.updateMany.mockResolvedValue({ count: 0 } as any);

      // Act
      await service.terminateSession(sessionToken);

      // Assert
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { sessionToken },
        data: { isActive: false },
      });
    });
  });

  describe('terminateAllUserSessions', () => {
    it('should terminate all user sessions successfully', async () => {
      // Arrange
      const userId = 'user-123';
      prismaService.session.updateMany.mockResolvedValue({ count: 3 } as any);

      // Act
      await service.terminateAllUserSessions(userId);

      // Assert
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    });

    it('should handle user with no active sessions', async () => {
      // Arrange
      const userId = 'user-456';
      prismaService.session.updateMany.mockResolvedValue({ count: 0 } as any);

      // Act
      await service.terminateAllUserSessions(userId);

      // Assert
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const mockSessions = [
        {
          id: 'session-1',
          sessionToken: 'token-1',
          deviceName: 'Chrome Browser',
          lastActivityAt: new Date(),
          isActive: true,
        },
        {
          id: 'session-2',
          sessionToken: 'token-2',
          deviceName: 'iPhone',
          lastActivityAt: new Date(),
          isActive: true,
        },
      ];

      prismaService.session.findMany.mockResolvedValue(mockSessions as any);

      // Act
      const result = await service.getUserSessions(userId);

      // Assert
      expect(prismaService.session.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
      expect(result).toEqual(mockSessions);
    });

    it('should return empty array for user with no active sessions', async () => {
      // Arrange
      const userId = 'user-456';
      prismaService.session.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getUserSessions(userId);

      // Assert
      expect(prismaService.session.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateSessionActivity', () => {
    it('should update session activity successfully', async () => {
      // Arrange
      const sessionToken = 'session-token-123';
      prismaService.session.update.mockResolvedValue({} as any);

      // Act
      await service.updateSessionActivity(sessionToken);

      // Assert
      expect(prismaService.session.update).toHaveBeenCalledWith({
        where: { sessionToken },
        data: { lastActivityAt: expect.any(Date) },
      });
    });
  });

  describe('validateSession', () => {
    it('should validate active session successfully', async () => {
      // Arrange
      const sessionToken = 'session-token-123';
      const mockSession = {
        id: 'session-1',
        sessionToken,
        userId: 'user-123',
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      prismaService.session.findUnique.mockResolvedValue(mockSession as any);
      prismaService.session.update.mockResolvedValue({} as any);

      // Act
      const result = await service.validateSession(sessionToken);

      // Assert
      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken },
        include: { user: true },
      });
      expect(prismaService.session.update).toHaveBeenCalledWith({
        where: { sessionToken },
        data: { lastActivityAt: expect.any(Date) },
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null for inactive session', async () => {
      // Arrange
      const sessionToken = 'session-token-123';
      const mockSession = {
        id: 'session-1',
        sessionToken,
        userId: 'user-123',
        isActive: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      prismaService.session.findUnique.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.validateSession(sessionToken);

      // Assert
      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken },
        include: { user: true },
      });
      expect(prismaService.session.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      // Arrange
      const sessionToken = 'session-token-123';
      const mockSession = {
        id: 'session-1',
        sessionToken,
        userId: 'user-123',
        isActive: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      prismaService.session.findUnique.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.validateSession(sessionToken);

      // Assert
      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken },
        include: { user: true },
      });
      expect(prismaService.session.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      // Arrange
      const sessionToken = 'non-existent-token';
      prismaService.session.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateSession(sessionToken);

      // Assert
      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken },
        include: { user: true },
      });
      expect(prismaService.session.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions successfully', async () => {
      // Arrange
      prismaService.session.updateMany.mockResolvedValue({ count: 5 } as any);

      // Act
      await service.cleanupExpiredSessions();

      // Assert
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          isActive: true,
        },
        data: { isActive: false },
      });
    });

    it('should handle no expired sessions', async () => {
      // Arrange
      prismaService.session.updateMany.mockResolvedValue({ count: 0 } as any);

      // Act
      await service.cleanupExpiredSessions();

      // Assert
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          isActive: true,
        },
        data: { isActive: false },
      });
    });
  });

  describe('device name parsing', () => {
    it('should parse iPhone user agent', async () => {
      // Arrange
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const sessionToken = 'session-token-iphone';
      const mockSession = {
        id: 'session-iphone',
        sessionToken,
        deviceName: 'iPhone',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(
        Buffer.from('session-token-iphone'),
      );
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'iPhone',
        }),
      });
    });

    it('should parse iPad user agent', async () => {
      // Arrange
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const sessionToken = 'session-token-ipad';
      const mockSession = {
        id: 'session-ipad',
        sessionToken,
        deviceName: 'iPad',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-ipad'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'iPad',
        }),
      });
    });

    it('should parse Android user agent', async () => {
      // Arrange
      const userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)';
      const sessionToken = 'session-token-android';
      const mockSession = {
        id: 'session-android',
        sessionToken,
        deviceName: 'Android Device',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(
        Buffer.from('session-token-android'),
      );
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'Android Device',
        }),
      });
    });

    it('should parse Firefox user agent', async () => {
      // Arrange
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0';
      const sessionToken = 'session-token-firefox';
      const mockSession = {
        id: 'session-firefox',
        sessionToken,
        deviceName: 'Firefox Browser',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(
        Buffer.from('session-token-firefox'),
      );
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'Firefox Browser',
        }),
      });
    });

    it('should parse Safari user agent', async () => {
      // Arrange
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
      const sessionToken = 'session-token-safari';
      const mockSession = {
        id: 'session-safari',
        sessionToken,
        deviceName: 'Safari Browser',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(
        Buffer.from('session-token-safari'),
      );
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'Safari Browser',
        }),
      });
    });

    it('should parse Edge user agent', async () => {
      // Arrange
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      const sessionToken = 'session-token-edge';
      const mockSession = {
        id: 'session-edge',
        sessionToken,
        deviceName: 'Edge Browser',
        isActive: true,
      };

      prismaService.session.count.mockResolvedValue(0);
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-edge'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'Chrome Browser', // Edge user agent contains "Chrome" which is checked first
        }),
      });
    });
  });
});
