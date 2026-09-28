/*
  Warnings:

  - You are about to drop the column `batchname` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `batchname` on the `Progress` table. All the data in the column will be lost.
  - Made the column `batchId` on table `Attendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `Progress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "batchname",
ALTER COLUMN "batchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "batchname",
ALTER COLUMN "batchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
