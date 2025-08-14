/**
 * API Types and Interfaces
 * 
 * This file will contain:
 * 
 * Line 1-10: Import statements for type utilities
 * - Import utility types from TypeScript
 * - Import Zod schemas for runtime validation
 * - Import common type definitions
 * - Import API response types
 * - Import error type definitions
 * 
 * Line 11-20: Base API response types
 * - Define ApiResponse interface for standard API responses
 * - Define SuccessResponse interface for successful responses
 * - Define ErrorResponse interface for error responses
 * - Define PaginatedResponse interface for paginated data
 * - Define ApiError interface for API errors
 * 
 * Line 21-30: User-related types
 * - Define User interface with all user properties
 * - Define UserRole enum (ADMIN, DEVELOPER, CLIENT)
 * - Define UserStatus enum (ACTIVE, INACTIVE, SUSPENDED)
 * - Define UserProfile interface for user profile data
 * - Define UserSession interface for session data
 * 
 * Line 31-40: Admin invitation types
 * - Define AdminInvitation interface for invitation data
 * - Define InvitationStatus enum (PENDING, USED, EXPIRED)
 * - Define InviteAdminRequest interface for invitation requests
 * - Define InvitationResponse interface for invitation responses
 * - Define InvitationList interface for invitation lists
 * 
 * Line 41-50: Security and suspicious activity types
 * - Define SuspiciousActivity interface for security activities
 * - Define ActivityStatus enum (PENDING, REVIEWED, FALSE_POSITIVE, CONFIRMED)
 * - Define ActivitySeverity enum (LOW, MEDIUM, HIGH, CRITICAL)
 * - Define SecurityAlert interface for security alerts
 * - Define ThreatLevel enum for threat assessment
 * 
 * Line 51-60: Audit log types
 * - Define AuditLog interface for audit log entries
 * - Define AuditEventType enum for different event types
 * - Define AuditEventCategory enum for event categories
 * - Define AuditSeverity enum for audit severity levels
 * - Define AuditQuery interface for audit queries
 * 
 * Line 61-70: Login pattern types
 * - Define LoginPattern interface for login pattern analysis
 * - Define LoginAnomaly interface for login anomalies
 * - Define DeviceInfo interface for device information
 * - Define LocationInfo interface for location data
 * - Define LoginContext interface for login context
 * 
 * Line 71-80: Pagination and filtering types
 * - Define PaginationParams interface for pagination parameters
 * - Define PaginationMeta interface for pagination metadata
 * - Define FilterParams interface for filtering parameters
 * - Define SortParams interface for sorting parameters
 * - Define SearchParams interface for search parameters
 * 
 * Line 81-90: API request types
 * - Define ChangeUserRoleRequest interface for role change requests
 * - Define DeactivateUserRequest interface for deactivation requests
 * - Define UpdateActivityStatusRequest interface for status updates
 * - Define ExportDataRequest interface for export requests
 * - Define GenerateReportRequest interface for report requests
 * 
 * Line 91-100: API response types
 * - Define GetAllUsersResponse interface for user list responses
 * - Define GetInvitationsResponse interface for invitation responses
 * - Define GetSuspiciousActivitiesResponse interface for security responses
 * - Define GetAuditLogsResponse interface for audit responses
 * - Define GetLoginPatternsResponse interface for pattern responses
 * 
 * Line 101-110: Statistics and metrics types
 * - Define UserStats interface for user statistics
 * - Define SecurityStats interface for security metrics
 * - Define AuditStats interface for audit metrics
 * - Define DashboardStats interface for dashboard data
 * - Define SystemHealth interface for system health data
 * 
 * Line 111-120: Form and validation types
 * - Define UserFormData interface for user form data
 * - Define InvitationFormData interface for invitation form data
 * - Define SecurityFormData interface for security form data
 * - Define AuditFormData interface for audit form data
 * - Define ValidationError interface for validation errors
 * 
 * Line 121-130: Modal and UI types
 * - Define ModalState interface for modal state management
 * - Define TableState interface for table state management
 * - Define FilterState interface for filter state management
 * - Define SortState interface for sort state management
 * - Define LoadingState interface for loading states
 * 
 * Line 131-140: Real-time and WebSocket types
 * - Define RealtimeEvent interface for real-time events
 * - Define WebSocketMessage interface for WebSocket messages
 * - Define NotificationData interface for notifications
 * - Define UpdateEvent interface for update events
 * - Define SubscriptionData interface for subscriptions
 * 
 * Line 141-150: Export and report types
 * - Define ExportFormat enum (CSV, JSON, PDF, EXCEL)
 * - Define ExportData interface for export data
 * - Define ReportType enum for different report types
 * - Define ReportData interface for report data
 * - Define ExportProgress interface for export progress
 * 
 * Line 151-160: Error and exception types
 * - Define ApiErrorCode enum for API error codes
 * - Define ValidationError interface for validation errors
 * - Define NetworkError interface for network errors
 * - Define AuthError interface for authentication errors
 * - Define PermissionError interface for permission errors
 * 
 * Line 161-170: Configuration and settings types
 * - Define AdminConfig interface for admin configuration
 * - Define SecurityConfig interface for security settings
 * - Define AuditConfig interface for audit settings
 * - Define NotificationConfig interface for notification settings
 * - Define SystemConfig interface for system settings
 * 
 * Line 171-180: Utility and helper types
 * - Define Optional utility type for optional properties
 * - Define Required utility type for required properties
 * - Define Partial utility type for partial objects
 * - Define Pick utility type for picking properties
 * - Define Omit utility type for omitting properties
 * 
 * Line 181-190: Zod schema definitions
 * - Define userSchema for user validation
 * - Define invitationSchema for invitation validation
 * - Define activitySchema for activity validation
 * - Define auditSchema for audit validation
 * - Define requestSchema for request validation
 * 
 * Line 191-200: Type guards and assertions
 * - Define isUser function to check if object is User
 * - Define isInvitation function to check if object is Invitation
 * - Define isActivity function to check if object is Activity
 * - Define isAuditLog function to check if object is AuditLog
 * - Define isApiResponse function to check if object is ApiResponse
 * 
 * Line 201-210: Export statements
 * - Export all type definitions
 * - Export all interfaces
 * - Export all enums
 * - Export all utility types
 * - Export all Zod schemas
 */
