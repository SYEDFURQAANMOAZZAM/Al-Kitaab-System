
export function getActionError(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error ? error.message : fallback;
}
