import { useState, useCallback } from 'react';
import { adminApi } from '@/lib/api/admin';
import { UserProfile, AuditLog, SuspiciousActivity } from '@/types/api';
import { useRoleAccess } from './useRoleAccess';

export const useAdmin = () => {
  const { isAdmin } = useRoleAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async (page = 1, limit = 10, search?: string, role?: string) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApi.getUsers(page, limit, search, role);
      setUsers(response.data);
      setUsersPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const changeUserRole = useCallback(async (userId: string, newRole: string) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await adminApi.changeUserRole({ userId, newRole: newRole as any });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ));
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to change user role');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const deactivateUser = useCallback(async (userId: string) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await adminApi.deactivateUser({ userId });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: false } : user
      ));
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate user');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const activateUser = useCallback(async (userId: string) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await adminApi.activateUser(userId);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: true } : user
      ));
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to activate user');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await adminApi.deleteUser(userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchAuditLogs = useCallback(async (page = 1, limit = 10, filters?: any) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApi.getAuditLogs(page, limit, filters);
      setAuditLogs(response.data);
      setAuditPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const exportAuditLogs = useCallback(async (filters?: any) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const blob = await adminApi.exportAuditLogs(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to export audit logs');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Security Management
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [securityStats, setSecurityStats] = useState<any>(null);

  const fetchSuspiciousActivities = useCallback(async (page = 1, limit = 10, filters?: any) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApi.getSuspiciousActivities(page, limit, filters);
      setSuspiciousActivities(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suspicious activities');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const updateSuspiciousActivity = useCallback(async (id: string, data: any) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await adminApi.updateSuspiciousActivity(id, data);
      
      // Update local state
      setSuspiciousActivities(prev => prev.map(activity => 
        activity.id === id ? { ...activity, ...data } : activity
      ));
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to update suspicious activity');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const fetchSecurityStats = useCallback(async () => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stats = await adminApi.getSecurityStats();
      setSecurityStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch security stats');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = useCallback(async (timeRange: string = '7d') => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await adminApi.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // System Settings
  const [systemSettings, setSystemSettings] = useState<any>(null);

  const fetchSystemSettings = useCallback(async () => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const settings = await adminApi.getSystemSettings();
      setSystemSettings(settings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system settings');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const updateSystemSettings = useCallback(async (data: any) => {
    if (!isAdmin()) {
      setError('Access denied: Admin privileges required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await adminApi.updateSystemSettings(data);
      setSystemSettings((prev: any) => ({ ...prev, ...data }));
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to update system settings');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    users,
    usersPagination,
    auditLogs,
    auditPagination,
    suspiciousActivities,
    securityStats,
    analytics,
    systemSettings,

    // User Management
    fetchUsers,
    changeUserRole,
    deactivateUser,
    activateUser,
    deleteUser,

    // Audit Logs
    fetchAuditLogs,
    exportAuditLogs,

    // Security
    fetchSuspiciousActivities,
    updateSuspiciousActivity,
    fetchSecurityStats,

    // Analytics
    fetchAnalytics,

    // System Settings
    fetchSystemSettings,
    updateSystemSettings,

    // Utilities
    clearError,
  };
};
