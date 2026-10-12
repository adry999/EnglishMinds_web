import { hashIp } from './leads/ip-hash';

function forwardedAddresses(forwardedFor: string | string[] | undefined): string[] {
  if (forwardedFor === undefined) return [];
  const header = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
  return header.split(',').map((part) => part.trim()).filter((part) => part !== '');
}

/**
 * `hops` is the number of proxies in front of the app that each append the address they received the
 * connection from. The visitor is therefore the `hops`-th entry from the right; everything further left
 * was written by the client and is ignored. With 0 hops only the socket address is trusted.
 */
export function clientIpOf(forwardedFor: string | string[] | undefined, remoteAddress: string | undefined, hops: number): string | null {
  if (hops > 0) {
    const resolved = forwardedAddresses(forwardedFor).at(-hops);
    if (resolved) return resolved;
  }
  return remoteAddress ?? null;
}

/** What the temporary DEBUG_CLIENT_IP log line reports. The address itself is never logged, only a short hash. */
export function describeClientIp(
  forwardedFor: string | string[] | undefined,
  remoteAddress: string | undefined,
  hops: number,
  salt: string,
): Record<string, string | number | boolean> {
  const resolved = clientIpOf(forwardedFor, remoteAddress, hops);
  return {
    hops,
    forwardedEntries: forwardedAddresses(forwardedFor).length,
    hasSocketAddress: remoteAddress !== undefined,
    resolvedHash: resolved === null ? 'none' : hashIp(resolved, salt).slice(0, 12),
  };
}
