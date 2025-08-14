import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoleAccess, UserRole } from '../useRoleAccess';
import { useAuthStore } from '@/store/auth';

// Mock the auth store
vi.mock('@/store/auth');

const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

describe('useRoleAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('userRole', () => {
    it('should return CLIENT as default when user is null', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('CLIENT');
    });

    it('should return CLIENT when user role is CLIENT', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'CLIENT' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('CLIENT');
    });

    it('should return DEVELOPER when user role is DEVELOPER', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'DEVELOPER' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('DEVELOPER');
    });

    it('should return ADMIN when user role is ADMIN', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('ADMIN');
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the required single role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.hasRole('ADMIN')).toBe(true);
    });

    it('should return false when user does not have the required single role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'CLIENT' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.hasRole('ADMIN')).toBe(false);
    });

    it('should return true when user has one of the required roles in array', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'DEVELOPER' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.hasRole(['DEVELOPER', 'ADMIN'])).toBe(true);
    });

    it('should return false when user does not have any of the required roles in array', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'CLIENT' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.hasRole(['DEVELOPER', 'ADMIN'])).toBe(false);
    });

    it('should handle empty array of roles', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.hasRole([])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false for non-ADMIN roles', () => {
      const nonAdminRoles: UserRole[] = ['CLIENT', 'DEVELOPER'];
      
      nonAdminRoles.forEach(role => {
        mockUseAuthStore.mockReturnValue({
          user: { role },
        } as any);

        const { result } = renderHook(() => useRoleAccess());
        expect(result.current.isAdmin()).toBe(false);
      });
    });
  });

  describe('isDeveloper', () => {
    it('should return true for DEVELOPER role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'DEVELOPER' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isDeveloper()).toBe(true);
    });

    it('should return true for ADMIN role (higher privilege)', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isDeveloper()).toBe(true);
    });

    it('should return false for CLIENT role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'CLIENT' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isDeveloper()).toBe(false);
    });
  });

  describe('isClient', () => {
    it('should return true for CLIENT role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'CLIENT' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isClient()).toBe(true);
    });

    it('should return true for DEVELOPER role (higher privilege)', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'DEVELOPER' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isClient()).toBe(true);
    });

    it('should return true for ADMIN role (higher privilege)', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isClient()).toBe(true);
    });
  });

  describe('Admin-specific permissions', () => {
    const adminPermissions = [
      'canAccessAdminPanel',
      'canManageUsers', 
      'canViewAuditLogs',
      'canManageSecurity',
      'canViewAnalytics',
      'canManageSystemSettings'
    ] as const;

    adminPermissions.forEach(permission => {
      describe(permission, () => {
        it(`should return true for ADMIN role`, () => {
          mockUseAuthStore.mockReturnValue({
            user: { role: 'ADMIN' },
          } as any);

          const { result } = renderHook(() => useRoleAccess());
          expect(result.current[permission]()).toBe(true);
        });

        it(`should return false for non-ADMIN roles`, () => {
          const nonAdminRoles: UserRole[] = ['CLIENT', 'DEVELOPER'];
          
          nonAdminRoles.forEach(role => {
            mockUseAuthStore.mockReturnValue({
              user: { role },
            } as any);

            const { result } = renderHook(() => useRoleAccess());
            expect(result.current[permission]()).toBe(false);
          });
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined user role gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: undefined },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('CLIENT');
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isDeveloper()).toBe(false);
      expect(result.current.isClient()).toBe(true);
    });

    it('should handle empty string role gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: '' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('CLIENT');
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isDeveloper()).toBe(false);
      expect(result.current.isClient()).toBe(true);
    });

    it('should handle invalid role strings gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'INVALID_ROLE' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.userRole).toBe('INVALID_ROLE');
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isDeveloper()).toBe(false);
      expect(result.current.isClient()).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly handle role hierarchy for CLIENT', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'CLIENT' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      
      expect(result.current.isClient()).toBe(true);
      expect(result.current.isDeveloper()).toBe(false);
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.canAccessAdminPanel()).toBe(false);
    });

    it('should correctly handle role hierarchy for DEVELOPER', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'DEVELOPER' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      
      expect(result.current.isClient()).toBe(true);
      expect(result.current.isDeveloper()).toBe(true);
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.canAccessAdminPanel()).toBe(false);
    });

    it('should correctly handle role hierarchy for ADMIN', () => {
      mockUseAuthStore.mockReturnValue({
        user: { role: 'ADMIN' },
      } as any);

      const { result } = renderHook(() => useRoleAccess());
      
      expect(result.current.isClient()).toBe(true);
      expect(result.current.isDeveloper()).toBe(true);
      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.canAccessAdminPanel()).toBe(true);
      expect(result.current.canManageUsers()).toBe(true);
      expect(result.current.canViewAuditLogs()).toBe(true);
      expect(result.current.canManageSecurity()).toBe(true);
      expect(result.current.canViewAnalytics()).toBe(true);
      expect(result.current.canManageSystemSettings()).toBe(true);
    });
  });
});
