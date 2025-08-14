// Session Logic Implementation - Complete implementation
import { useState, useCallback, useEffect } from 'react';
import { useSessionsStore } from '../store/sessions';
import { Session } from '../types/api';
import { useAuthStore } from '../store/auth';

export const useSessions = () => {
  const {
    sessions,
    isLoading,
    error,
    fetchSessions,
    terminateSession,
    terminateAllSessions,
    clearError,
    setError,
  } = useSessionsStore();

  const { sessionToken } = useAuthStore();
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user sessions
  const fetchUserSessions = useCallback(async () => {
    try {
      await fetchSessions();
      setSuccess('Sessions loaded successfully');
    } catch (error: any) {
      handleSessionsError(error);
    }
  }, [fetchSessions]);

  // Handle sessions success
  const handleSessionsSuccess = useCallback((response: any) => {
    setSuccess('Sessions retrieved successfully');
    return response;
  }, []);

  // Handle sessions error
  const handleSessionsError = useCallback((error: any) => {
    const errorMessage = error.message || 'Failed to fetch sessions';
    setError(errorMessage);
    console.error('Sessions error:', error);
  }, [setError]);

  // Terminate specific session
  const terminateSpecificSession = useCallback(async (sessionToken: string) => {
    try {
      await terminateSession(sessionToken);
      setSuccess('Session terminated successfully');
    } catch (error: any) {
      handleTerminationError(error);
    }
  }, [terminateSession]);

  // Terminate all sessions
  const handleTerminateAllSessions = useCallback(async () => {
    try {
      await terminateAllSessions();
      setSuccess('All sessions terminated successfully');
    } catch (error: any) {
      handleTerminationError(error);
    }
  }, [terminateAllSessions]);

  // Handle termination success
  const handleTerminationSuccess = useCallback(() => {
    setSuccess('Session terminated successfully');
  }, []);

  // Handle termination error
  const handleTerminationError = useCallback((error: any) => {
    const errorMessage = error.message || 'Failed to terminate session';
    setError(errorMessage);
    console.error('Termination error:', error);
  }, [setError]);

  // Format session data
  const formatSessionData = useCallback((sessions: Session[]) => {
    return sessions.map(session => ({
      ...session,
      deviceIcon: getDeviceIcon(session.userAgent),
      location: getLocationFromIP(session.ipAddress),
      formattedLastActivity: formatLastActivity(session.lastActivityAt),
      isCurrentSession: isCurrentSession(session),
    }));
  }, []);

  // Get device icon based on user agent
  const getDeviceIcon = useCallback((userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return '📱';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return '📱';
    } else if (ua.includes('windows')) {
      return '🖥️';
    } else if (ua.includes('mac') || ua.includes('darwin')) {
      return '🍎';
    } else if (ua.includes('linux')) {
      return '🐧';
    } else {
      return '💻';
    }
  }, []);

  // Get location from IP (simplified - in real app would use IP geolocation service)
  const getLocationFromIP = useCallback((ipAddress: string): string => {
    // This is a simplified implementation
    // In a real application, you would use an IP geolocation service
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      return 'Local';
    }
    
    // For demo purposes, return a placeholder
    return 'Unknown Location';
  }, []);

  // Format last activity date
  const formatLastActivity = useCallback((date: string): string => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }, []);

  // Check if session is current session
  const isCurrentSession = useCallback((session: Session): boolean => {
    return session.sessionToken === sessionToken;
  }, [sessionToken]);

  // Clear success message
  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  // Auto-fetch sessions on mount
  useEffect(() => {
    fetchUserSessions();
  }, [fetchUserSessions]);

  return {
    // State
    sessions: formatSessionData(sessions),
    isLoading,
    error,
    success,
    
    // Actions
    fetchUserSessions,
    terminateSpecificSession,
    terminateAllSessions,
    
    // Utilities
    clearError,
    clearSuccess,
    getDeviceIcon,
    getLocationFromIP,
    formatLastActivity,
    isCurrentSession,
  };
};
