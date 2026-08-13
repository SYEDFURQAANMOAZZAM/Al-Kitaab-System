/**
 * Opt-in authentication diagnostics. Deliberately accepts only non-sensitive
 * request classification data; never pass a token, cookie value, user ID,
 * email address, secret, or database error to this function.
 */
export function authDebug(
  event: string,
  details: Record<string, boolean | number | string | undefined> = {}
) {
  if (
    process.env.AUTH_DEBUG !== "true" &&
    process.env.NODE_ENV !== "development"
  ) {
    return;
  }

  console.info("AUTH_DEBUG", { event, ...details });
}
