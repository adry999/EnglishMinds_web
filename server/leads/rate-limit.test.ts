import { describe, expect, it } from 'vitest';
import { windowStart } from './rate-limit';

describe('windowStart', () => {
  it('floors to the start of the UTC hour', () => {
    expect(windowStart(new Date('2026-10-11T09:59:59.999Z')).toISOString()).toBe('2026-10-11T09:00:00.000Z');
    expect(windowStart(new Date('2026-10-11T10:00:00.000Z')).toISOString()).toBe('2026-10-11T10:00:00.000Z');
  });
});
