import { hashIp } from './leads/ip-hash';

function forwardedAddresses(forwardedFor: string | string[] | undefined): string[] {
  if (forwardedFor === undefined) return [];
  const header = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
  return header.split(',').map((part) => part.trim()).filter((part) => part !== '');
}

const UNKNOWN_VISITOR = null;

export function clientIpOf(forwardedFor: string | string[] | undefined, remoteAddress: string | undefined, trustedProxyHops: number): string | null {
  if (trustedProxyHops > 0) {
    const entries = forwardedAddresses(forwardedFor);
    if (entries.length < trustedProxyHops) return UNKNOWN_VISITOR;
    return entries.at(-trustedProxyHops) ?? UNKNOWN_VISITOR;
  }
  return remoteAddress ?? UNKNOWN_VISITOR;
}

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
