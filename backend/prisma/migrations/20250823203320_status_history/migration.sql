-- CreateTable
CREATE TABLE "public"."AssignmentStatusHistory" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "previousStatus" "public"."AssignmentStatus",
    "newStatus" "public"."AssignmentStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AssignmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamAssignmentStatusHistory" (
    "id" TEXT NOT NULL,
    "teamAssignmentId" TEXT NOT NULL,
    "previousStatus" "public"."AssignmentStatus",
    "newStatus" "public"."AssignmentStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "TeamAssignmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentStatusHistory_assignmentId_idx" ON "public"."AssignmentStatusHistory"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentStatusHistory_changedAt_idx" ON "public"."AssignmentStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "AssignmentStatusHistory_changedBy_idx" ON "public"."AssignmentStatusHistory"("changedBy");

-- CreateIndex
CREATE INDEX "TeamAssignmentStatusHistory_teamAssignmentId_idx" ON "public"."TeamAssignmentStatusHistory"("teamAssignmentId");

-- CreateIndex
CREATE INDEX "TeamAssignmentStatusHistory_changedAt_idx" ON "public"."TeamAssignmentStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "TeamAssignmentStatusHistory_changedBy_idx" ON "public"."TeamAssignmentStatusHistory"("changedBy");

-- AddForeignKey
ALTER TABLE "public"."AssignmentStatusHistory" ADD CONSTRAINT "AssignmentStatusHistory_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."JobAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssignmentStatusHistory" ADD CONSTRAINT "AssignmentStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamAssignmentStatusHistory" ADD CONSTRAINT "TeamAssignmentStatusHistory_teamAssignmentId_fkey" FOREIGN KEY ("teamAssignmentId") REFERENCES "public"."TeamAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamAssignmentStatusHistory" ADD CONSTRAINT "TeamAssignmentStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
