// useSessions Hook Tests - Complete implementation
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessions } from '../useSessions';
import { useSessionsStore } from '../../store/sessions';
import { useAuthStore } from '../../store/auth';

// Mock the stores
vi.mock('../../store/sessions');
vi.mock('../../store/auth');

// Use Vitest's type helpers instead of Jest's
const mockUseSessionsStore = useSessionsStore as unknown as ReturnType<typeof vi.fn>;
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

describe('useSessions Hook', () => {
  const mockStoreActions = {
    sessions: [],
    isLoading: false,
    error: null,
    fetchSessions: vi.fn(),
    terminateSession: vi.fn(),
    terminateAllSessions: vi.fn(),
    clearError: vi.fn(),
    setError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionsStore.mockReturnValue(mockStoreActions);
    mockUseAuthStore.mockReturnValue({ sessionToken: 'session-1' } as any);
  });

  it('should return correct initial state', () => {
    const { result } = renderHook(() => useSessions());
    expect(result.current.sessions).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch sessions on mount', async () => {
    renderHook(() => useSessions());
    await waitFor(() => {
      expect(mockStoreActions.fetchSessions).toHaveBeenCalled();
    });
  });

  it('should handle device icons correctly', () => {
    const { result } = renderHook(() => useSessions());
    
    expect(result.current.getDeviceIcon('iPhone')).toBe('📱');
    expect(result.current.getDeviceIcon('Windows')).toBe('🖥️');
    expect(result.current.getDeviceIcon('Mac')).toBe('🍎');
  });

  it('should format last activity correctly', () => {
    const { result } = renderHook(() => useSessions());
    
    const now = new Date();
    const activity = now.toISOString();
    expect(result.current.formatLastActivity(activity)).toBe('Just now');
  });
});
