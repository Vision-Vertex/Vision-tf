// Session State - Complete implementation
import { create } from 'zustand';
import { Session } from '../types/api';

interface SessionsState {
  // State
  sessions: Session[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  terminateSession: (sessionToken: string) => Promise<void>;
  terminateAllSessions: () => Promise<void>;
  clearSessions: () => void;
  setSessions: (sessions: Session[]) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  // Initial state
  sessions: [],
  isLoading: false,
  error: null,

  // Actions
  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { sessionsApi } = await import('../lib/api/sessions');
      const response = await sessionsApi.getUserSessions();
      set({ sessions: response.sessions, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch sessions', 
        isLoading: false 
      });
    }
  },

  terminateSession: async (sessionToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const { sessionsApi } = await import('../lib/api/sessions');
      await sessionsApi.terminateSession({ sessionToken });
      
      // Remove the terminated session from state
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.filter(
        session => session.sessionToken !== sessionToken
      );
      set({ sessions: updatedSessions, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to terminate session', 
        isLoading: false 
      });
    }
  },

  terminateAllSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { sessionsApi } = await import('../lib/api/sessions');
      await sessionsApi.terminateAllSessions();
      set({ sessions: [], isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to terminate all sessions', 
        isLoading: false 
      });
    }
  },

  clearSessions: () => {
    set({ sessions: [] });
  },

  setSessions: (sessions: Session[]) => {
    set({ sessions });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
