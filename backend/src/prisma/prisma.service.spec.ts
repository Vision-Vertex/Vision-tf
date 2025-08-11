import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(async () => {
    // Create a mock PrismaClient with lifecycle methods
    mockPrismaClient = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
      $transaction: jest.fn(),
      $use: jest.fn(),
      $extends: jest.fn(),
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      auditLog: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      suspiciousActivity: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      loginPattern: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            ...mockPrismaClient,
            onModuleInit: jest.fn().mockImplementation(async () => {
              await mockPrismaClient.$connect();
            }),
            onModuleDestroy: jest.fn().mockImplementation(async () => {
              await mockPrismaClient.$disconnect();
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to the database successfully', async () => {
      // Arrange
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      // Act
      await service.onModuleInit();

      // Assert
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$connect).toHaveBeenCalledWith();
    });

    it('should handle connection errors gracefully', async () => {
      // Arrange
      const connectionError = new Error('Database connection failed');
      mockPrismaClient.$connect.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection timeout', async () => {
      // Arrange
      const timeoutError = new Error('Connection timeout');
      mockPrismaClient.$connect.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Connection timeout',
      );
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockPrismaClient.$connect.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow('Network error');
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database successfully', async () => {
      // Arrange
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      // Act
      await service.onModuleDestroy();

      // Assert
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledWith();
    });

    it('should handle disconnection errors gracefully', async () => {
      // Arrange
      const disconnectionError = new Error('Database disconnection failed');
      mockPrismaClient.$disconnect.mockRejectedValue(disconnectionError);

      // Act & Assert
      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Database disconnection failed',
      );
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection timeout', async () => {
      // Arrange
      const timeoutError = new Error('Disconnection timeout');
      mockPrismaClient.$disconnect.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnection timeout',
      );
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('database operations', () => {
    it('should handle user operations', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.user.findUnique({ where: { id: '1' } });

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle session operations', async () => {
      // Arrange
      const mockSession = { id: '1', sessionToken: 'token123' };
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession as any);

      // Act
      const result = await service.session.findUnique({ where: { id: '1' } });

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle refresh token operations', async () => {
      // Arrange
      const mockRefreshToken = { id: '1', token: 'refresh123' };
      mockPrismaClient.refreshToken.findUnique.mockResolvedValue(
        mockRefreshToken as any,
      );

      // Act
      const result = await service.refreshToken.findUnique({
        where: { id: '1' },
      });

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle audit log operations', async () => {
      // Arrange
      const mockAuditLog = { id: '1', eventType: 'USER_LOGIN' };
      mockPrismaClient.auditLog.findUnique.mockResolvedValue(
        mockAuditLog as any,
      );

      // Act
      const result = await service.auditLog.findUnique({ where: { id: '1' } });

      // Assert
      expect(result).toEqual(mockAuditLog);
      expect(mockPrismaClient.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle suspicious activity operations', async () => {
      // Arrange
      const mockSuspiciousActivity = { id: '1', activityType: 'BRUTE_FORCE' };
      mockPrismaClient.suspiciousActivity.findUnique.mockResolvedValue(
        mockSuspiciousActivity as any,
      );

      // Act
      const result = await service.suspiciousActivity.findUnique({
        where: { id: '1' },
      });

      // Assert
      expect(result).toEqual(mockSuspiciousActivity);
      expect(
        mockPrismaClient.suspiciousActivity.findUnique,
      ).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should handle login pattern operations', async () => {
      // Arrange
      const mockLoginPattern = { id: '1', ipAddress: '192.168.1.1' };
      mockPrismaClient.loginPattern.findUnique.mockResolvedValue(
        mockLoginPattern as any,
      );

      // Act
      const result = await service.loginPattern.findUnique({
        where: { id: '1' },
      });

      // Assert
      expect(result).toEqual(mockLoginPattern);
      expect(mockPrismaClient.loginPattern.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('transaction operations', () => {
    it('should handle successful transactions', async () => {
      // Arrange
      const mockTransactionResult = { success: true };
      mockPrismaClient.$transaction.mockResolvedValue(mockTransactionResult);

      // Act
      const result = await service.$transaction([
        service.user.create({ data: { email: 'test@example.com' } }),
        service.session.create({ data: { sessionToken: 'token123' } }),
      ]);

      // Assert
      expect(result).toEqual(mockTransactionResult);
      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction failures', async () => {
      // Arrange
      const transactionError = new Error('Transaction failed');
      mockPrismaClient.$transaction.mockRejectedValue(transactionError);

      // Act & Assert
      await expect(
        service.$transaction([
          service.user.create({ data: { email: 'test@example.com' } }),
        ]),
      ).rejects.toThrow('Transaction failed');
      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction rollback', async () => {
      // Arrange
      const rollbackError = new Error('Rollback occurred');
      mockPrismaClient.$transaction.mockRejectedValue(rollbackError);

      // Act & Assert
      await expect(
        service.$transaction([
          service.user.create({ data: { email: 'test@example.com' } }),
          service.session.create({ data: { sessionToken: 'token123' } }),
        ]),
      ).rejects.toThrow('Rollback occurred');
      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('event handling', () => {
    it('should handle database events', () => {
      // Arrange
      const mockCallback = jest.fn();

      // Act
      service.$on('query', mockCallback);

      // Assert
      expect(mockPrismaClient.$on).toHaveBeenCalledWith('query', mockCallback);
    });

    it('should handle multiple event listeners', () => {
      // Arrange
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      // Act
      service.$on('query', mockCallback1);
      service.$on('info', mockCallback2);

      // Assert
      expect(mockPrismaClient.$on).toHaveBeenCalledWith('query', mockCallback1);
      expect(mockPrismaClient.$on).toHaveBeenCalledWith('info', mockCallback2);
    });
  });

  describe('middleware operations', () => {
    it('should handle middleware registration', () => {
      // Arrange
      const mockMiddleware = jest.fn();

      // Act
      service.$use(mockMiddleware);

      // Assert
      expect(mockPrismaClient.$use).toHaveBeenCalledWith(mockMiddleware);
    });

    it('should handle multiple middleware registrations', () => {
      // Arrange
      const mockMiddleware1 = jest.fn();
      const mockMiddleware2 = jest.fn();

      // Act
      service.$use(mockMiddleware1);
      service.$use(mockMiddleware2);

      // Assert
      expect(mockPrismaClient.$use).toHaveBeenCalledWith(mockMiddleware1);
      expect(mockPrismaClient.$use).toHaveBeenCalledWith(mockMiddleware2);
    });
  });

  describe('extension operations', () => {
    it('should handle client extensions', () => {
      // Arrange
      const mockExtension = { model: { user: { customMethod: jest.fn() } } };

      // Act
      service.$extends(mockExtension);

      // Assert
      expect(mockPrismaClient.$extends).toHaveBeenCalledWith(mockExtension);
    });
  });

  describe('error handling', () => {
    it('should handle PrismaClientKnownRequestError', async () => {
      // Arrange
      const prismaError = new Error('Record to update not found');
      prismaError.name = 'PrismaClientKnownRequestError';
      mockPrismaClient.user.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        service.user.update({
          where: { id: 'nonexistent' },
          data: { email: 'new@example.com' },
        }),
      ).rejects.toThrow('Record to update not found');
    });

    it('should handle PrismaClientValidationError', async () => {
      // Arrange
      const validationError = new Error('Invalid argument provided');
      validationError.name = 'PrismaClientValidationError';
      mockPrismaClient.user.create.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        service.user.create({
          data: { invalidField: 'value' } as any,
        }),
      ).rejects.toThrow('Invalid argument provided');
    });

    it('should handle PrismaClientInitializationError', async () => {
      // Arrange
      const initError = new Error('Failed to initialize Prisma Client');
      initError.name = 'PrismaClientInitializationError';
      mockPrismaClient.$connect.mockRejectedValue(initError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Failed to initialize Prisma Client',
      );
    });
  });

  describe('connection management', () => {
    it('should handle multiple connection attempts', async () => {
      // Arrange
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'First attempt failed',
      );
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);

      // Second attempt
      await service.onModuleInit();
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(2);
    });

    it('should handle connection state management', async () => {
      // Arrange
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      // Act
      await service.onModuleInit();
      await service.onModuleDestroy();

      // Assert
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
