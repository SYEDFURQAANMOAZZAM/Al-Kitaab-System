-- Remove the legacy per-user access flag. Authorization is now role-based.
ALTER TABLE "User" DROP COLUMN "isaccess";

DROP TYPE "Access";
