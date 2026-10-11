import { describe, expect, it } from 'vitest';
import { normalizeRoPhone } from './phone';

describe('normalizeRoPhone', () => {
  it.each([
    '0722123456',
    '0722 123 456',
    '0722.123.456',
    '0722-123-456',
    '(0722) 123 456',
    '+40722123456',
    '+40 722 123 456',
    '+40 (0) 722 123 456',
    '0040722123456',
    '40722123456',
  ])('normalizes %j to +40722123456', (input) => {
    expect(normalizeRoPhone(input)).toBe('+40722123456');
  });

  it('accepts landlines', () => {
    expect(normalizeRoPhone('0264 123 456')).toBe('+40264123456');
    expect(normalizeRoPhone('0364 123 456')).toBe('+40364123456');
  });

  it.each(['', '   ', '123', '0722 123 45', '07221234567', '0822 123 456', '+44 7911 123456', 'abc0722123456', '0722 123 456 ext 2'])(
    'rejects %j',
    (input) => {
      expect(normalizeRoPhone(input)).toBeNull();
    },
  );
});
