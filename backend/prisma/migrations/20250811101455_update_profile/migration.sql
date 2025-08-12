/*
  Warnings:

  - The `portfolioLinks` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `billingAddress` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "adminPreferences" JSONB,
ADD COLUMN     "companyDescription" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "education" JSONB,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "lastSystemAccess" TIMESTAMP(3),
ADD COLUMN     "location" JSONB,
ADD COLUMN     "permissions" TEXT[],
ADD COLUMN     "projectPreferences" JSONB,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "systemRole" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workPreferences" JSONB,
DROP COLUMN "portfolioLinks",
ADD COLUMN     "portfolioLinks" JSONB,
DROP COLUMN "billingAddress",
ADD COLUMN     "billingAddress" JSONB;

-- AlterTable
ALTER TABLE "public"."Session" ADD COLUMN     "deviceFingerprint" TEXT,
ADD COLUMN     "isIncognito" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "screenResolution" TEXT,
ADD COLUMN     "timezone" TEXT;

-- CreateIndex
CREATE INDEX "Session_userId_deviceFingerprint_idx" ON "public"."Session"("userId", "deviceFingerprint");

-- CreateIndex
CREATE INDEX "Session_expiresAt_isActive_idx" ON "public"."Session"("expiresAt", "isActive");
