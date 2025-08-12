// API Types - Complete type definitions for frontend

// Base API Response Type
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    isEmailVerified: boolean;
  };
  session?: {
    sessionToken: string;
    deviceName: string;
    expiresAt: string;
  };
}
