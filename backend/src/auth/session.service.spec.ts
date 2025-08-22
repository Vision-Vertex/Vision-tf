import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { SessionConfigService } from './session-config.service';
import { BadRequestException } from '@nestjs/common';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('SessionService', () => {
  let service: SessionService;
  let prismaService: jest.Mocked<PrismaService>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;
  let sessionConfigService: jest.Mocked<SessionConfigService>;
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
        findFirst: jest.fn(),
      },
    };

    const mockDeviceFingerprintService = {
      createFingerprint: jest.fn(),
      parseDeviceInfo: jest.fn(),
      createDeviceName: jest.fn(),
    };

    const mockSessionConfigService = {
      sessionExpires: 24 * 60 * 60 * 1000, // 24 hours
      rememberMeExpires: 30 * 24 * 60 * 60 * 1000, // 30 days
      sessionExtensionThreshold: 300000, // 5 minutes
      maxSessionsPerUser: 4,
      maxSessionsPerDevice: 2,
      maxDevicesPerUser: 3,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DeviceFingerprintService,
          useValue: mockDeviceFingerprintService,
        },
        {
          provide: SessionConfigService,
          useValue: mockSessionConfigService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prismaService = module.get(PrismaService);
    deviceFingerprintService = module.get(DeviceFingerprintService);
    sessionConfigService = module.get(SessionConfigService);

    // Get mocked crypto
    mockCrypto = require('crypto');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to setup device fingerprint mocks
  const setupDeviceFingerprintMocks = (deviceName = 'Chrome Browser') => {
    deviceFingerprintService.createFingerprint.mockReturnValue(
      'fingerprint-123',
    );
    deviceFingerprintService.parseDeviceInfo.mockReturnValue({
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop',
      isIncognito: false,
    });
    deviceFingerprintService.createDeviceName.mockReturnValue(deviceName);
  };

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
        deviceFingerprint: 'fingerprint-123',
        isIncognito: false,
        screenResolution: null,
        timezone: null,
        language: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks();
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-123'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(userId, userAgent, ipAddress);

      // Assert
      expect(prismaService.session.findMany).toHaveBeenCalledWith({
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
          deviceName: 'Chrome Browser',
          deviceFingerprint: 'fingerprint-123',
          isIncognito: false,
          rememberMe: false,
          screenResolution: undefined,
          timezone: undefined,
          language: undefined,
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

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks();
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
          deviceName: 'Chrome Browser',
          deviceFingerprint: 'fingerprint-123',
          isIncognito: false,
          rememberMe: true,
          screenResolution: undefined,
          timezone: undefined,
          language: undefined,
        },
      });
      expect(result.rememberMe).toBe(true);
    });

    it('should throw error when user has maximum active sessions', async () => {
      // Arrange
      const existingSessions = [
        { deviceFingerprint: 'fingerprint-123', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'fingerprint-123', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'fingerprint-123', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'fingerprint-123', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
      ];

      prismaService.session.findMany.mockResolvedValue(existingSessions as any);
      setupDeviceFingerprintMocks();

      // Act & Assert
      await expect(
        service.createSession(userId, userAgent, ipAddress),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.session.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('should handle different user agents for device detection', async () => {
      // Arrange
      const firefoxUserAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0';
      const mockSession = {
        id: 'session-3',
        sessionToken: 'session-token-789',
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userAgent: firefoxUserAgent,
        ipAddress,
        deviceName: 'Firefox - Windows - Desktop',
        rememberMe: false,
        isActive: true,
      };

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      deviceFingerprintService.createFingerprint.mockReturnValue('firefox-fingerprint');
      deviceFingerprintService.parseDeviceInfo.mockReturnValue({
        browser: 'Firefox',
        browserVersion: '91',
        os: 'Windows',
        osVersion: '10',
        device: 'Desktop',
        isIncognito: false,
      });
      deviceFingerprintService.createDeviceName.mockReturnValue('Firefox - Windows - Desktop');
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-789'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(userId, firefoxUserAgent, ipAddress);

      // Assert
      expect(deviceFingerprintService.createFingerprint).toHaveBeenCalledWith({
        userAgent: firefoxUserAgent,
        ipAddress,
        screenResolution: undefined,
        timezone: undefined,
        language: undefined,
      });
      expect(result).toEqual(mockSession);
    });

    it('should handle unknown user agents', async () => {
      // Arrange
      const unknownUserAgent = 'Unknown Browser/1.0';
      const mockSession = {
        id: 'session-4',
        sessionToken: 'session-token-unknown',
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userAgent: unknownUserAgent,
        ipAddress,
        deviceName: 'Unknown - Unknown - Desktop',
        rememberMe: false,
        isActive: true,
      };

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      deviceFingerprintService.createFingerprint.mockReturnValue('unknown-fingerprint');
      deviceFingerprintService.parseDeviceInfo.mockReturnValue({
        browser: 'Unknown',
        browserVersion: '',
        os: 'Unknown',
        osVersion: '',
        device: 'Desktop',
        isIncognito: false,
      });
      deviceFingerprintService.createDeviceName.mockReturnValue('Unknown - Unknown - Desktop');
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-unknown'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.createSession(userId, unknownUserAgent, ipAddress);

      // Assert
      expect(deviceFingerprintService.createFingerprint).toHaveBeenCalledWith({
        userAgent: unknownUserAgent,
        ipAddress,
        screenResolution: undefined,
        timezone: undefined,
        language: undefined,
      });
      expect(result).toEqual(mockSession);
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

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks('iPhone');
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

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks('iPad');
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

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks('Android Device');
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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0';
      const sessionToken = 'session-token-firefox';
      const mockSession = {
        id: 'session-firefox',
        sessionToken,
        deviceName: 'Firefox Browser',
        isActive: true,
      };

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks('Firefox Browser');
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

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks('Safari Browser');
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

      prismaService.session.findMany.mockResolvedValue([]); // No existing sessions
      setupDeviceFingerprintMocks('Edge Browser');
      mockCrypto.randomBytes.mockReturnValue(Buffer.from('session-token-edge'));
      prismaService.session.create.mockResolvedValue(mockSession as any);

      // Act
      await service.createSession('user-123', userAgent, '192.168.1.1');

      // Assert
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: 'Edge Browser',
        }),
      });
    });
  });
});

describe('SessionService - Smart Session Counting', () => {
  let service: SessionService;
  let prismaService: jest.Mocked<PrismaService>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;
  let sessionConfigService: jest.Mocked<SessionConfigService>;

  const mockSessionConfig = {
    maxSessionsPerUser: 4,
    maxSessionsPerDevice: 2,
    maxDevicesPerUser: 3,
    sessionExpires: 24 * 60 * 60 * 1000, // 24 hours
    rememberMeExpires: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  beforeEach(async () => {
    const mockPrismaService = {
      session: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(), // Keep for backward compatibility
        findFirst: jest.fn(), // Keep for backward compatibility
      },
    };

    const mockDeviceFingerprintService = {
      createFingerprint: jest.fn(),
      parseDeviceInfo: jest.fn(),
      createDeviceName: jest.fn(),
    };

    const mockSessionConfigService = {
      sessionExpires: 24 * 60 * 60 * 1000, // 24 hours
      rememberMeExpires: 30 * 24 * 60 * 60 * 1000, // 30 days
      sessionExtensionThreshold: 300000, // 5 minutes
      maxSessionsPerUser: 4,
      maxSessionsPerDevice: 2,
      maxDevicesPerUser: 3,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DeviceFingerprintService,
          useValue: mockDeviceFingerprintService,
        },
        {
          provide: SessionConfigService,
          useValue: mockSessionConfigService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prismaService = module.get(PrismaService);
    deviceFingerprintService = module.get(DeviceFingerprintService);
    sessionConfigService = module.get(SessionConfigService);
  });

  describe('enforceSmartSessionLimits', () => {
    it('should allow creating first session', async () => {
      prismaService.session.findMany.mockResolvedValue([]);
      
      await expect(
        service['enforceSmartSessionLimits']('user1', 'device1')
      ).resolves.not.toThrow();
    });

    it('should allow creating second session on same device', async () => {
      const existingSessions = [
        { deviceFingerprint: 'device1', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
      ];
      prismaService.session.findMany.mockResolvedValue(existingSessions as any);
      
      await expect(
        service['enforceSmartSessionLimits']('user1', 'device1')
      ).resolves.not.toThrow();
    });

    it('should block third session on same device', async () => {
      const existingSessions = [
        { deviceFingerprint: 'device1', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'device1', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
      ];
      prismaService.session.findMany.mockResolvedValue(existingSessions as any);
      
      await expect(
        service['enforceSmartSessionLimits']('user1', 'device1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should block when total session limit is reached', async () => {
      const existingSessions = [
        { deviceFingerprint: 'device1', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'device2', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'device3', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'device4', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
      ];
      prismaService.session.findMany.mockResolvedValue(existingSessions as any);
      
      await expect(
        service['enforceSmartSessionLimits']('user1', 'device5')
      ).rejects.toThrow(BadRequestException);
    });

    it('should block when device limit is reached', async () => {
      const existingSessions = [
        { deviceFingerprint: 'device1', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'device2', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
        { deviceFingerprint: 'device3', isActive: true, expiresAt: new Date(Date.now() + 3600000) },
      ];
      prismaService.session.findMany.mockResolvedValue(existingSessions as any);
      
      await expect(
        service['enforceSmartSessionLimits']('user1', 'device4')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
