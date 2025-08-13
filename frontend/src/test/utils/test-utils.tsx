// Test Utilities - Component rendering helpers
// - Create test renderer with providers
// - Setup mock stores
// - Setup mock API client
// - Setup mock router
// - Setup mock authentication

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuthStore } from '@/store/auth';

// Mock store hooks
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Mock store states
export const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  refreshTokens: vi.fn(),
  clearError: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

export const mockProfileStore = {
  profile: null,
  isLoading: false,
  error: null,
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  clearError: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

export const mockSessionsStore = {
  sessions: [],
  isLoading: false,
  error: null,
  fetchSessions: vi.fn(),
  terminateSession: vi.fn(),
  clearError: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

export const mockAdminStore = {
  users: [],
  auditLogs: [],
  suspiciousActivities: [],
  isLoading: false,
  error: null,
  fetchUsers: vi.fn(),
  fetchAuditLogs: vi.fn(),
  fetchSuspiciousActivities: vi.fn(),
  changeUserRole: vi.fn(),
  deactivateUser: vi.fn(),
  updateSuspiciousActivity: vi.fn(),
  clearError: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

// Setup mock stores
export const setupMockStores = () => {
  (useAuthStore as any).mockReturnValue(mockAuthStore);
 // (useProfileStore as any).mockReturnValue(mockProfileStore);
 // (useSessionsStore as any).mockReturnValue(mockSessionsStore);
 // (useAdminStore as any).mockReturnValue(mockAdminStore);
};

// Reset mock stores
export const resetMockStores = () => {
  Object.values(mockAuthStore).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
  Object.values(mockProfileStore).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
  Object.values(mockSessionsStore).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
  Object.values(mockAdminStore).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
};

// Test data generators
export const createMockUser = (overrides = {}) => ({
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
  ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
  id: 'profile-1',
  userId: 'user-1',
  displayName: 'Test User',
  bio: 'Test bio',
  profilePictureUrl: 'https://example.com/avatar.jpg',
  skills: ['JavaScript', 'React'],
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
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  sessionToken: 'session-1',
  deviceName: 'Test Device',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  createdAt: '2024-01-01T00:00:00Z',
  expiresAt: '2024-01-02T00:00:00Z',
  lastActivityAt: '2024-01-01T12:00:00Z',
  isCurrentSession: true,
  ...overrides,
});

// Utility functions
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiResponse = <T,>(data: T, success = true) => ({
  success,
  statusCode: success ? 200 : 400,
  message: success ? 'Success' : 'Error',
  data,
  timestamp: new Date().toISOString(),
  path: '/test',
});

export const mockApiError = (message: string, statusCode = 400) => ({
  success: false,
  statusCode,
  message,
  error: message,
  timestamp: new Date().toISOString(),
  path: '/test',
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
