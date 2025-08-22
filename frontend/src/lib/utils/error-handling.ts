// Error Handling Utilities - Complete implementation for profile management
// Provides centralized error logging, user-friendly error messages, and error tracking

import { AxiosError } from 'axios';

// Error types for different scenarios
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error context for better debugging
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  profileId?: string;
  formData?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

// Error information structure
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  context: ErrorContext;
  originalError?: any;
  stack?: string;
}

// Error logger interface
export interface ErrorLogger {
  log(error: ErrorInfo): void;
  logError(error: any, context?: Partial<ErrorContext>): void;
  logValidationError(field: string, message: string, context?: Partial<ErrorContext>): void;
  logNetworkError(error: AxiosError, context?: Partial<ErrorContext>): void;
  logAuthError(error: any, context?: Partial<ErrorContext>): void;
}

// Default error messages for different scenarios
export const ERROR_MESSAGES = {
  // Profile management errors
  PROFILE_FETCH_FAILED: 'Failed to load profile information',
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  PROFILE_PICTURE_UPLOAD_FAILED: 'Failed to upload profile picture',
  PROFILE_VALIDATION_FAILED: 'Profile validation failed',
  
  // Network errors
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  
  // Authentication errors
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_URL: 'Please enter a valid URL.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.',
  FILE_TOO_LARGE: 'File is too large. Please select a smaller file.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OPERATION_FAILED: 'Operation failed. Please try again.',
} as const;

// Error severity mapping
export const ERROR_SEVERITY_MAP: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.VALIDATION]: ErrorSeverity.LOW,
  [ErrorType.NETWORK]: ErrorSeverity.MEDIUM,
  [ErrorType.AUTHENTICATION]: ErrorSeverity.HIGH,
  [ErrorType.AUTHORIZATION]: ErrorSeverity.HIGH,
  [ErrorType.SERVER]: ErrorSeverity.MEDIUM,
  [ErrorType.CLIENT]: ErrorSeverity.LOW,
  [ErrorType.UNKNOWN]: ErrorSeverity.MEDIUM,
};

// HTTP status code to error type mapping
export const HTTP_STATUS_ERROR_MAP: Record<number, ErrorType> = {
  400: ErrorType.CLIENT,
  401: ErrorType.AUTHENTICATION,
  403: ErrorType.AUTHORIZATION,
  404: ErrorType.CLIENT,
  408: ErrorType.NETWORK,
  409: ErrorType.CLIENT,
  422: ErrorType.VALIDATION,
  429: ErrorType.CLIENT,
  500: ErrorType.SERVER,
  502: ErrorType.NETWORK,
  503: ErrorType.NETWORK,
  504: ErrorType.NETWORK,
};

/**
 * Determine error type from various error sources
 */
export function determineErrorType(error: any): ErrorType {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status && HTTP_STATUS_ERROR_MAP[status]) {
      return HTTP_STATUS_ERROR_MAP[status];
    }
    
    if (!error.response) {
      return ErrorType.NETWORK;
    }
  }
  
  if (error?.type) {
    return error.type;
  }
  
  if (error?.message?.toLowerCase().includes('validation')) {
    return ErrorType.VALIDATION;
  }
  
  if (error?.message?.toLowerCase().includes('network')) {
    return ErrorType.NETWORK;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any, fallback?: string): string {
  // Check if error has a user-friendly message
  if (error?.userMessage) {
    return error.userMessage;
  }
  
  // Check if error has a specific message
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    // Timeout errors
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    
    // Server errors
    if (message.includes('server') || message.includes('500')) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    
    // Authorization errors
    if (message.includes('forbidden') || message.includes('403')) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    
    // Validation errors
    if (message.includes('validation')) {
      return ERROR_MESSAGES.PROFILE_VALIDATION_FAILED;
    }
  }
  
  return fallback || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Create error context
 */
export function createErrorContext(context?: Partial<ErrorContext>): ErrorContext {
  return {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ...context,
  };
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: any, context?: Partial<ErrorContext>): ErrorInfo {
  const errorType = determineErrorType(error);
  const severity = ERROR_SEVERITY_MAP[errorType];
  const userMessage = getUserFriendlyMessage(error);
  const errorContext = createErrorContext(context);
  
  return {
    type: errorType,
    severity,
    message: error?.message || 'Unknown error',
    userMessage,
    code: error?.code || error?.status?.toString(),
    context: errorContext,
    originalError: error,
    stack: error?.stack,
  };
}

/**
 * Console-based error logger (for development)
 */
export class ConsoleErrorLogger implements ErrorLogger {
  log(error: ErrorInfo): void {
    const logMethod = this.getLogMethod(error.severity);
    
    logMethod(
      `[${error.type}] ${error.severity}: ${error.message}`,
      {
        userMessage: error.userMessage,
        context: error.context,
        originalError: error.originalError,
        stack: error.stack,
      }
    );
  }
  
  logError(error: any, context?: Partial<ErrorContext>): void {
    const errorInfo = formatErrorForLogging(error, context);
    this.log(errorInfo);
  }
  
  logValidationError(field: string, message: string, context?: Partial<ErrorContext>): void {
    const errorInfo: ErrorInfo = {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: `Validation error for field '${field}': ${message}`,
      userMessage: message,
      context: createErrorContext({ ...context, action: 'validation' }),
    };
    this.log(errorInfo);
  }
  
  logNetworkError(error: AxiosError, context?: Partial<ErrorContext>): void {
    const errorInfo = formatErrorForLogging(error, { ...context, action: 'network_request' });
    this.log(errorInfo);
  }
  
  logAuthError(error: any, context?: Partial<ErrorContext>): void {
    const errorInfo = formatErrorForLogging(error, { ...context, action: 'authentication' });
    this.log(errorInfo);
  }
  
  private getLogMethod(severity: ErrorSeverity): (...args: any[]) => void {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return console.error;
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
        return console.info;
      default:
        return console.log;
    }
  }
}

/**
 * Remote error logger (for production)
 */
export class RemoteErrorLogger implements ErrorLogger {
  private endpoint: string;
  
  constructor(endpoint: string = '/api/errors') {
    this.endpoint = endpoint;
  }
  
  async log(error: ErrorInfo): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (logError) {
      // Fallback to console if remote logging fails
      console.error('Failed to log error remotely:', logError);
      console.error('Original error:', error);
    }
  }
  
  async logError(error: any, context?: Partial<ErrorContext>): Promise<void> {
    const errorInfo = formatErrorForLogging(error, context);
    await this.log(errorInfo);
  }
  
  async logValidationError(field: string, message: string, context?: Partial<ErrorContext>): Promise<void> {
    const errorInfo: ErrorInfo = {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: `Validation error for field '${field}': ${message}`,
      userMessage: message,
      context: createErrorContext({ ...context, action: 'validation' }),
    };
    await this.log(errorInfo);
  }
  
  async logNetworkError(error: AxiosError, context?: Partial<ErrorContext>): Promise<void> {
    const errorInfo = formatErrorForLogging(error, { ...context, action: 'network_request' });
    await this.log(errorInfo);
  }
  
  async logAuthError(error: any, context?: Partial<ErrorContext>): Promise<void> {
    const errorInfo = formatErrorForLogging(error, { ...context, action: 'authentication' });
    await this.log(errorInfo);
  }
}

/**
 * Error handler with retry logic
 */
export class ErrorHandler {
  private logger: ErrorLogger;
  private maxRetries: number;
  private retryDelay: number;
  
  constructor(logger: ErrorLogger, maxRetries: number = 3, retryDelay: number = 1000) {
    this.logger = logger;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
  
  /**
   * Handle error with optional retry logic
   */
  async handleError<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>,
    retryable: boolean = true
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= (retryable ? this.maxRetries : 1); attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Log the error
        this.logger.logError(error, {
          ...context,
          action: `${context?.action || 'operation'}_attempt_${attempt}`,
        });
        
        // Don't retry on certain error types
        const errorType = determineErrorType(error);
        if (!retryable || errorType === ErrorType.AUTHENTICATION || errorType === ErrorType.AUTHORIZATION) {
          break;
        }
        
        // Wait before retrying
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Handle validation errors
   */
  handleValidationError(field: string, message: string, context?: Partial<ErrorContext>): void {
    this.logger.logValidationError(field, message, context);
  }
  
  /**
   * Handle network errors
   */
  handleNetworkError(error: AxiosError, context?: Partial<ErrorContext>): void {
    this.logger.logNetworkError(error, context);
  }
  
  /**
   * Handle authentication errors
   */
  handleAuthError(error: any, context?: Partial<ErrorContext>): void {
    this.logger.logAuthError(error, context);
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler(
  process.env.NODE_ENV === 'production' 
    ? new RemoteErrorLogger() 
    : new ConsoleErrorLogger()
);

/**
 * Error boundary error handler
 */
export function handleErrorBoundaryError(error: Error, errorInfo: React.ErrorInfo): void {
  const context: ErrorContext = {
    component: errorInfo.componentStack?.split('\n')[1]?.trim(),
    action: 'error_boundary',
    timestamp: new Date().toISOString(),
  };
  
  globalErrorHandler.logger.logError(error, context);
}

/**
 * Profile-specific error handler
 */
export class ProfileErrorHandler {
  private errorHandler: ErrorHandler;
  
  constructor(errorHandler: ErrorHandler = globalErrorHandler) {
    this.errorHandler = errorHandler;
  }
  
  /**
   * Handle profile fetch errors
   */
  async handleProfileFetch<T>(operation: () => Promise<T>, userId?: string): Promise<T> {
    return this.errorHandler.handleError(operation, {
      action: 'profile_fetch',
      userId,
    });
  }
  
  /**
   * Handle profile update errors
   */
  async handleProfileUpdate<T>(operation: () => Promise<T>, userId?: string, profileId?: string): Promise<T> {
    return this.errorHandler.handleError(operation, {
      action: 'profile_update',
      userId,
      profileId,
    });
  }
  
  /**
   * Handle profile picture upload errors
   */
  async handleProfilePictureUpload<T>(operation: () => Promise<T>, userId?: string): Promise<T> {
    return this.errorHandler.handleError(operation, {
      action: 'profile_picture_upload',
      userId,
    });
  }
  
  /**
   * Handle validation errors
   */
  handleValidationError(field: string, message: string, userId?: string): void {
    this.errorHandler.handleValidationError(field, message, {
      action: 'profile_validation',
      userId,
    });
  }
}

/**
 * Global profile error handler instance
 */
export const profileErrorHandler = new ProfileErrorHandler();

/**
 * Utility function to create error with context
 */
export function createError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  context?: Partial<ErrorContext>
): Error {
  const error = new Error(message) as any;
  error.type = type;
  error.context = createErrorContext(context);
  return error;
}

/**
 * Utility function to create validation error
 */
export function createValidationError(
  field: string,
  message: string,
  context?: Partial<ErrorContext>
): Error {
  return createError(
    `Validation error for field '${field}': ${message}`,
    ErrorType.VALIDATION,
    { ...context, action: 'validation' }
  );
}
