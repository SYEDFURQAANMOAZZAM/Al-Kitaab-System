/*
  Warnings:

  - You are about to drop the `Learning` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Learning" DROP CONSTRAINT "Learning_progressId_fkey";

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "learnings" JSONB;

-- DropTable
DROP TABLE "Learning";
