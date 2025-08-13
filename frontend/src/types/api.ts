// API Types - Complete type definitions for frontend

// Base API Response Type
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

// Error Response Type
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionToken?: string;
}
// API Types - Updated to match backend structure

// 2.1 API Request Types - Updated to match backend DTOs
export interface SignupRequest {
  firstname: string;
  middlename?: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Enable2faRequest {
  code: string;
}

export interface Disable2faRequest {
  code: string;
}

export interface Verify2faRequest {
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
  sessionToken?: string;
}

export interface DeactivateAccountRequest {
  password: string;
}

export interface TerminateSessionRequest {
  sessionToken: string;
}

export interface ChangeUserRoleRequest {
  userId: string;
  newRole: 'CLIENT' | 'DEVELOPER' | 'ADMIN';
}

export interface DeactivateUserRequest {
  userId: string;
}

export interface AuditQueryRequest {
  eventType?: string;
  eventCategory?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  limit?: number;
  offset?: number;
}

export interface SuspiciousActivityQueryRequest {
  activityType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  limit?: number;
  offset?: number;
}

export interface UpdateSuspiciousActivityRequest {
  status: 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  reviewNotes?: string;
}

export interface SignupResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: SignupUserData;
  timestamp: string;
  path: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  role: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SignupUserData {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  profile: {
    displayName: string;
    role: string;
  };
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  skills?: string[];
  experience?: string;
  availability?: string;
  portfolioLinks?: string[];
  companyName?: string;
  companyWebsite?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  sessionToken: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  isCurrentSession: boolean;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  qrCode: string;
  backupCodes: string[];
  instructions: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  eventType: string;
  eventCategory: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  createdAt: string;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  activityType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location: string;
  deviceFingerprint: string;
  riskScore: number;
  confidence: number;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  reviewedBy?: string;
  reviewedAt?: string;
  riskFactors: string[];
  createdAt: string;
}

export interface LoginPattern {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  loginTime: string;
  success: boolean;
  failureReason?: string;
}

// Additional utility types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

