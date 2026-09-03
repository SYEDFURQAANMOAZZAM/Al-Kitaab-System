-- DropIndex
DROP INDEX "Progress_batchId_idx";

-- DropIndex
DROP INDEX "Progress_studentId_date_idx";

-- CreateIndex
CREATE INDEX "Progress_batchId_date_idx" ON "Progress"("batchId", "date");
