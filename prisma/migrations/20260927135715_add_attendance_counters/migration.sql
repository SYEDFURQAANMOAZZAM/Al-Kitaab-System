-- AlterTable
ALTER TABLE "StudentEnrollment" ADD COLUMN     "eligibleDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "presentDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TeacherAssignment" ADD COLUMN     "eligibleDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "presentDays" INTEGER NOT NULL DEFAULT 0;
