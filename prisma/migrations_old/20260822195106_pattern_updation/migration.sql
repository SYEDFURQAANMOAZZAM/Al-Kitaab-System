/*
  Warnings:

  - You are about to drop the column `patternId` on the `StudentEnrollment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentEnrollment" DROP CONSTRAINT "StudentEnrollment_patternId_fkey";

-- AlterTable
ALTER TABLE "StudentEnrollment" DROP COLUMN "patternId";

-- CreateTable
CREATE TABLE "StudentPattern" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "StudentPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentPattern_studentId_patternId_key" ON "StudentPattern"("studentId", "patternId");

-- AddForeignKey
ALTER TABLE "StudentPattern" ADD CONSTRAINT "StudentPattern_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPattern" ADD CONSTRAINT "StudentPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
