/*
  Warnings:

  - You are about to drop the column `deviceName` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `rememberMe` on the `Session` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Session_userId_isActive_idx";

-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "deviceName",
DROP COLUMN "rememberMe";
