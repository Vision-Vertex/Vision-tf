-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'ON_HOLD', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('WEB_APP', 'MOBILE_APP', 'API', 'DESIGN', 'DATABASE', 'DEVOPS', 'AI_ML', 'BLOCKCHAIN', 'GAME_DEVELOPMENT', 'ECOMMERCE', 'CMS', 'INTEGRATION', 'MIGRATION', 'MAINTENANCE', 'CONSULTING', 'RESEARCH', 'TESTING', 'DOCUMENTATION', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."WorkLocation" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "public"."JobVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY', 'INTERNAL');

-- CreateEnum
CREATE TYPE "public"."JobEventType" AS ENUM ('JOB_CREATED', 'JOB_UPDATED', 'JOB_DELETED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'DEADLINE_UPDATED', 'BUDGET_UPDATED', 'REQUIREMENTS_UPDATED', 'JOB_PUBLISHED', 'JOB_APPROVED', 'JOB_ON_HOLD', 'JOB_CANCELLED', 'JOB_COMPLETED', 'JOB_EXPIRED', 'JOB_ARCHIVED', 'JOB_VIEWED', 'JOB_SHARED', 'JOB_BOOKMARKED');

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "jobId" TEXT;

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'DRAFT',
    "requiredSkills" JSONB,
    "estimatedHours" INTEGER,
    "priority" "public"."JobPriority" NOT NULL DEFAULT 'MEDIUM',
    "projectType" "public"."ProjectType",
    "location" "public"."WorkLocation" NOT NULL DEFAULT 'REMOTE',
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "public"."JobVisibility" NOT NULL DEFAULT 'PUBLIC',
    "requirements" TEXT,
    "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "constraints" TEXT,
    "riskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "onHoldAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastModifiedBy" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "previousStatus" "public"."JobStatus",

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "eventType" "public"."JobEventType" NOT NULL,
    "eventData" JSONB,
    "userId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobStatusHistory" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fromStatus" "public"."JobStatus",
    "toStatus" "public"."JobStatus" NOT NULL,
    "changedBy" TEXT,
    "changeReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "JobStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_clientId_idx" ON "public"."Job"("clientId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "public"."Job"("status");

-- CreateIndex
CREATE INDEX "Job_priority_idx" ON "public"."Job"("priority");

-- CreateIndex
CREATE INDEX "Job_projectType_idx" ON "public"."Job"("projectType");

-- CreateIndex
CREATE INDEX "Job_location_idx" ON "public"."Job"("location");

-- CreateIndex
CREATE INDEX "Job_visibility_idx" ON "public"."Job"("visibility");

-- CreateIndex
CREATE INDEX "Job_deadline_idx" ON "public"."Job"("deadline");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "public"."Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_publishedAt_idx" ON "public"."Job"("publishedAt");

-- CreateIndex
CREATE INDEX "Job_status_visibility_idx" ON "public"."Job"("status", "visibility");

-- CreateIndex
CREATE INDEX "Job_clientId_status_idx" ON "public"."Job"("clientId", "status");

-- CreateIndex
CREATE INDEX "JobEvent_jobId_idx" ON "public"."JobEvent"("jobId");

-- CreateIndex
CREATE INDEX "JobEvent_eventType_idx" ON "public"."JobEvent"("eventType");

-- CreateIndex
CREATE INDEX "JobEvent_timestamp_idx" ON "public"."JobEvent"("timestamp");

-- CreateIndex
CREATE INDEX "JobEvent_userId_idx" ON "public"."JobEvent"("userId");

-- CreateIndex
CREATE INDEX "JobStatusHistory_jobId_idx" ON "public"."JobStatusHistory"("jobId");

-- CreateIndex
CREATE INDEX "JobStatusHistory_toStatus_idx" ON "public"."JobStatusHistory"("toStatus");

-- CreateIndex
CREATE INDEX "JobStatusHistory_timestamp_idx" ON "public"."JobStatusHistory"("timestamp");

-- CreateIndex
CREATE INDEX "JobStatusHistory_changedBy_idx" ON "public"."JobStatusHistory"("changedBy");

-- CreateIndex
CREATE INDEX "AuditLog_jobId_idx" ON "public"."AuditLog"("jobId");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobEvent" ADD CONSTRAINT "JobEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobStatusHistory" ADD CONSTRAINT "JobStatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobStatusHistory" ADD CONSTRAINT "JobStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
