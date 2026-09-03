/*
  Warnings:

  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SABAQ', 'PARASABAQ', 'AMUQTA');

-- AlterEnum
ALTER TYPE "Attend" ADD VALUE 'LEAVE';

-- AlterTable
ALTER TABLE "StudentEnrollment" ADD COLUMN     "patternId" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Learning" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "score" INTEGER NOT NULL,
    "progressId" TEXT NOT NULL,

    CONSTRAINT "Learning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternArr" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "PatternArr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchPattern" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "BatchPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Holiday_batchId_date_idx" ON "Holiday"("batchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_batchId_date_key" ON "Holiday"("batchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PatternArr_patternId_position_key" ON "PatternArr"("patternId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "BatchPattern_batchId_patternId_key" ON "BatchPattern"("batchId", "patternId");

-- CreateIndex
CREATE INDEX "Attendance_userId_date_idx" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE INDEX "Progress_studentId_date_idx" ON "Progress"("studentId", "date");

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learning" ADD CONSTRAINT "Learning_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "Progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternArr" ADD CONSTRAINT "PatternArr_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchPattern" ADD CONSTRAINT "BatchPattern_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchPattern" ADD CONSTRAINT "BatchPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
