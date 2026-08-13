/** Canonical email form used for both identity lookup and persistence. */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
