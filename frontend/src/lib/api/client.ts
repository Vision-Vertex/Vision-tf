import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getItem, setItem, removeItem } from '@/lib/utils/storage';

export const API_BASE_URL = process.env.API_BASE_URL;

// Debug logging configuration
const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Debug logging utility
const debugLog = (type: 'request' | 'response' | 'error', data: any) => {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    type,
    ...data
  };
  
  console.group(`🔍 API ${type.toUpperCase()} - ${timestamp}`);
  console.log(logData);
  console.groupEnd();
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility function to get tokens from Zustand store
const getTokensFromStore = () => {
  try {
    // Get the persisted state from localStorage
    const authStorage = getItem('auth-storage');
    if (authStorage) {
      return {
        accessToken: authStorage.state?.accessToken || null,
        refreshToken: authStorage.state?.refreshToken || null,
      };
    }
    return { accessToken: null, refreshToken: null };
  } catch (error) {
    console.error('Error reading tokens from store:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// Utility function to update tokens in store
const updateTokensInStore = (accessToken: string, refreshToken?: string) => {
  try {
    const authStorage = getItem('auth-storage');
    if (authStorage) {
      authStorage.state.accessToken = accessToken;
      if (refreshToken) {
        authStorage.state.refreshToken = refreshToken;
      }
      setItem('auth-storage', authStorage);
    }
  } catch (error) {
    console.error('Error updating tokens in store:', error);
  }
};

// Token refresh function
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const { refreshToken } = getTokensFromStore();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    debugLog('request', {
      url: `${API_BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken }
    });

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken
    });

    debugLog('response', {
      url: `${API_BASE_URL}/auth/refresh`,
      status: response.status,
      data: response.data
    });

    if (response.data.success && response.data.data.accessToken) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      updateTokensInStore(accessToken, newRefreshToken);
      
      return accessToken;
    }
    
    throw new Error('Invalid refresh response');
  } catch (error) {
    debugLog('error', {
      url: `${API_BASE_URL}/auth/refresh`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Clear tokens on refresh failure
    removeItem('auth-storage');
    
    throw error;
  }
};

// Setup request interceptor with logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = getTokensFromStore();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Request logging
    debugLog('request', {
      url: config.url,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
      params: config.params
    });

    return config;
  },
  (error: AxiosError) => {
    debugLog('error', {
      type: 'request_error',
      error: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Setup retry logic (3 attempts)
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount: number) => retryCount * 1000,
  retryCondition: (error: AxiosError) => {
    return (
      error.response?.status === 500 ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504 ||
      !error.response
    );
  },
};

// Setup response interceptor with token refresh and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Response logging
    debugLog('response', {
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Error logging
    debugLog('error', {
      url: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle 401 responses with automatic token refresh
    if (error.response?.status === 401 && originalRequest) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear all tokens and redirect to login
      removeItem('auth-storage');
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
        console.error('Token refresh failed. Please login again.');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 responses (show forbidden message)
    if (error.response?.status === 403) {
      console.error('Access denied. You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle 500 responses (show server error)
    if (error.response?.status === 500) {
      console.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Retry logic for network errors and server errors
    if (retryConfig.retryCondition(error) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < retryConfig.retries) {
        originalRequest._retryCount = retryCount + 1;
        
        debugLog('request', {
          url: originalRequest.url,
          method: originalRequest.method?.toUpperCase(),
          retry: retryCount + 1,
          maxRetries: retryConfig.retries
        });
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(apiClient(originalRequest));
          }, retryConfig.retryDelay(retryCount + 1));
        });
      }
    }

    // Handle other errors
    const errorMessage = (error.response?.data as any)?.message || error.message || 'An error occurred';
    console.error(errorMessage);
    
    return Promise.reject(error);
  }
);



// Re-export handleApiResponse from utils
export { handleApiResponse } from '@/lib/utils/api';

// Utility function to manually refresh token (for testing or manual use)
export const manualTokenRefresh = async (): Promise<boolean> => {
  try {
    await refreshAccessToken();
    return true;
  } catch (error) {
    return false;
  }
};

// Utility function to clear all tokens
export const clearTokens = (): void => {
  removeItem('auth-storage');
};

export default apiClient;

