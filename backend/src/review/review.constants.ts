import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

// Review workflow constants
export const REVIEW_WORKFLOW_STEPS = {
  INITIAL_SCREENING: 1,
  TECHNICAL_ASSESSMENT: 2,
  CULTURAL_FIT_EVALUATION: 3,
  FINAL_DECISION: 4
} as const;

export const REVIEW_DECISIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
  SHORTLIST: 'shortlist',
  REQUEST_MORE_INFO: 'request-more-info',
  SCHEDULE_INTERVIEW: 'schedule-interview'
} as const;

// Review criteria weights (default)
export const DEFAULT_REVIEW_CRITERIA_WEIGHTS = {
  TECHNICAL_SKILLS: 0.3,
  EXPERIENCE: 0.25,
  CULTURAL_FIT: 0.2,
  COMMUNICATION: 0.15,
  RATE_COMPETITIVENESS: 0.1,
  AVAILABILITY: 0.1
} as const;

// Score thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 9,
  GOOD: 7,
  AVERAGE: 5,
  BELOW_AVERAGE: 3,
  POOR: 1
} as const;

// Review time limits (in hours)
export const REVIEW_TIME_LIMITS = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72
} as const;

// Application expiration settings
export const APPLICATION_EXPIRATION = {
  DEFAULT_DAYS: 30,
  URGENT_DAYS: 7,
  HIGH_DAYS: 14,
  MEDIUM_DAYS: 21
} as const;

// Batch processing limits
export const BATCH_PROCESSING_LIMITS = {
  MAX_APPLICATIONS_PER_BATCH: 100,
  MAX_CONCURRENT_BATCHES: 5,
  BATCH_TIMEOUT_MINUTES: 30
} as const;

// Review queue priorities
export const QUEUE_PRIORITIES = {
  [ApplicationPriority.URGENT]: 1,
  [ApplicationPriority.HIGH]: 2,
  [ApplicationPriority.MEDIUM]: 3,
  [ApplicationPriority.LOW]: 4
} as const;

// Status transition rules
export const STATUS_TRANSITIONS = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN
  ],
  [ApplicationStatus.UNDER_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.UNDER_REVIEW
  ],
  [ApplicationStatus.APPROVED]: [
    ApplicationStatus.REJECTED
  ],
  [ApplicationStatus.REJECTED]: [
    ApplicationStatus.UNDER_REVIEW
  ],
  [ApplicationStatus.WITHDRAWN]: [],
  [ApplicationStatus.EXPIRED]: []
} as const;

// Review performance targets
export const PERFORMANCE_TARGETS = {
  AVERAGE_REVIEW_TIME_HOURS: 24,
  MIN_ACCURACY_RATE: 85,
  MAX_APPLICATIONS_PER_DAY: 50,
  MIN_REVIEW_SCORE: 6
} as const;

// Notification settings
export const NOTIFICATION_SETTINGS = {
  REVIEW_ASSIGNMENT: true,
  REVIEW_COMPLETION: true,
  REVIEW_OVERDUE: true,
  BATCH_COMPLETION: true,
  PERFORMANCE_ALERTS: true
} as const;

// Audit log retention
export const AUDIT_LOG_RETENTION = {
  REVIEW_ACTIONS: '2 years',
  STATUS_CHANGES: '5 years',
  BATCH_OPERATIONS: '3 years',
  PERFORMANCE_METRICS: '1 year'
} as const;

// API rate limiting
export const API_RATE_LIMITS = {
  REVIEW_ENDPOINTS: { limit: 30, ttl: 60000 }, // 30 requests per minute
  COMPARISON_ENDPOINTS: { limit: 20, ttl: 60000 }, // 20 requests per minute
  METRICS_ENDPOINTS: { limit: 60, ttl: 60000 }, // 60 requests per minute
  BATCH_ENDPOINTS: { limit: 10, ttl: 60000 } // 10 requests per minute
} as const;

// Cache settings
export const CACHE_SETTINGS = {
  REVIEW_METRICS_TTL: 300, // 5 minutes
  COMPARISON_RESULTS_TTL: 600, // 10 minutes
  QUEUE_DATA_TTL: 120, // 2 minutes
  PERFORMANCE_DATA_TTL: 1800 // 30 minutes
} as const;

// Error messages
export const ERROR_MESSAGES = {
  APPLICATION_NOT_FOUND: 'Application not found',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
  REVIEW_CRITERIA_REQUIRED: 'Review criteria are required for this operation',
  BATCH_SIZE_EXCEEDED: 'Batch size exceeds maximum allowed limit',
  REVIEWER_NOT_FOUND: 'Reviewer not found',
  JOB_NOT_FOUND: 'Job not found',
  INVALID_REVIEW_DATA: 'Invalid review data provided'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  APPLICATION_REVIEWED: 'Application reviewed successfully',
  BATCH_REVIEW_COMPLETED: 'Batch review completed successfully',
  COMPARISON_COMPLETED: 'Application comparison completed successfully',
  RANKING_COMPLETED: 'Applications ranked successfully',
  METRICS_RETRIEVED: 'Review metrics retrieved successfully'
} as const;
