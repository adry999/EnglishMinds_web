export function clientIpOf(
  forwardedFor: string | string[] | undefined,
  remoteAddress: string | undefined,
  trustProxy: boolean,
): string | null {
  if (trustProxy && forwardedFor !== undefined) {
    const header = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
    const first = header.split(',').map((part) => part.trim()).find((part) => part !== '');
    if (first) return first;
  }
  return remoteAddress ?? null;
}
