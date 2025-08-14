/**
 * API Client for Admin Dashboard
 * 
 * This file will contain:
 * 
 * Line 1-10: Import statements and configuration
 * - Import axios and related types
 * - Import storage utilities for token management
 * - Import auth store for authentication state
 * - Import API utilities for error handling
 * - Import environment variables and constants
 * 
 * Line 11-20: Environment and configuration setup
 * - Define API_BASE_URL from environment variables
 * - Set up debug mode configuration
 * - Configure timeout and retry settings
 * - Set up default headers and content type
 * - Configure API version and endpoints
 * 
 * Line 21-30: Token refresh state management
 * - isRefreshing flag to prevent multiple refresh attempts
 * - failedQueue array to queue failed requests during refresh
 * - processQueue function to process queued requests
 * - refreshTimeout configuration
 * - Token refresh error handling
 * 
 * Line 31-40: Debug logging utilities
 * - debugLog function for API request/response logging
 * - Log formatting and grouping
 * - Development vs production logging
 * - Performance monitoring integration
 * - Error tracking and reporting
 * 
 * Line 41-50: Axios instance creation
 * - Create axios instance with base configuration
 * - Set base URL and timeout
 * - Configure default headers
 * - Set up request/response interceptors
 * - Configure retry and error handling
 * 
 * Line 51-60: Token management utilities
 * - getTokensFromStore function to get tokens from Zustand store
 * - updateTokensInStore function to update tokens in store
 * - validateToken function to validate token format
 * - clearTokens function to clear all tokens
 * - refreshTokenIfNeeded function to check token expiration
 * 
 * Line 61-70: Token refresh implementation
 * - refreshAccessToken function to refresh access token
 * - Handle refresh token validation
 * - Update tokens in store after successful refresh
 * - Handle refresh token expiration
 * - Clear tokens and redirect to login on failure
 * 
 * Line 71-80: Request interceptor setup
 * - Add authentication headers to requests
 * - Log request details for debugging
 * - Validate request data before sending
 * - Add request metadata and tracking
 * - Handle request cancellation
 * 
 * Line 81-90: Response interceptor setup
 * - Log response details for debugging
 * - Handle successful responses
 * - Process response data and metadata
 * - Add response caching logic
 * - Handle response validation
 * 
 * Line 91-100: Error handling in response interceptor
 * - Handle 401 unauthorized responses with token refresh
 * - Handle 403 forbidden responses
 * - Handle 500 server error responses
 * - Handle network connectivity errors
 * - Handle timeout and retry logic
 * 
 * Line 101-110: Token refresh logic in error handling
 * - Check if request is for auth endpoints (skip refresh)
 * - Queue failed requests during token refresh
 * - Retry original request with new token
 * - Handle refresh token failure
 * - Redirect to login on authentication failure
 * 
 * Line 111-120: Retry configuration and logic
 * - Configure retry attempts and delays
 * - Define retry conditions (5xx errors, network errors)
 * - Implement exponential backoff
 * - Track retry attempts and limits
 * - Handle retry exhaustion
 * 
 * Line 121-130: Request/response logging
 * - Log request URL, method, headers, and data
 * - Log response status, headers, and data
 * - Log error details and stack traces
 * - Group related log entries
 * - Filter sensitive data from logs
 * 
 * Line 131-140: Performance monitoring
 * - Track request/response times
 * - Monitor API call frequency
 * - Track error rates and types
 * - Monitor token refresh frequency
 * - Report performance metrics
 * 
 * Line 141-150: Security features
 * - Validate request origins
 * - Sanitize request data
 * - Validate response data
 * - Handle CSRF protection
 * - Monitor for suspicious activity
 * 
 * Line 151-160: Caching and optimization
 * - Cache successful responses
 * - Invalidate cache on errors
 * - Implement cache expiration
 * - Handle cache conflicts
 * - Optimize cache storage
 * 
 * Line 161-170: WebSocket and real-time support
 * - Handle WebSocket connections
 * - Process real-time updates
 * - Handle WebSocket reconnection
 * - Validate WebSocket messages
 * - Handle WebSocket errors
 * 
 * Line 171-180: Utility functions
 * - manualTokenRefresh function for manual token refresh
 * - clearTokens function to clear all tokens
 * - getApiStatus function to check API health
 * - validateApiResponse function to validate responses
 * - formatApiError function to format errors
 * 
 * Line 181-190: Export statements
 * - Export apiClient as default
 * - Export utility functions
 * - Export configuration constants
 * - Export type definitions
 * - Export error handling utilities
 * 
 * Line 191-200: Type definitions and interfaces
 * - Define API client configuration interface
 * - Define token management interface
 * - Define error handling interface
 * - Define retry configuration interface
 * - Define logging configuration interface
 */
