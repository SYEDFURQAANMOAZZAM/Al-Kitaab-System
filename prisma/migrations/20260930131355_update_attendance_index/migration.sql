-- DropIndex
DROP INDEX "Attendance_batchId_idx";

-- CreateIndex
CREATE INDEX "Attendance_batchId_date_idx" ON "Attendance"("batchId", "date");
