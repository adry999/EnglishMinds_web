// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createLevelTestCompleted, LEVEL_TEST_COMPLETED } from './domain-events';

describe('domain events', () => {
  it('creates a bubbling level-test.completed event without personal data', () => {
    const event = createLevelTestCompleted({ mode: 'level', level: 'movers', score: 7, total: 12 });
    expect(event.type).toBe(LEVEL_TEST_COMPLETED);
    expect(event.bubbles).toBe(true);
    expect(event.detail).toEqual({ mode: 'level', level: 'movers', score: 7, total: 12 });
  });
});
