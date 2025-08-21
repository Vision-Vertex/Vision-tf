-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ON_HOLD', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('WEB_APP', 'MOBILE_APP', 'API', 'DESIGN');

-- CreateEnum
CREATE TYPE "public"."Location" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "public"."AssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "requiredSkills" JSONB,
    "preferredSkills" JSONB,
    "budget" JSONB,
    "estimatedHours" INTEGER,
    "priority" "public"."Priority",
    "projectType" "public"."ProjectType",
    "location" "public"."Location",
    "attachments" JSONB,
    "tags" TEXT[],
    "visibility" "public"."Visibility",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobAssignment" ADD CONSTRAINT "JobAssignment_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobAssignment" ADD CONSTRAINT "JobAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
