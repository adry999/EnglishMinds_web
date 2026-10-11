// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createLeadSubmitted, createLevelTestCompleted, LEAD_SUBMITTED, LEVEL_TEST_COMPLETED } from './domain-events';

describe('domain events', () => {
  it('creates a bubbling level-test.completed event without personal data', () => {
    const event = createLevelTestCompleted({ mode: 'level', level: 'movers', score: 7, total: 12 });
    expect(event.type).toBe(LEVEL_TEST_COMPLETED);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail).toEqual({ mode: 'level', level: 'movers', score: 7, total: 12 });
  });
});

describe('createLeadSubmitted', () => {
  it('builds a bubbling, composed event with only source and age group', () => {
    const event = createLeadSubmitted({ source: 'landing', ageGroup: '9–10 ani' });
    expect(event.type).toBe(LEAD_SUBMITTED);
    expect(LEAD_SUBMITTED).toBe('lead.submitted');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail).toEqual({ source: 'landing', ageGroup: '9–10 ani' });
  });
});
