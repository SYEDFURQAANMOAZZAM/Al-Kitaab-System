import { createHash } from "crypto";

/**
 * Returns a stable, one-way representation suitable for database lookups.
 * The JWT itself remains only in the user's httpOnly cookie.
 */
export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
