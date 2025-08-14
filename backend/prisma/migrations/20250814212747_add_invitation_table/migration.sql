-- CreateTable
CREATE TABLE "public"."Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "public"."Invitation"("code");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "public"."Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_code_idx" ON "public"."Invitation"("code");

-- CreateIndex
CREATE INDEX "Invitation_role_idx" ON "public"."Invitation"("role");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_idx" ON "public"."Invitation"("expiresAt");

-- CreateIndex
CREATE INDEX "Invitation_createdBy_idx" ON "public"."Invitation"("createdBy");

-- CreateIndex
CREATE INDEX "Invitation_used_idx" ON "public"."Invitation"("used");

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
