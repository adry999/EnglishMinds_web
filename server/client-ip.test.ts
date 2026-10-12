import { describe, expect, it } from 'vitest';
import { clientIpOf, describeClientIp } from './client-ip';

describe('clientIpOf', () => {
  it('uses the socket address with 0 hops, whatever the client sends', () => {
    expect(clientIpOf('198.51.100.1', '10.0.0.5', 0)).toBe('10.0.0.5');
    expect(clientIpOf(undefined, '10.0.0.5', 0)).toBe('10.0.0.5');
  });

  it('takes the last forwarded address with 1 hop', () => {
    expect(clientIpOf('198.51.100.1 , 10.0.0.1 ', '127.0.0.1', 1)).toBe('10.0.0.1');
    expect(clientIpOf(['198.51.100.2, 10.0.0.1', '10.0.0.9'], '127.0.0.1', 1)).toBe('10.0.0.9');
  });

  it('takes the N-th address from the right with N hops', () => {
    expect(clientIpOf('203.0.113.7, 172.16.0.1', '127.0.0.1', 2)).toBe('203.0.113.7');
    expect(clientIpOf('1.1.1.1, 203.0.113.7, 172.16.0.1', '127.0.0.1', 2)).toBe('203.0.113.7');
    expect(clientIpOf('1.1.1.1, 203.0.113.7, 172.16.0.1', '127.0.0.1', 3)).toBe('1.1.1.1');
  });

  it('ignores values the client wrote to the left of the trusted hops', () => {
    const spoofed = 'spoofed-by-client, 9.9.9.9, 203.0.113.7, 172.16.0.1';
    expect(clientIpOf(spoofed, '127.0.0.1', 2)).toBe('203.0.113.7');
    expect(clientIpOf(spoofed, '127.0.0.1', 1)).toBe('172.16.0.1');
  });

  it('returns null, not the socket address, when the header is missing, empty or shorter than the hops', () => {
    expect(clientIpOf(undefined, '127.0.0.1', 1)).toBeNull();
    expect(clientIpOf(' , ', '127.0.0.1', 1)).toBeNull();
    expect(clientIpOf('203.0.113.7', '127.0.0.1', 2)).toBeNull();
  });

  it('keeps IPv6 addresses intact', () => {
    expect(clientIpOf('2001:db8::1', undefined, 1)).toBe('2001:db8::1');
  });

  it('returns null when nothing is known', () => {
    expect(clientIpOf(undefined, undefined, 0)).toBeNull();
    expect(clientIpOf(undefined, undefined, 2)).toBeNull();
  });
});

describe('describeClientIp', () => {
  it('reports counts and a short hash, never the address', () => {
    const report = describeClientIp('198.51.100.1, 203.0.113.7', '127.0.0.1', 1, 's'.repeat(32));
    expect(report).toMatchObject({ hops: 1, forwardedEntries: 2, hasSocketAddress: true });
    expect(String(report.resolvedHash)).toMatch(/^[0-9a-f]{12}$/);
    expect(JSON.stringify(report)).not.toContain('203.0.113.7');
  });

  it('reports none when no address resolves', () => {
    expect(describeClientIp(undefined, undefined, 0, 's'.repeat(32))).toMatchObject({ resolvedHash: 'none', hasSocketAddress: false });
  });
});
