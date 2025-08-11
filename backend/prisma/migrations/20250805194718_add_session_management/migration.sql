-- AlterTable
ALTER TABLE "public"."Session" ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "rememberMe" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Session_userId_isActive_idx" ON "public"."Session"("userId", "isActive");
