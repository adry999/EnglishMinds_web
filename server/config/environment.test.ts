import { describe, expect, it } from 'vitest';
import { readEnvironment } from './environment';

describe('readEnvironment', () => {
  it('defaults the port to 3000', () => {
    expect(readEnvironment({}).port).toBe(3000);
  });

  it('reads a numeric PORT', () => {
    expect(readEnvironment({ PORT: '8080' }).port).toBe(8080);
  });

  it.each(['abc', '0', '70000', '80.5', ''])('rejects PORT=%j with a clear message', (value) => {
    expect(() => readEnvironment({ PORT: value })).toThrow(`PORT invalid: "${value}"`);
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(readEnvironment({}))).toBe(true);
  });
});
