import { describe, expect, it } from 'vitest';
import { clientIpOf } from './client-ip';

describe('clientIpOf', () => {
  it('uses the socket address when the proxy is not trusted', () => {
    expect(clientIpOf('198.51.100.1', '10.0.0.5', false)).toBe('10.0.0.5');
  });

  it('uses the first forwarded address behind a trusted proxy', () => {
    expect(clientIpOf(' 198.51.100.1 , 10.0.0.1', '127.0.0.1', true)).toBe('198.51.100.1');
    expect(clientIpOf(['198.51.100.2, 10.0.0.1', '10.0.0.9'], '127.0.0.1', true)).toBe('198.51.100.2');
  });

  it('falls back to the socket address when the header is missing or empty', () => {
    expect(clientIpOf(undefined, '127.0.0.1', true)).toBe('127.0.0.1');
    expect(clientIpOf(' , ', '127.0.0.1', true)).toBe('127.0.0.1');
  });

  it('returns null when nothing is known', () => {
    expect(clientIpOf(undefined, undefined, false)).toBeNull();
  });
});
