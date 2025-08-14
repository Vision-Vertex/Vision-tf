// Sessions API Service - Complete implementation
import apiClient from './client';
import { handleApiResponse, handleApiError } from '@/lib/utils/api';
import {
  Session,
  TerminateSessionRequest,
  ApiResponse,
} from '../../types/api';

export const sessionsApi = {
  // Get user sessions
  async getUserSessions(): Promise<{ sessions: Session[] }> {
    try {
      const response = await apiClient.get<ApiResponse<{ sessions: Session[] }>>('/auth/sessions');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Terminate specific session
  async terminateSession(data: TerminateSessionRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/sessions/terminate', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Terminate all sessions
  async terminateAllSessions(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/sessions/terminate', {});
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};

export default sessionsApi;
