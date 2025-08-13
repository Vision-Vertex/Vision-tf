// API Mocks - Mock API responses
// - Mock authentication responses
// - Mock profile responses
// - Mock session responses
// - Mock admin responses
// - Mock error responses

import { vi } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  SignupResponse, 
  UserProfile, 
  Session, 
  Profile,
  TwoFactorSetupResponse,
  AuditLog,
  SuspiciousActivity,
  ApiResponse 
} from '@/types/api';

// Mock axios
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

// Mock API client
export const mockApiClient = {
  ...mockAxios,
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

// Mock successful responses
export const createMockAxiosResponse = <T>(
  data: T,
  status = 200,
  statusText = 'OK'
): AxiosResponse<T> => ({
  data,
  status,
  statusText,
  headers: {},
  config: {} as any,
  request: {},
});

// Mock error responses
export const createMockAxiosError = (
  message: string,
  status = 400,
  statusText = 'Bad Request'
): AxiosError => {
  const error = new AxiosError(message);
  error.response = {
    data: { message, statusCode: status },
    status,
    statusText,
    headers: {},
    config: {} as any,
    request: {},
  };
  return error;
};

// Authentication mocks
export const mockAuthResponses = {
  // Login success
  loginSuccess: (): AuthResponse => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      role: 'CLIENT',
      isEmailVerified: true,
    },
    session: {
      sessionToken: 'mock-session-token',
      deviceName: 'Test Device',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  }),

  // Login with 2FA required
  login2faRequired: (): AuthResponse => ({
    accessToken: 'temp-access-token',
    refreshToken: 'temp-refresh-token',
    expiresIn: 300,
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      role: 'CLIENT',
      isEmailVerified: true,
    },
  }),

  // Signup success
  signupSuccess: (): SignupResponse => ({
    success: true,
    statusCode: 201,
    message: 'User registered successfully',
    data: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      isEmailVerified: false,
      profile: {
        displayName: 'Test User',
        role: 'CLIENT',
      },
    },
    timestamp: new Date().toISOString(),
    path: '/auth/signup',
  }),

  // 2FA setup
  twoFactorSetup: (): TwoFactorSetupResponse => ({
    secret: 'mock-secret-key',
    qrCodeUrl: 'data:image/png;base64,mock-qr-code',
    qrCode: 'mock-qr-code-string',
    backupCodes: ['123456', '234567', '345678', '456789', '567890'],
    instructions: 'Scan the QR code with your authenticator app',
  }),

  // Token refresh
  tokenRefresh: () => ({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  }),
};

// Profile mocks
export const mockProfileResponses = {
  // Get profile success
  getProfileSuccess: (): UserProfile => ({
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstname: 'Test',
    lastname: 'User',
    role: 'CLIENT',
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true,
  }),

  // Update profile success
  updateProfileSuccess: (): Profile => ({
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Updated Test User',
    bio: 'Updated bio',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    skills: ['JavaScript', 'React', 'TypeScript'],
    experience: '5 years',
    availability: 'Full-time',
    portfolioLinks: ['https://example.com'],
    companyName: 'Test Company',
    companyWebsite: 'https://testcompany.com',
    billingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }),
};

// Session mocks
export const mockSessionResponses = {
  // Get sessions success
  getSessionsSuccess: (): Session[] => [
    {
      sessionToken: 'session-1',
      deviceName: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-01-02T00:00:00Z',
      lastActivityAt: '2024-01-01T12:00:00Z',
      isCurrentSession: true,
    },
    {
      sessionToken: 'session-2',
      deviceName: 'Safari on iPhone',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      createdAt: '2024-01-01T06:00:00Z',
      expiresAt: '2024-01-02T06:00:00Z',
      lastActivityAt: '2024-01-01T11:00:00Z',
      isCurrentSession: false,
    },
  ],

  // Terminate session success
  terminateSessionSuccess: () => ({
    message: 'Session terminated successfully',
  }),
};

// Admin mocks
export const mockAdminResponses = {
  // Get users success
  getUsersSuccess: (): UserProfile[] => [
    {
      id: 'user-1',
      email: 'admin@example.com',
      username: 'admin',
      firstname: 'Admin',
      lastname: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
      isTwoFactorEnabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isActive: true,
    },
    {
      id: 'user-2',
      email: 'developer@example.com',
      username: 'developer',
      firstname: 'Developer',
      lastname: 'User',
      role: 'DEVELOPER',
      isEmailVerified: true,
      isTwoFactorEnabled: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isActive: true,
    },
  ],

  // Get audit logs success
  getAuditLogsSuccess: (): AuditLog[] => [
    {
      id: 'audit-1',
      userId: 'user-1',
      eventType: 'LOGIN',
      eventCategory: 'AUTHENTICATION',
      description: 'User logged in successfully',
      details: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      severity: 'LOW',
      source: 'WEB',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'audit-2',
      userId: 'user-1',
      eventType: 'PROFILE_UPDATE',
      eventCategory: 'USER_MANAGEMENT',
      description: 'User updated profile information',
      details: { fields: ['displayName', 'bio'] },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      severity: 'LOW',
      source: 'WEB',
      createdAt: '2024-01-01T01:00:00Z',
    },
  ],

  // Get suspicious activities success
  getSuspiciousActivitiesSuccess: (): SuspiciousActivity[] => [
    {
      id: 'suspicious-1',
      userId: 'user-1',
      activityType: 'LOGIN_ATTEMPT',
      severity: 'MEDIUM',
      description: 'Multiple failed login attempts detected',
      details: { attempts: 5, timeWindow: '5 minutes' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      location: 'Unknown',
      deviceFingerprint: 'fingerprint-1',
      riskScore: 75,
      confidence: 85,
      status: 'PENDING',
      riskFactors: ['multiple_failures', 'unusual_location'],
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
};

// Error mocks
export const mockErrorResponses = {
  // Network error
  networkError: () => createMockAxiosError('Network Error', 0),

  // Authentication errors
  unauthorized: () => createMockAxiosError('Unauthorized', 401),
  forbidden: () => createMockAxiosError('Forbidden', 403),

  // Validation errors
  validationError: () => createMockAxiosError('Validation failed', 422),

  // Server errors
  serverError: () => createMockAxiosError('Internal server error', 500),
  serviceUnavailable: () => createMockAxiosError('Service unavailable', 503),

  // Custom error messages
  customError: (message: string, status = 400) => createMockAxiosError(message, status),
};

// Mock API responses with ApiResponse wrapper
export const mockApiResponses = {
  // Authentication
  login: (data: AuthResponse) => mockApiResponse(data),
  signup: (data: SignupResponse) => data, // Already wrapped
  verify2fa: (data: AuthResponse) => mockApiResponse(data),
  refreshToken: (data: { accessToken: string; refreshToken: string }) => mockApiResponse(data),

  // Profile
  getProfile: (data: UserProfile) => mockApiResponse(data),
  updateProfile: (data: Profile) => mockApiResponse(data),

  // Sessions
  getSessions: (data: Session[]) => mockApiResponse(data),
  terminateSession: (data: { message: string }) => mockApiResponse(data),

  // Admin
  getUsers: (data: UserProfile[]) => mockApiResponse(data),
  getAuditLogs: (data: AuditLog[]) => mockApiResponse(data),
  getSuspiciousActivities: (data: SuspiciousActivity[]) => mockApiResponse(data),
};

// Helper function to create mock API response
function mockApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    statusCode: 200,
    message: 'Success',
    data,
    timestamp: new Date().toISOString(),
    path: '/test',
  };
}

// Setup mock API client
export const setupMockApiClient = () => {
  // Reset all mocks
  Object.values(mockAxios).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });

  // Set default successful responses
  mockAxios.post.mockResolvedValue(createMockAxiosResponse(mockAuthResponses.loginSuccess()));
  mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProfileResponses.getProfileSuccess()));
};

// Mock API client module
vi.mock('@/lib/api/client', () => ({
  default: mockApiClient,
  API_BASE_URL: 'http://localhost:3000/v1',
  handleApiResponse: vi.fn((response) => response.data.data),
  manualTokenRefresh: vi.fn(),
  clearTokens: vi.fn(),
}));

// Mock auth API
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    signup: vi.fn(),
    login: vi.fn(),
    verifyEmail: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    setup2fa: vi.fn(),
    enable2fa: vi.fn(),
    disable2fa: vi.fn(),
    verify2fa: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
    deactivateAccount: vi.fn(),
  },
}));

// Mock profile API
vi.mock('@/lib/api/profile', () => ({
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock sessions API
vi.mock('@/lib/api/sessions', () => ({
  sessionsApi: {
    getSessions: vi.fn(),
    terminateSession: vi.fn(),
  },
}));

// Mock admin API
vi.mock('@/lib/api/admin', () => ({
  adminApi: {
    getUsers: vi.fn(),
    getAuditLogs: vi.fn(),
    getSuspiciousActivities: vi.fn(),
    changeUserRole: vi.fn(),
    deactivateUser: vi.fn(),
    updateSuspiciousActivity: vi.fn(),
  },
}));
