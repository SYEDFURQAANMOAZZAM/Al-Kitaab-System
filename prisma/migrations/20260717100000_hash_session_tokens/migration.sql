-- Replace stored refresh tokens with one-way SHA-256 hashes.
-- Existing sessions are invalidated because their raw token values cannot be
-- safely converted after the fact.
ALTER TABLE "Session" RENAME COLUMN "token" TO "tokenHash";

ALTER INDEX "Session_token_key" RENAME TO "Session_tokenHash_key";
