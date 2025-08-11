-- CreateEnum
CREATE TYPE "public"."SuspiciousActivityType" AS ENUM ('UNUSUAL_LOGIN_TIME', 'UNUSUAL_LOCATION', 'UNUSUAL_DEVICE', 'RAPID_LOGIN_ATTEMPTS', 'CONCURRENT_LOGINS', 'PASSWORD_SPRAY_ATTACK', 'BRUTE_FORCE_ATTACK', 'ACCOUNT_TAKEOVER_ATTEMPT', 'SUSPICIOUS_ROLE_CHANGE', 'SESSION_HIJACKING_ATTEMPT', 'UNUSUAL_SESSION_ACTIVITY', 'MULTIPLE_FAILED_SESSIONS', 'RATE_LIMIT_VIOLATION', 'API_ABUSE', 'DATA_EXFILTRATION_ATTEMPT');

-- CreateEnum
CREATE TYPE "public"."SuspiciousActivitySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."SuspiciousActivityStatus" AS ENUM ('DETECTED', 'INVESTIGATING', 'FALSE_POSITIVE', 'CONFIRMED_THREAT', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."SuspiciousActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "activityType" "public"."SuspiciousActivityType" NOT NULL,
    "severity" "public"."SuspiciousActivitySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "deviceFingerprint" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "public"."SuspiciousActivityStatus" NOT NULL DEFAULT 'DETECTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedAuditLogs" TEXT[],

    CONSTRAINT "SuspiciousActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLoginPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "location" TEXT,
    "deviceFingerprint" TEXT,
    "loginCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "riskFactors" TEXT[],

    CONSTRAINT "UserLoginPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuspiciousActivity_userId_idx" ON "public"."SuspiciousActivity"("userId");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_activityType_idx" ON "public"."SuspiciousActivity"("activityType");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_severity_idx" ON "public"."SuspiciousActivity"("severity");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_status_idx" ON "public"."SuspiciousActivity"("status");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_detectedAt_idx" ON "public"."SuspiciousActivity"("detectedAt");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_riskScore_idx" ON "public"."SuspiciousActivity"("riskScore");

-- CreateIndex
CREATE INDEX "UserLoginPattern_userId_idx" ON "public"."UserLoginPattern"("userId");

-- CreateIndex
CREATE INDEX "UserLoginPattern_ipAddress_idx" ON "public"."UserLoginPattern"("ipAddress");

-- CreateIndex
CREATE INDEX "UserLoginPattern_isSuspicious_idx" ON "public"."UserLoginPattern"("isSuspicious");

-- CreateIndex
CREATE UNIQUE INDEX "UserLoginPattern_userId_ipAddress_userAgent_key" ON "public"."UserLoginPattern"("userId", "ipAddress", "userAgent");

-- AddForeignKey
ALTER TABLE "public"."SuspiciousActivity" ADD CONSTRAINT "SuspiciousActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLoginPattern" ADD CONSTRAINT "UserLoginPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
