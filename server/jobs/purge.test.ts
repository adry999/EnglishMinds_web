import { describe, expect, it } from 'vitest';
import { FakeLeadRepository, FakeRateLimiter, RecordingLogger, fixedClock } from '@test-support/lead-fakes';
import { leadCutoff, purgeExpired, rateLimitCutoff } from './purge';

describe('cutoffs', () => {
  it('keeps leads for 12 months and rate limits for 24 hours', () => {
    const now = new Date('2026-10-11T09:30:00.000Z');
    expect(leadCutoff(now).toISOString()).toBe('2025-10-11T09:30:00.000Z');
    expect(rateLimitCutoff(now).toISOString()).toBe('2026-10-10T09:30:00.000Z');
  });

  it('handles the end of February', () => {
    expect(leadCutoff(new Date('2028-02-29T00:00:00.000Z')).toISOString()).toBe('2027-03-01T00:00:00.000Z');
  });
});

describe('purgeExpired', () => {
  it('deletes expired rows and logs the counts', async () => {
    const repository = new FakeLeadRepository();
    const base = { parentName: 'A B', phone: '+40722123456', childAgeGroup: null, source: 'home', testLevel: null, consent: true, policyVersion: '1', utm: { source: null, medium: null, campaign: null } } as const;
    await repository.save({ ...base, consentAt: new Date('2025-10-01T00:00:00.000Z'), createdAt: new Date('2025-10-01T00:00:00.000Z') });
    await repository.save({ ...base, consentAt: new Date('2026-01-01T00:00:00.000Z'), createdAt: new Date('2026-01-01T00:00:00.000Z') });
    const logger = new RecordingLogger();
    const result = await purgeExpired({ repository, rateLimiter: new FakeRateLimiter(), clock: fixedClock('2026-10-11T09:30:00.000Z'), logger });
    expect(result).toEqual({ leads: 1, rateLimits: 0 });
    expect(repository.saved).toHaveLength(1);
    expect(logger.entries).toEqual([{ level: 'info', message: '[purge] expired data deleted', context: { leads: 1, rateLimits: 0 } }]);
  });
});
