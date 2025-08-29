import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

// Review workflow types
export interface ReviewWorkflowStep {
  step: number;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface ReviewDecision {
  decision: 'approve' | 'reject' | 'shortlist' | 'request-more-info' | 'schedule-interview';
  reason: string;
  notes?: string;
  nextSteps?: string[];
  deadline?: Date;
  priority: ApplicationPriority;
}

export interface ReviewCriteria {
  technicalSkills: {
    weight: number;
    minScore: number;
    requiredSkills: string[];
  };
  experience: {
    weight: number;
    minScore: number;
    minYears: number;
    preferredIndustries: string[];
  };
  culturalFit: {
    weight: number;
    minScore: number;
    assessmentQuestions: string[];
  };
  communication: {
    weight: number;
    minScore: number;
    languageRequirements: string[];
  };
  rateCompetitiveness: {
    weight: number;
    maxRate: number;
    preferredRange: { min: number; max: number };
  };
  availability: {
    weight: number;
    minScore: number;
    requiredHours: number;
    preferredTimezones: string[];
  };
}

export interface ReviewTemplate {
  id: string;
  name: string;
  description: string;
  criteria: ReviewCriteria;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewAssignment {
  id: string;
  applicationId: string;
  reviewerId: string;
  assignedAt: Date;
  dueDate: Date;
  priority: ApplicationPriority;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  notes?: string;
}

export interface ReviewBatch {
  id: string;
  name: string;
  description: string;
  applications: string[];
  assignedTo: string[];
  criteria: ReviewCriteria;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  dueDate: Date;
  completedAt?: Date;
}

// Performance tracking types
export interface ReviewPerformanceMetrics {
  reviewerId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  applicationsReviewed: number;
  averageReviewTime: number;
  averageScore: number;
  accuracyRate: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  applicationsByPriority: Record<ApplicationPriority, number>;
}

export interface ReviewTrends {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  data: Array<{
    date: string;
    submitted: number;
    reviewed: number;
    approved: number;
    rejected: number;
    shortlisted: number;
    averageReviewTime: number;
  }>;
}

// Notification types
export interface ReviewNotification {
  type: 'application-assigned' | 'review-completed' | 'review-overdue' | 'batch-completed';
  recipientId: string;
  applicationId?: string;
  batchId?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

// Audit and compliance types
export interface ReviewAuditLog {
  id: string;
  action: string;
  entityType: 'application' | 'review' | 'batch' | 'template';
  entityId: string;
  userId: string;
  userRole: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export interface ReviewComplianceReport {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalApplications: number;
  applicationsReviewed: number;
  averageReviewTime: number;
  complianceScore: number;
  violations: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
  }>;
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}
