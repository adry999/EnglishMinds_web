/** Safe error fields only: never the message, which may echo personal data. */
export function safeError(error: unknown): Record<string, string | number | boolean> {
  if (typeof error !== 'object' || error === null) return { errorName: typeof error };
  const source = error as Record<string, unknown>;
  const safe: Record<string, string | number | boolean> = { errorName: error instanceof Error ? error.name : 'Error' };
  for (const key of ['code', 'errno', 'responseCode']) {
    const value = source[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') safe[key] = value;
  }
  return safe;
}
