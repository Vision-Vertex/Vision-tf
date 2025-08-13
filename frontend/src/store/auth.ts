// Authentication State - Hour 3.1 (30 min)
// - user: UserProfile | null
// - accessToken: string | null
// - refreshToken: string | null
// - isAuthenticated: boolean
// - isLoading: boolean
// - error: string | null
// - login(email, password, rememberMe)
// - signup(userData)
// - logout()
// - refreshToken()
// - clearError()
// - setUser(user)
// - setTokens(accessToken, refreshToken)
// - persist to localStorage
// - rehydrate from localStorage on app start

// Authentication State - Hour 3.1 (30 min)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, SignupUserData } from '../types/api';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
}

interface AuthActions {
  login: (accessToken: string, refreshToken: string, sessionToken: string, rememberMe?: boolean, user?: UserProfile) => void;
  signup: (user?: SignupUserData) => void;
  logout: () => void;
  refreshTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  setUser: (user: UserProfile) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,

      // Actions
      login: (accessToken: string, refreshToken: string, sessionToken: string, rememberMe?: boolean, user?: UserProfile) => {
        console.log('Login called with:', { accessToken: !!accessToken, refreshToken: !!refreshToken, rememberMe });
        set({
          accessToken,
          refreshToken,
          sessionToken,
          isAuthenticated: true,
          error: null,
          rememberMe: rememberMe || false, // Store rememberMe
        });
      },

      signup: (user?: SignupUserData) => {
        set({
          user: null,
          isAuthenticated: false, 
          error: null,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionToken: null,
          isAuthenticated: false,
          error: null,
          rememberMe: false, // Reset rememberMe on logout
        });
      },

      refreshTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: UserProfile) => {
        set({ user });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      setAccessToken: (accessToken: string) => {
        set({ accessToken });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    }
  )
);

