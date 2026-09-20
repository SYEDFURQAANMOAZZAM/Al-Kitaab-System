-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "Adress" TEXT,
ADD COLUMN     "fatherName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone2" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
