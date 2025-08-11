import { ApiProperty } from '@nestjs/swagger';

// Base response structure
export class BaseApiResponse<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Human-readable message' })
  message: string;

  @ApiProperty({ description: 'Response data payload' })
  data?: T;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  @ApiProperty({ description: 'Request path' })
  path: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    path?: string,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path || '';
  }
}

// Success response
export class SuccessResponse<T = any> extends BaseApiResponse<T> {
  constructor(message: string, data?: T, path?: string) {
    super(true, 200, message, data, path);
  }
}

// Created response
export class CreatedResponse<T = any> extends BaseApiResponse<T> {
  constructor(message: string, data?: T, path?: string) {
    super(true, 201, message, data, path);
  }
}

// Error response
export class ErrorResponse extends BaseApiResponse {
  @ApiProperty({ description: 'Error code for client handling' })
  errorCode?: string;

  @ApiProperty({ description: 'Detailed error information' })
  details?: any;

  constructor(
    statusCode: number,
    message: string,
    errorCode?: string,
    details?: any,
    path?: string,
  ) {
    super(false, statusCode, message, undefined, path);
    this.errorCode = errorCode;
    this.details = details;
  }
}

// Paginated response
export class PaginatedResponse<T = any> extends BaseApiResponse<T[]> {
  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    message: string,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    path?: string,
  ) {
    super(true, 200, message, data, path);
    this.pagination = pagination;
  }
}

// Authentication specific responses
export class AuthResponse {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token for token renewal' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'Token type' })
  tokenType: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    isEmailVerified: boolean;
  };

  @ApiProperty({ description: 'Session information' })
  session?: {
    sessionToken: string;
    deviceName: string;
    expiresAt: string;
  };
}

export class TwoFactorSetupResponse {
  @ApiProperty({ description: '2FA secret key' })
  secret: string;

  @ApiProperty({ description: 'QR code URL for authenticator apps' })
  qrCodeUrl: string;

  @ApiProperty({ description: 'Base64 encoded QR code image' })
  qrCode: string;

  @ApiProperty({ description: 'Backup codes for emergency access' })
  backupCodes: string[];

  @ApiProperty({ description: 'Setup instructions' })
  instructions: string;
}

export class SessionInfo {
  @ApiProperty({ description: 'Session token' })
  sessionToken: string;

  @ApiProperty({ description: 'Device name' })
  deviceName: string;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;

  @ApiProperty({ description: 'User agent' })
  userAgent: string;

  @ApiProperty({ description: 'Session creation time' })
  createdAt: string;

  @ApiProperty({ description: 'Session expiration time' })
  expiresAt: string;

  @ApiProperty({ description: 'Last activity time' })
  lastActivityAt: string;

  @ApiProperty({ description: 'Whether this is the current session' })
  isCurrentSession: boolean;
}

export class UserProfile {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'First name' })
  firstname: string;

  @ApiProperty({ description: 'Middle name' })
  middlename?: string;

  @ApiProperty({ description: 'Last name' })
  lastname: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'Email verification status' })
  isEmailVerified: boolean;

  @ApiProperty({ description: '2FA enabled status' })
  isTwoFactorEnabled: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiProperty({ description: 'Account status' })
  isActive: boolean;
}

export class AuditLogEntry {
  @ApiProperty({ description: 'Audit log ID' })
  id: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  userId?: string;

  @ApiProperty({ description: 'Event type' })
  eventType: string;

  @ApiProperty({ description: 'Event category' })
  eventCategory: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiProperty({ description: 'Event details' })
  details: any;

  @ApiProperty({ description: 'IP address' })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  userAgent?: string;

  @ApiProperty({ description: 'Severity level' })
  severity: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;
}

export class SuspiciousActivity {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type' })
  activityType: string;

  @ApiProperty({ description: 'Severity level' })
  severity: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity details' })
  details: any;

  @ApiProperty({ description: 'IP address' })
  ipAddress?: string;

  @ApiProperty({ description: 'Risk score' })
  riskScore: number;

  @ApiProperty({ description: 'Confidence level' })
  confidence: number;

  @ApiProperty({ description: 'Activity status' })
  status: string;

  @ApiProperty({ description: 'Detection timestamp' })
  detectedAt: string;

  @ApiProperty({ description: 'Review notes' })
  reviewNotes?: string;
}

export class LoginPattern {
  @ApiProperty({ description: 'Pattern ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;

  @ApiProperty({ description: 'User agent' })
  userAgent: string;

  @ApiProperty({ description: 'Login count' })
  loginCount: number;

  @ApiProperty({ description: 'First seen timestamp' })
  firstSeenAt: string;

  @ApiProperty({ description: 'Last seen timestamp' })
  lastSeenAt: string;

  @ApiProperty({ description: 'Whether pattern is suspicious' })
  isSuspicious: boolean;

  @ApiProperty({ description: 'Risk factors' })
  riskFactors: string[];
}
