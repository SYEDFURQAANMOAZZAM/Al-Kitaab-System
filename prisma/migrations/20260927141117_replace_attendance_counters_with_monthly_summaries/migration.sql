/*
  Warnings:

  - You are about to drop the column `eligibleDays` on the `StudentEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `presentDays` on the `StudentEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `eligibleDays` on the `TeacherAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `presentDays` on the `TeacherAssignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudentEnrollment" DROP COLUMN "eligibleDays",
DROP COLUMN "presentDays";

-- AlterTable
ALTER TABLE "TeacherAssignment" DROP COLUMN "eligibleDays",
DROP COLUMN "presentDays";

-- CreateTable
CREATE TABLE "StudentAttendanceSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "eligibleDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentAttendanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAttendanceSummary" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "eligibleDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeacherAttendanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentAttendanceSummary_batchId_year_month_idx" ON "StudentAttendanceSummary"("batchId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceSummary_studentId_batchId_year_month_key" ON "StudentAttendanceSummary"("studentId", "batchId", "year", "month");

-- CreateIndex
CREATE INDEX "TeacherAttendanceSummary_batchId_year_month_idx" ON "TeacherAttendanceSummary"("batchId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendanceSummary_teacherId_batchId_year_month_key" ON "TeacherAttendanceSummary"("teacherId", "batchId", "year", "month");

-- AddForeignKey
ALTER TABLE "StudentAttendanceSummary" ADD CONSTRAINT "StudentAttendanceSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceSummary" ADD CONSTRAINT "StudentAttendanceSummary_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendanceSummary" ADD CONSTRAINT "TeacherAttendanceSummary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendanceSummary" ADD CONSTRAINT "TeacherAttendanceSummary_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
