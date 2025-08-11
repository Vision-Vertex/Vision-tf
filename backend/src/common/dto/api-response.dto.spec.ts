import {
  SuccessResponse,
  ErrorResponse,
  CreatedResponse,
  PaginatedResponse,
  AuthResponse,
  TwoFactorSetupResponse,
  SessionInfo,
  UserProfile,
  AuditLogEntry,
  SuspiciousActivity,
  LoginPattern,
} from './api-response.dto';

describe('API Response DTOs', () => {
  describe('SuccessResponse', () => {
    it('should create a success response with message only', () => {
      // Arrange & Act
      const response = new SuccessResponse('Operation completed successfully');

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Operation completed successfully');
      expect(response.data).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create a success response with message and data', () => {
      // Arrange
      const data = { id: '123', name: 'Test User' };

      // Act
      const response = new SuccessResponse('User created successfully', data);

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('User created successfully');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create a success response with message, data, and path', () => {
      // Arrange
      const data = { id: '123', name: 'Test User' };
      const path = '/api/v1/users';

      // Act
      const response = new SuccessResponse(
        'User created successfully',
        data,
        path,
      );

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('User created successfully');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe(path);
    });

    it('should generate timestamp in ISO format', () => {
      // Arrange & Act
      const response = new SuccessResponse('Test message');

      // Assert
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });

  describe('CreatedResponse', () => {
    it('should create a created response with message only', () => {
      // Arrange & Act
      const response = new CreatedResponse('Resource created successfully');

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.message).toBe('Resource created successfully');
      expect(response.data).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create a created response with message and data', () => {
      // Arrange
      const data = { id: '123', name: 'Test User' };

      // Act
      const response = new CreatedResponse('User created successfully', data);

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.message).toBe('User created successfully');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create a created response with message, data, and path', () => {
      // Arrange
      const data = { id: '123', name: 'Test User' };
      const path = '/api/v1/users';

      // Act
      const response = new CreatedResponse(
        'User created successfully',
        data,
        path,
      );

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.message).toBe('User created successfully');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe(path);
    });
  });

  describe('ErrorResponse', () => {
    it('should create an error response with status code and message', () => {
      // Arrange & Act
      const response = new ErrorResponse(400, 'Bad Request');

      // Assert
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Bad Request');
      expect(response.data).toBeUndefined();
      expect(response.errorCode).toBeUndefined();
      expect(response.details).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create an error response with error code', () => {
      // Arrange & Act
      const response = new ErrorResponse(
        400,
        'Bad Request',
        'VALIDATION_ERROR',
      );

      // Assert
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Bad Request');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.details).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create an error response with error code and details', () => {
      // Arrange
      const details = { field: 'email', reason: 'Invalid format' };

      // Act
      const response = new ErrorResponse(
        400,
        'Bad Request',
        'VALIDATION_ERROR',
        details,
      );

      // Assert
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Bad Request');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.details).toEqual(details);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create an error response with path', () => {
      // Arrange
      const path = '/api/v1/users';

      // Act
      const response = new ErrorResponse(
        400,
        'Bad Request',
        'VALIDATION_ERROR',
        undefined,
        path,
      );

      // Assert
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Bad Request');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.details).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe(path);
    });

    it('should handle different HTTP status codes', () => {
      // Arrange
      const statusCodes = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503];

      for (const statusCode of statusCodes) {
        // Act
        const response = new ErrorResponse(statusCode, 'Error message');

        // Assert
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(statusCode);
        expect(response.message).toBe('Error message');
      }
    });
  });

  describe('PaginatedResponse', () => {
    it('should create a paginated response with data and pagination info', () => {
      // Arrange
      const data = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      };

      // Act
      const response = new PaginatedResponse(
        'Users retrieved successfully',
        data,
        pagination,
      );

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Users retrieved successfully');
      expect(response.data).toEqual(data);
      expect(response.pagination).toEqual(pagination);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe('');
    });

    it('should create a paginated response with path', () => {
      // Arrange
      const data = [{ id: '1', name: 'User 1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const path = '/api/v1/users';

      // Act
      const response = new PaginatedResponse(
        'Users retrieved successfully',
        data,
        pagination,
        path,
      );

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Users retrieved successfully');
      expect(response.data).toEqual(data);
      expect(response.pagination).toEqual(pagination);
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBe(path);
    });

    it('should handle empty data array', () => {
      // Arrange
      const data: any[] = [];
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      // Act
      const response = new PaginatedResponse(
        'No users found',
        data,
        pagination,
      );

      // Assert
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('No users found');
      expect(response.data).toEqual([]);
      expect(response.pagination).toEqual(pagination);
    });

    it('should handle pagination with single page', () => {
      // Arrange
      const data = [{ id: '1', name: 'User 1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      // Act
      const response = new PaginatedResponse(
        'User retrieved successfully',
        data,
        pagination,
      );

      // Assert
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(false);
      expect(response.pagination.totalPages).toBe(1);
    });

    it('should handle pagination with multiple pages', () => {
      // Arrange
      const data = [{ id: '1', name: 'User 1' }];
      const pagination = {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      };

      // Act
      const response = new PaginatedResponse(
        'Users retrieved successfully',
        data,
        pagination,
      );

      // Assert
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(true);
      expect(response.pagination.totalPages).toBe(3);
    });
  });

  describe('AuthResponse', () => {
    it('should have the correct structure', () => {
      // Arrange
      const authResponse = new AuthResponse();
      authResponse.accessToken = 'access-token-123';
      authResponse.refreshToken = 'refresh-token-456';
      authResponse.expiresIn = 3600;
      authResponse.tokenType = 'Bearer';
      authResponse.user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'CLIENT',
        isEmailVerified: true,
      };
      authResponse.session = {
        sessionToken: 'session-token-789',
        deviceName: 'Chrome Browser',
        expiresAt: '2025-08-07T14:00:00.000Z',
      };

      // Assert
      expect(authResponse.accessToken).toBe('access-token-123');
      expect(authResponse.refreshToken).toBe('refresh-token-456');
      expect(authResponse.expiresIn).toBe(3600);
      expect(authResponse.tokenType).toBe('Bearer');
      expect(authResponse.user.id).toBe('user-123');
      expect(authResponse.user.email).toBe('test@example.com');
      expect(authResponse.user.username).toBe('testuser');
      expect(authResponse.user.role).toBe('CLIENT');
      expect(authResponse.user.isEmailVerified).toBe(true);
      expect(authResponse.session?.sessionToken).toBe('session-token-789');
      expect(authResponse.session?.deviceName).toBe('Chrome Browser');
      expect(authResponse.session?.expiresAt).toBe('2025-08-07T14:00:00.000Z');
    });

    it('should handle optional session field', () => {
      // Arrange
      const authResponse = new AuthResponse();
      authResponse.accessToken = 'access-token-123';
      authResponse.refreshToken = 'refresh-token-456';
      authResponse.expiresIn = 3600;
      authResponse.tokenType = 'Bearer';
      authResponse.user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'CLIENT',
        isEmailVerified: true,
      };
      // session not set

      // Assert
      expect(authResponse.session).toBeUndefined();
    });
  });

  describe('TwoFactorSetupResponse', () => {
    it('should have the correct structure', () => {
      // Arrange
      const twoFactorResponse = new TwoFactorSetupResponse();
      twoFactorResponse.secret = 'JBSWY3DPEHPK3PXP';
      twoFactorResponse.qrCodeUrl =
        'otpauth://totp/Vision-TF?secret=JBSWY3DPEHPK3PXP&issuer=Vision-TF';
      twoFactorResponse.qrCode =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      twoFactorResponse.backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];
      twoFactorResponse.instructions =
        'Scan the QR code with your authenticator app';

      // Assert
      expect(twoFactorResponse.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(twoFactorResponse.qrCodeUrl).toBe(
        'otpauth://totp/Vision-TF?secret=JBSWY3DPEHPK3PXP&issuer=Vision-TF',
      );
      expect(twoFactorResponse.qrCode).toBe(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      );
      expect(twoFactorResponse.backupCodes).toEqual([
        'ABCD1234',
        'EFGH5678',
        'IJKL9012',
      ]);
      expect(twoFactorResponse.instructions).toBe(
        'Scan the QR code with your authenticator app',
      );
    });
  });

  describe('SessionInfo', () => {
    it('should have the correct structure', () => {
      // Arrange
      const sessionInfo = new SessionInfo();
      sessionInfo.sessionToken = 'session-token-123';
      sessionInfo.deviceName = 'Chrome Browser';
      sessionInfo.ipAddress = '192.168.1.1';
      sessionInfo.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      sessionInfo.createdAt = '2025-08-07T10:00:00.000Z';
      sessionInfo.expiresAt = '2025-08-08T10:00:00.000Z';
      sessionInfo.lastActivityAt = '2025-08-07T14:00:00.000Z';
      sessionInfo.isCurrentSession = true;

      // Assert
      expect(sessionInfo.sessionToken).toBe('session-token-123');
      expect(sessionInfo.deviceName).toBe('Chrome Browser');
      expect(sessionInfo.ipAddress).toBe('192.168.1.1');
      expect(sessionInfo.userAgent).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      );
      expect(sessionInfo.createdAt).toBe('2025-08-07T10:00:00.000Z');
      expect(sessionInfo.expiresAt).toBe('2025-08-08T10:00:00.000Z');
      expect(sessionInfo.lastActivityAt).toBe('2025-08-07T14:00:00.000Z');
      expect(sessionInfo.isCurrentSession).toBe(true);
    });
  });

  describe('UserProfile', () => {
    it('should have the correct structure', () => {
      // Arrange
      const userProfile = new UserProfile();
      userProfile.id = 'user-123';
      userProfile.email = 'test@example.com';
      userProfile.username = 'testuser';
      userProfile.firstname = 'John';
      userProfile.middlename = 'Michael';
      userProfile.lastname = 'Doe';
      userProfile.role = 'CLIENT';
      userProfile.isEmailVerified = true;
      userProfile.isTwoFactorEnabled = false;
      userProfile.createdAt = '2025-08-01T10:00:00.000Z';
      userProfile.updatedAt = '2025-08-07T14:00:00.000Z';
      userProfile.isActive = true;

      // Assert
      expect(userProfile.id).toBe('user-123');
      expect(userProfile.email).toBe('test@example.com');
      expect(userProfile.username).toBe('testuser');
      expect(userProfile.firstname).toBe('John');
      expect(userProfile.middlename).toBe('Michael');
      expect(userProfile.lastname).toBe('Doe');
      expect(userProfile.role).toBe('CLIENT');
      expect(userProfile.isEmailVerified).toBe(true);
      expect(userProfile.isTwoFactorEnabled).toBe(false);
      expect(userProfile.createdAt).toBe('2025-08-01T10:00:00.000Z');
      expect(userProfile.updatedAt).toBe('2025-08-07T14:00:00.000Z');
      expect(userProfile.isActive).toBe(true);
    });

    it('should handle optional middlename field', () => {
      // Arrange
      const userProfile = new UserProfile();
      userProfile.id = 'user-123';
      userProfile.email = 'test@example.com';
      userProfile.username = 'testuser';
      userProfile.firstname = 'John';
      userProfile.lastname = 'Doe';
      userProfile.role = 'CLIENT';
      userProfile.isEmailVerified = true;
      userProfile.isTwoFactorEnabled = false;
      userProfile.createdAt = '2025-08-01T10:00:00.000Z';
      userProfile.updatedAt = '2025-08-07T14:00:00.000Z';
      userProfile.isActive = true;
      // middlename not set

      // Assert
      expect(userProfile.middlename).toBeUndefined();
    });
  });

  describe('AuditLogEntry', () => {
    it('should have the correct structure', () => {
      // Arrange
      const auditLogEntry = new AuditLogEntry();
      auditLogEntry.id = 'audit-123';
      auditLogEntry.userId = 'user-123';
      auditLogEntry.eventType = 'USER_LOGIN';
      auditLogEntry.eventCategory = 'AUTHENTICATION';
      auditLogEntry.description = 'User logged in successfully';
      auditLogEntry.details = { ipAddress: '192.168.1.1', userAgent: 'Chrome' };
      auditLogEntry.ipAddress = '192.168.1.1';
      auditLogEntry.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      auditLogEntry.severity = 'INFO';
      auditLogEntry.createdAt = '2025-08-07T14:00:00.000Z';

      // Assert
      expect(auditLogEntry.id).toBe('audit-123');
      expect(auditLogEntry.userId).toBe('user-123');
      expect(auditLogEntry.eventType).toBe('USER_LOGIN');
      expect(auditLogEntry.eventCategory).toBe('AUTHENTICATION');
      expect(auditLogEntry.description).toBe('User logged in successfully');
      expect(auditLogEntry.details).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
      });
      expect(auditLogEntry.ipAddress).toBe('192.168.1.1');
      expect(auditLogEntry.userAgent).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      );
      expect(auditLogEntry.severity).toBe('INFO');
      expect(auditLogEntry.createdAt).toBe('2025-08-07T14:00:00.000Z');
    });

    it('should handle optional userId field', () => {
      // Arrange
      const auditLogEntry = new AuditLogEntry();
      auditLogEntry.id = 'audit-123';
      auditLogEntry.eventType = 'SYSTEM_STARTUP';
      auditLogEntry.eventCategory = 'SYSTEM';
      auditLogEntry.description = 'System started successfully';
      auditLogEntry.details = { version: '1.0.0' };
      auditLogEntry.severity = 'INFO';
      auditLogEntry.createdAt = '2025-08-07T14:00:00.000Z';
      // userId not set

      // Assert
      expect(auditLogEntry.userId).toBeUndefined();
    });
  });

  describe('SuspiciousActivity', () => {
    it('should have the correct structure', () => {
      // Arrange
      const suspiciousActivity = new SuspiciousActivity();
      suspiciousActivity.id = 'activity-123';
      suspiciousActivity.activityType = 'BRUTE_FORCE_ATTEMPT';
      suspiciousActivity.severity = 'HIGH';
      suspiciousActivity.description =
        'Multiple failed login attempts detected';
      suspiciousActivity.details = { attempts: 10, timeWindow: '5 minutes' };
      suspiciousActivity.ipAddress = '192.168.1.1';
      suspiciousActivity.riskScore = 85;
      suspiciousActivity.confidence = 0.95;
      suspiciousActivity.status = 'DETECTED';
      suspiciousActivity.detectedAt = '2025-08-07T14:00:00.000Z';
      suspiciousActivity.reviewNotes = 'Automatically flagged for review';

      // Assert
      expect(suspiciousActivity.id).toBe('activity-123');
      expect(suspiciousActivity.activityType).toBe('BRUTE_FORCE_ATTEMPT');
      expect(suspiciousActivity.severity).toBe('HIGH');
      expect(suspiciousActivity.description).toBe(
        'Multiple failed login attempts detected',
      );
      expect(suspiciousActivity.details).toEqual({
        attempts: 10,
        timeWindow: '5 minutes',
      });
      expect(suspiciousActivity.ipAddress).toBe('192.168.1.1');
      expect(suspiciousActivity.riskScore).toBe(85);
      expect(suspiciousActivity.confidence).toBe(0.95);
      expect(suspiciousActivity.status).toBe('DETECTED');
      expect(suspiciousActivity.detectedAt).toBe('2025-08-07T14:00:00.000Z');
      expect(suspiciousActivity.reviewNotes).toBe(
        'Automatically flagged for review',
      );
    });

    it('should handle optional fields', () => {
      // Arrange
      const suspiciousActivity = new SuspiciousActivity();
      suspiciousActivity.id = 'activity-123';
      suspiciousActivity.activityType = 'UNUSUAL_LOGIN_TIME';
      suspiciousActivity.severity = 'MEDIUM';
      suspiciousActivity.description = 'Login at unusual hour';
      suspiciousActivity.details = { loginTime: '03:00 AM' };
      suspiciousActivity.riskScore = 45;
      suspiciousActivity.confidence = 0.75;
      suspiciousActivity.status = 'DETECTED';
      suspiciousActivity.detectedAt = '2025-08-07T14:00:00.000Z';
      // ipAddress and reviewNotes not set

      // Assert
      expect(suspiciousActivity.ipAddress).toBeUndefined();
      expect(suspiciousActivity.reviewNotes).toBeUndefined();
    });
  });

  describe('LoginPattern', () => {
    it('should have the correct structure', () => {
      // Arrange
      const loginPattern = new LoginPattern();
      loginPattern.id = 'pattern-123';
      loginPattern.userId = 'user-123';
      loginPattern.ipAddress = '192.168.1.1';
      loginPattern.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      loginPattern.loginCount = 15;
      loginPattern.firstSeenAt = '2025-08-01T10:00:00.000Z';
      loginPattern.lastSeenAt = '2025-08-07T14:00:00.000Z';
      loginPattern.isSuspicious = false;
      loginPattern.riskFactors = ['frequent_logins', 'same_ip'];

      // Assert
      expect(loginPattern.id).toBe('pattern-123');
      expect(loginPattern.userId).toBe('user-123');
      expect(loginPattern.ipAddress).toBe('192.168.1.1');
      expect(loginPattern.userAgent).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      );
      expect(loginPattern.loginCount).toBe(15);
      expect(loginPattern.firstSeenAt).toBe('2025-08-01T10:00:00.000Z');
      expect(loginPattern.lastSeenAt).toBe('2025-08-07T14:00:00.000Z');
      expect(loginPattern.isSuspicious).toBe(false);
      expect(loginPattern.riskFactors).toEqual(['frequent_logins', 'same_ip']);
    });

    it('should handle suspicious pattern', () => {
      // Arrange
      const loginPattern = new LoginPattern();
      loginPattern.id = 'pattern-456';
      loginPattern.userId = 'user-456';
      loginPattern.ipAddress = '10.0.0.1';
      loginPattern.userAgent = 'Unknown Browser';
      loginPattern.loginCount = 3;
      loginPattern.firstSeenAt = '2025-08-07T10:00:00.000Z';
      loginPattern.lastSeenAt = '2025-08-07T14:00:00.000Z';
      loginPattern.isSuspicious = true;
      loginPattern.riskFactors = [
        'new_ip',
        'unknown_user_agent',
        'unusual_time',
      ];

      // Assert
      expect(loginPattern.isSuspicious).toBe(true);
      expect(loginPattern.riskFactors).toContain('new_ip');
      expect(loginPattern.riskFactors).toContain('unknown_user_agent');
      expect(loginPattern.riskFactors).toContain('unusual_time');
    });
  });
});
