export function clientIpOf(
  forwardedFor: string | string[] | undefined,
  remoteAddress: string | undefined,
  trustProxy: boolean,
): string | null {
  if (trustProxy && forwardedFor !== undefined) {
    const header = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
    // Assumes exactly one trusted proxy hop (cPanel/Passenger); verify on staging.
    const last = header.split(',').map((part) => part.trim()).filter((part) => part !== '').at(-1);
    if (last) return last;
  }
  return remoteAddress ?? null;
}
