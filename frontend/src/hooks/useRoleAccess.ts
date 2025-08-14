import { useAuthStore } from '@/store/auth';

export type UserRole = 'CLIENT' | 'DEVELOPER' | 'ADMIN';

export const useRoleAccess = () => {
  const { user } = useAuthStore();
  
  const userRole = user?.role as UserRole || 'CLIENT';
  
  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userRole);
  };
  
  const isAdmin = (): boolean => hasRole('ADMIN');
  const isDeveloper = (): boolean => hasRole(['DEVELOPER', 'ADMIN']);
  const isClient = (): boolean => hasRole(['CLIENT', 'DEVELOPER', 'ADMIN']);
  
  const canAccessAdminPanel = (): boolean => isAdmin();
  const canManageUsers = (): boolean => isAdmin();
  const canViewAuditLogs = (): boolean => isAdmin();
  const canManageSecurity = (): boolean => isAdmin();
  const canViewAnalytics = (): boolean => isAdmin();
  const canManageSystemSettings = (): boolean => isAdmin();
  
  return {
    userRole,
    hasRole,
    isAdmin,
    isDeveloper,
    isClient,
    canAccessAdminPanel,
    canManageUsers,
    canViewAuditLogs,
    canManageSecurity,
    canViewAnalytics,
    canManageSystemSettings,
  };
};
