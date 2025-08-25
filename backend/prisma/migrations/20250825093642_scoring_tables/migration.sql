-- CreateEnum
CREATE TYPE "public"."ScoringAlgorithmType" AS ENUM ('DEFAULT', 'LINEAR', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."ScoringConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "algorithm" "public"."ScoringAlgorithmType" NOT NULL DEFAULT 'DEFAULT',
    "weights" JSONB NOT NULL,
    "constraints" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeveloperPerformanceMetric" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "cancelledCount" INTEGER NOT NULL DEFAULT 0,
    "onTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCycleTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgQualityRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoringRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "algorithm" "public"."ScoringAlgorithmType" NOT NULL DEFAULT 'DEFAULT',
    "configId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoringRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentScore" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoringConfig_isActive_idx" ON "public"."ScoringConfig"("isActive");

-- CreateIndex
CREATE INDEX "DeveloperPerformanceMetric_avgQualityRating_onTimeRate_idx" ON "public"."DeveloperPerformanceMetric"("avgQualityRating", "onTimeRate");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperPerformanceMetric_developerId_key" ON "public"."DeveloperPerformanceMetric"("developerId");

-- CreateIndex
CREATE INDEX "ScoringRun_jobId_createdAt_idx" ON "public"."ScoringRun"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "AssignmentScore_jobId_totalScore_idx" ON "public"."AssignmentScore"("jobId", "totalScore");

-- CreateIndex
CREATE INDEX "AssignmentScore_developerId_createdAt_idx" ON "public"."AssignmentScore"("developerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentScore_runId_developerId_key" ON "public"."AssignmentScore"("runId", "developerId");

-- AddForeignKey
ALTER TABLE "public"."DeveloperPerformanceMetric" ADD CONSTRAINT "DeveloperPerformanceMetric_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoringRun" ADD CONSTRAINT "ScoringRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoringRun" ADD CONSTRAINT "ScoringRun_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."ScoringConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoringRun" ADD CONSTRAINT "ScoringRun_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentScore" ADD CONSTRAINT "AssignmentScore_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."ScoringRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentScore" ADD CONSTRAINT "AssignmentScore_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentScore" ADD CONSTRAINT "AssignmentScore_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
