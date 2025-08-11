-- CreateEnum
CREATE TYPE "public"."AuditEventType" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'USER_REGISTERED', 'EMAIL_VERIFIED', 'EMAIL_VERIFICATION_SENT', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'TWO_FACTOR_SETUP', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_VERIFICATION_FAILED', 'SESSION_CREATED', 'SESSION_TERMINATED', 'SESSION_EXPIRED', 'ALL_SESSIONS_TERMINATED', 'USER_ROLE_CHANGED', 'USER_DEACTIVATED', 'USER_ACTIVATED', 'USER_DELETED', 'PROFILE_UPDATED', 'PROFILE_VIEWED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED_ACCESS', 'SYSTEM_ERROR', 'CONFIGURATION_CHANGED', 'MAINTENANCE_MODE');

-- CreateEnum
CREATE TYPE "public"."AuditEventCategory" AS ENUM ('AUTHENTICATION', 'AUTHORIZATION', 'USER_MANAGEMENT', 'SECURITY', 'SYSTEM', 'PROFILE', 'SESSION');

-- CreateEnum
CREATE TYPE "public"."AuditSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "public"."AuditEventType" NOT NULL,
    "eventCategory" "public"."AuditEventCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionToken" TEXT,
    "severity" "public"."AuditSeverity" NOT NULL DEFAULT 'INFO',
    "source" TEXT NOT NULL DEFAULT 'auth-system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetUserId" TEXT,
    "targetResource" TEXT,
    "targetResourceId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "public"."AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_eventCategory_idx" ON "public"."AuditLog"("eventCategory");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "public"."AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_source_idx" ON "public"."AuditLog"("source");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
