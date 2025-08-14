// Admin API Service
import apiClient from './client';
import { handleApiResponse, handleApiError } from '@/lib/utils/api';
import {
  ChangeUserRoleRequest,
  DeactivateUserRequest,
  UserProfile,
  AuditLog,
  SuspiciousActivity,
  ApiResponse,
  PaginatedResponse,
} from '../../types/api';

export const adminApi = {
  // User Management
  async getUsers(page = 1, limit = 10, search?: string, role?: string): Promise<PaginatedResponse<UserProfile>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
      });
      
      const response = await apiClient.get<ApiResponse<PaginatedResponse<UserProfile>>>(`/admin/users?${params}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async changeUserRole(data: ChangeUserRoleRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>('/admin/users/role', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async deactivateUser(data: DeactivateUserRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>('/admin/users/deactivate', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async activateUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(`/admin/users/${userId}/activate`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/admin/users/${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Audit Logs
  async getAuditLogs(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<AuditLog>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      
      const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(`/admin/audit?${params}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async exportAuditLogs(filters?: any): Promise<Blob> {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiClient.get(`/admin/audit/export?${params}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Security Management
  async getSuspiciousActivities(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<SuspiciousActivity>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      
      const response = await apiClient.get<ApiResponse<PaginatedResponse<SuspiciousActivity>>>(`/admin/security/suspicious?${params}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async updateSuspiciousActivity(id: string, data: any): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(`/admin/security/suspicious/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async getSecurityStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/security/stats');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // System Analytics
  async getAnalytics(timeRange: string = '7d'): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/admin/analytics?range=${timeRange}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async getUserActivityStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/user-activity');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async getLoginPatterns(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/login-patterns');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // System Settings
  async getSystemSettings(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/settings');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  async updateSystemSettings(data: any): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>('/admin/settings', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Health Check
  async getSystemHealth(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/health');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};

export default adminApi;
