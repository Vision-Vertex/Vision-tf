-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ApplicationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ApplicationEventType" AS ENUM ('APPLICATION_CREATED', 'APPLICATION_UPDATED', 'APPLICATION_DELETED', 'STATUS_CHANGED', 'APPLICATION_VIEWED', 'APPLICATION_REVIEWED', 'APPLICATION_SHORTLISTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_WITHDRAWN', 'APPLICATION_EXPIRED');

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."ApplicationPriority" NOT NULL DEFAULT 'MEDIUM',
    "coverLetter" TEXT,
    "proposedRate" DECIMAL(10,2),
    "proposedCurrency" TEXT DEFAULT 'USD',
    "estimatedHours" INTEGER,
    "availability" JSONB,
    "skills" JSONB,
    "portfolio" TEXT,
    "references" JSONB,
    "motivation" TEXT,
    "relevantExperience" TEXT,
    "questions" JSONB,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "shortlistedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "public"."ApplicationStatus",
    "toStatus" "public"."ApplicationStatus" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventType" "public"."ApplicationEventType" NOT NULL,
    "eventData" JSONB,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "public"."Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_developerId_idx" ON "public"."Application"("developerId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "public"."Application"("status");

-- CreateIndex
CREATE INDEX "Application_priority_idx" ON "public"."Application"("priority");

-- CreateIndex
CREATE INDEX "Application_appliedAt_idx" ON "public"."Application"("appliedAt");

-- CreateIndex
CREATE INDEX "Application_reviewedAt_idx" ON "public"."Application"("reviewedAt");

-- CreateIndex
CREATE INDEX "Application_reviewedBy_idx" ON "public"."Application"("reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_developerId_key" ON "public"."Application"("jobId", "developerId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "public"."ApplicationStatusHistory"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_changedAt_idx" ON "public"."ApplicationStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_changedBy_idx" ON "public"."ApplicationStatusHistory"("changedBy");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_toStatus_idx" ON "public"."ApplicationStatusHistory"("toStatus");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_idx" ON "public"."ApplicationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_eventType_idx" ON "public"."ApplicationEvent"("eventType");

-- CreateIndex
CREATE INDEX "ApplicationEvent_userId_idx" ON "public"."ApplicationEvent"("userId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_createdAt_idx" ON "public"."ApplicationEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
