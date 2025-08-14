/**
 * Admin API Functions
 * 
 * This file will contain:
 * 
 * Line 1-10: Import statements for API utilities
 * - Import axios instance from api client
 * - Import API response types and interfaces
 * - Import utility functions for API calls
 * - Import error handling utilities
 * - Import authentication utilities
 * 
 * Line 11-20: Import types and interfaces
 * - Import User interface and related types
 * - Import AdminInvitation interface
 * - Import API response interfaces
 * - Import error types
 * - Import pagination types
 * 
 * Line 21-30: API base configuration
 * - Set up API base URL from environment variables
 * - Configure default headers for admin requests
 * - Set up request interceptors for authentication
 * - Set up response interceptors for error handling
 * - Configure timeout settings
 * 
 * Line 31-40: getAllUsers function
 * - Function to fetch all users in the system
 * - Endpoint: GET /v1/auth/admin/users
 * - Handle pagination parameters (limit, offset)
 * - Handle filtering parameters (role, status, search)
 * - Return user list with pagination metadata
 * 
 * Line 41-50: changeUserRole function
 * - Function to change user role
 * - Endpoint: POST /v1/auth/admin/change-role
 * - Accept userId and newRole parameters
 * - Handle role validation (ADMIN, DEVELOPER, CLIENT)
 * - Return success response with audit trail
 * 
 * Line 51-60: deactivateUserByAdmin function
 * - Function to deactivate user account
 * - Endpoint: POST /v1/auth/admin/deactivate-user/:userId
 * - Accept userId parameter
 * - Handle confirmation and validation
 * - Return success response with audit trail
 * 
 * Line 61-70: inviteAdmin function
 * - Function to send admin invitation
 * - Endpoint: POST /v1/auth/admin/invite
 * - Accept email and optional message parameters
 * - Handle email validation and duplicate checks
 * - Return invitation details with status
 * 
 * Line 71-80: getInvitations function
 * - Function to get admin invitations
 * - Endpoint: GET /v1/auth/admin/invitations
 * - Return invitations created by current admin
 * - Handle invitation status filtering
 * - Return invitation list with metadata
 * 
 * Line 81-90: resendInvitation function
 * - Function to resend admin invitation
 * - Endpoint: POST /v1/auth/admin/invite/:invitationId/resend
 * - Accept invitationId parameter
 * - Handle invitation validation and status checks
 * - Return updated invitation details
 * 
 * Line 91-100: deleteInvitation function
 * - Function to delete admin invitation
 * - Endpoint: DELETE /v1/auth/admin/invite/:invitationId
 * - Accept invitationId parameter
 * - Handle invitation validation and status checks
 * - Return success response
 * 
 * Line 101-110: getSuspiciousActivities function
 * - Function to get suspicious activities
 * - Endpoint: GET /v1/auth/security/suspicious-activities
 * - Handle filtering parameters (status, severity, date range)
 * - Handle pagination parameters
 * - Return suspicious activities list
 * 
 * Line 111-120: updateSuspiciousActivityStatus function
 * - Function to update suspicious activity status
 * - Endpoint: PUT /v1/auth/security/suspicious-activities/:activityId
 * - Accept activityId and status parameters
 * - Handle status validation (REVIEWED, FALSE_POSITIVE, CONFIRMED)
 * - Return updated activity details
 * 
 * Line 121-130: getUserLoginPatterns function
 * - Function to get user login patterns
 * - Endpoint: GET /v1/auth/security/login-patterns/:userId
 * - Accept userId parameter
 * - Return login pattern analysis
 * - Handle pattern detection and anomalies
 * 
 * Line 131-140: detectPasswordSprayAttack function
 * - Function to detect password spray attacks
 * - Endpoint: POST /v1/auth/security/detect-password-spray
 * - Trigger password spray detection analysis
 * - Return detection results and alerts
 * - Handle attack pattern identification
 * 
 * Line 141-150: getAuditLogs function
 * - Function to get audit logs
 * - Endpoint: GET /v1/auth/audit/logs
 * - Handle filtering parameters (eventType, category, severity, userId)
 * - Handle date range filtering
 * - Handle pagination parameters
 * 
 * Line 151-160: getRecentAuditLogs function
 * - Function to get recent audit logs
 * - Endpoint: GET /v1/auth/audit/logs/recent
 * - Accept optional limit parameter
 * - Return recent audit events
 * - Handle real-time updates
 * 
 * Line 161-170: getUserAuditLogs function
 * - Function to get user-specific audit logs
 * - Endpoint: GET /v1/auth/audit/logs/user/:userId
 * - Accept userId parameter
 * - Handle pagination parameters
 * - Return user audit history
 * 
 * Line 171-180: Error handling utilities
 * - Handle API error responses
 * - Parse error messages and codes
 * - Handle network connectivity issues
 * - Handle authentication errors
 * - Handle authorization errors
 * 
 * Line 181-190: Request/response interceptors
 * - Add authentication token to requests
 * - Handle token refresh logic
 * - Parse API responses
 * - Handle common error scenarios
 * - Log API requests for debugging
 * 
 * Line 191-200: Utility functions
 * - Function to build query parameters
 * - Function to validate API responses
 * - Function to handle pagination metadata
 * - Function to format API errors
 * - Function to retry failed requests
 * 
 * Line 201-210: Type definitions and exports
 * - Export all API functions
 * - Export type definitions
 * - Export error handling utilities
 * - Export API configuration
 * - Export utility functions
 */
