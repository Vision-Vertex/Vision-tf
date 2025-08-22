/*
  Warnings:

  - The `priority` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `location` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `attachments` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `visibility` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."WorkLocation" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "public"."JobVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY', 'INTERNAL');

-- CreateEnum
CREATE TYPE "public"."JobEventType" AS ENUM ('JOB_CREATED', 'JOB_UPDATED', 'JOB_DELETED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'DEADLINE_UPDATED', 'BUDGET_UPDATED', 'REQUIREMENTS_UPDATED', 'JOB_PUBLISHED', 'JOB_APPROVED', 'JOB_ON_HOLD', 'JOB_CANCELLED', 'JOB_COMPLETED', 'JOB_EXPIRED', 'JOB_ARCHIVED', 'JOB_VIEWED', 'JOB_SHARED', 'JOB_BOOKMARKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ProjectType" ADD VALUE 'DATABASE';
ALTER TYPE "public"."ProjectType" ADD VALUE 'DEVOPS';
ALTER TYPE "public"."ProjectType" ADD VALUE 'AI_ML';
ALTER TYPE "public"."ProjectType" ADD VALUE 'BLOCKCHAIN';
ALTER TYPE "public"."ProjectType" ADD VALUE 'GAME_DEVELOPMENT';
ALTER TYPE "public"."ProjectType" ADD VALUE 'ECOMMERCE';
ALTER TYPE "public"."ProjectType" ADD VALUE 'CMS';
ALTER TYPE "public"."ProjectType" ADD VALUE 'INTEGRATION';
ALTER TYPE "public"."ProjectType" ADD VALUE 'MIGRATION';
ALTER TYPE "public"."ProjectType" ADD VALUE 'MAINTENANCE';
ALTER TYPE "public"."ProjectType" ADD VALUE 'CONSULTING';
ALTER TYPE "public"."ProjectType" ADD VALUE 'RESEARCH';
ALTER TYPE "public"."ProjectType" ADD VALUE 'TESTING';
ALTER TYPE "public"."ProjectType" ADD VALUE 'DOCUMENTATION';
ALTER TYPE "public"."ProjectType" ADD VALUE 'TRAINING';
ALTER TYPE "public"."ProjectType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "jobId" TEXT;

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "constraints" TEXT,
ADD COLUMN     "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "lastModifiedBy" TEXT,
ADD COLUMN     "onHoldAt" TIMESTAMP(3),
ADD COLUMN     "previousStatus" "public"."JobStatus",
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "requirements" TEXT,
ADD COLUMN     "riskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
DROP COLUMN "priority",
ADD COLUMN     "priority" "public"."JobPriority" NOT NULL DEFAULT 'MEDIUM',
DROP COLUMN "location",
ADD COLUMN     "location" "public"."WorkLocation" NOT NULL DEFAULT 'REMOTE',
DROP COLUMN "attachments",
ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "visibility",
ADD COLUMN     "visibility" "public"."JobVisibility" NOT NULL DEFAULT 'PUBLIC';

-- DropEnum
DROP TYPE "public"."Location";

-- DropEnum
DROP TYPE "public"."Priority";

-- DropEnum
DROP TYPE "public"."Visibility";

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
