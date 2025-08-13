// Store Mocks - Mock Zustand stores
// - Mock auth store
// - Mock profile store
// - Mock sessions store
// - Mock admin store
// - Mock initial states

import { vi } from 'vitest';
import { UserProfile, Profile, Session, AuditLog, SuspiciousActivity } from '@/types/api';

// Mock Zustand
vi.mock('zustand', () => ({
  create: vi.fn((fn) => {
    const store = fn();
    return {
      ...store,
      getState: vi.fn(() => store),
      setState: vi.fn((partial) => Object.assign(store, partial)),
      subscribe: vi.fn(),
    };
  }),
}));

// Auth Store Mock
export const mockAuthStoreState = {
  // Initial state
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },

  // Authenticated state
  authenticatedState: {
    user: {
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
    } as UserProfile,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  },

  // Loading state
  loadingState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },

  // Error state
  errorState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: 'Authentication failed',
  },

  // Actions
  actions: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshTokens: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
  },
};

// Profile Store Mock
export const mockProfileStoreState = {
  // Initial state
  initialState: {
    profile: null,
    isLoading: false,
    error: null,
  },

  // Loaded state
  loadedState: {
    profile: {
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
    } as Profile,
    isLoading: false,
    error: null,
  },

  // Loading state
  loadingState: {
    profile: null,
    isLoading: true,
    error: null,
  },

  // Error state
  errorState: {
    profile: null,
    isLoading: false,
    error: 'Failed to load profile',
  },

  // Actions
  actions: {
    fetchProfile: vi.fn(),
    updateProfile: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
  },
};

// Sessions Store Mock
export const mockSessionsStoreState = {
  // Initial state
  initialState: {
    sessions: [],
    isLoading: false,
    error: null,
  },

  // Loaded state
  loadedState: {
    sessions: [
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
    ] as Session[],
    isLoading: false,
    error: null,
  },

  // Loading state
  loadingState: {
    sessions: [],
    isLoading: true,
    error: null,
  },

  // Error state
  errorState: {
    sessions: [],
    isLoading: false,
    error: 'Failed to load sessions',
  },

  // Actions
  actions: {
    fetchSessions: vi.fn(),
    terminateSession: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
  },
};

// Admin Store Mock
export const mockAdminStoreState = {
  // Initial state
  initialState: {
    users: [],
    auditLogs: [],
    suspiciousActivities: [],
    isLoading: false,
    error: null,
  },

  // Loaded state
  loadedState: {
    users: [
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
    ] as UserProfile[],
    auditLogs: [
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
    ] as AuditLog[],
    suspiciousActivities: [
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
    ] as SuspiciousActivity[],
    isLoading: false,
    error: null,
  },

  // Loading state
  loadingState: {
    users: [],
    auditLogs: [],
    suspiciousActivities: [],
    isLoading: true,
    error: null,
  },

  // Error state
  errorState: {
    users: [],
    auditLogs: [],
    suspiciousActivities: [],
    isLoading: false,
    error: 'Failed to load admin data',
  },

  // Actions
  actions: {
    fetchUsers: vi.fn(),
    fetchAuditLogs: vi.fn(),
    fetchSuspiciousActivities: vi.fn(),
    changeUserRole: vi.fn(),
    deactivateUser: vi.fn(),
    updateSuspiciousActivity: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
  },
};

// Store factory functions
export const createMockAuthStore = (state = mockAuthStoreState.initialState) => ({
  ...state,
  ...mockAuthStoreState.actions,
  getState: vi.fn(() => state),
  setState: vi.fn((partial) => Object.assign(state, partial)),
  subscribe: vi.fn(),
});

export const createMockProfileStore = (state = mockProfileStoreState.initialState) => ({
  ...state,
  ...mockProfileStoreState.actions,
  getState: vi.fn(() => state),
  setState: vi.fn((partial) => Object.assign(state, partial)),
  subscribe: vi.fn(),
});

export const createMockSessionsStore = (state = mockSessionsStoreState.initialState) => ({
  ...state,
  ...mockSessionsStoreState.actions,
  getState: vi.fn(() => state),
  setState: vi.fn((partial) => Object.assign(state, partial)),
  subscribe: vi.fn(),
});

export const createMockAdminStore = (state = mockAdminStoreState.initialState) => ({
  ...state,
  ...mockAdminStoreState.actions,
  getState: vi.fn(() => state),
  setState: vi.fn((partial) => Object.assign(state, partial)),
  subscribe: vi.fn(),
});

// Mock store hooks
export const mockUseAuthStore = vi.fn(() => createMockAuthStore());
export const mockUseProfileStore = vi.fn(() => createMockProfileStore());
export const mockUseSessionsStore = vi.fn(() => createMockSessionsStore());
export const mockUseAdminStore = vi.fn(() => createMockAdminStore());

// Setup mock stores
export const setupMockStores = () => {
  // Reset all mocks
  Object.values(mockAuthStoreState.actions).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
  Object.values(mockProfileStoreState.actions).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
  Object.values(mockSessionsStoreState.actions).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });
  Object.values(mockAdminStoreState.actions).forEach(fn => {
    if (typeof fn === 'function') fn.mockClear();
  });

  // Set default return values
  mockUseAuthStore.mockReturnValue(createMockAuthStore());
  mockUseProfileStore.mockReturnValue(createMockProfileStore());
  mockUseSessionsStore.mockReturnValue(createMockSessionsStore());
  mockUseAdminStore.mockReturnValue(createMockAdminStore());
};

// Reset mock stores
export const resetMockStores = () => {
  mockUseAuthStore.mockClear();
  mockUseProfileStore.mockClear();
  mockUseSessionsStore.mockClear();
  mockUseAdminStore.mockClear();
  setupMockStores();
};

// Mock store modules
vi.mock('@/store/auth', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('@/store/profile', () => ({
  useProfileStore: mockUseProfileStore,
}));

vi.mock('@/store/sessions', () => ({
  useSessionsStore: mockUseSessionsStore,
}));

vi.mock('@/store/admin', () => ({
  useAdminStore: mockUseAdminStore,
}));
