import { beforeEach, describe, expect, it } from 'vitest';
import { FakeLeadRepository, FakeNotifier, FakeRateLimiter, RecordingLogger, fixedClock } from '@test-support/lead-fakes';
import { isLikelyBot, submitLead, type SubmitLeadDeps } from './submit-lead';

const NOW = '2026-10-11T09:30:00.000Z';

const body = {
  parentName: 'Ștefănescu Ana',
  phone: '0722 123 456',
  childAgeGroup: '7–8 ani',
  source: 'landing',
  testLevel: null,
  consent: true,
  policyVersion: '1',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  website: '',
  elapsedMs: 8400,
};

let repository: FakeLeadRepository;
let rateLimiter: FakeRateLimiter;
let notifier: FakeNotifier;
let logger: RecordingLogger;
let deps: SubmitLeadDeps;

beforeEach(() => {
  repository = new FakeLeadRepository();
  rateLimiter = new FakeRateLimiter();
  notifier = new FakeNotifier();
  logger = new RecordingLogger();
  deps = { repository, rateLimiter, notifier, logger, clock: fixedClock(NOW), hashIp: (ip) => `hash(${ip})` };
});

const logged = (): string => JSON.stringify(logger.entries);

describe('submitLead', () => {
  it('saves a valid lead with server timestamps, notifies and answers 201', async () => {
    await expect(submitLead(body, '203.0.113.7', deps)).resolves.toEqual({ status: 201 });
    expect(repository.saved).toHaveLength(1);
    const record = repository.saved[0];
    expect(record).toMatchObject({ parentName: 'Ștefănescu Ana', phone: '+40722123456', source: 'landing', policyVersion: '1' });
    expect(record?.consentAt.toISOString()).toBe(NOW);
    expect(record?.createdAt.toISOString()).toBe(NOW);
    expect(record).not.toHaveProperty('website');
    expect(notifier.sent).toEqual([record]);
    expect(rateLimiter.keys).toEqual(['hash(203.0.113.7)']);
  });

  it('answers 400 with the invalid fields and touches nothing', async () => {
    await expect(submitLead({ ...body, phone: '123', consent: false }, '1.1.1.1', deps)).resolves.toEqual({
      status: 400,
      fields: expect.arrayContaining(['phone', 'consent']),
    });
    expect(rateLimiter.keys).toEqual([]);
    expect(repository.saved).toEqual([]);
  });

  it('answers 429 when the limit is reached, without saving', async () => {
    rateLimiter.allow = false;
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 429 });
    expect(repository.saved).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });

  it('uses a shared bucket when the client IP is unknown', async () => {
    await submitLead(body, null, deps);
    expect(rateLimiter.keys).toEqual(['hash(unknown)']);
  });

  it.each([
    ['a filled honeypot', { website: 'http://spam.example' }],
    ['a form filled under 3 seconds', { elapsedMs: 2999 }],
    ['a missing elapsedMs', { elapsedMs: undefined }],
    ['a non-numeric elapsedMs', { elapsedMs: '9000' }],
  ])('answers 201 without saving for %s', async (_label, patch) => {
    await expect(submitLead({ ...body, ...patch }, '1.1.1.1', deps)).resolves.toEqual({ status: 201 });
    expect(repository.saved).toEqual([]);
    expect(rateLimiter.keys).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });

  it('answers 500 and logs without personal data when saving fails', async () => {
    repository.failWith = new Error('ER_ACCESS_DENIED');
    await expect(submitLead(body, '203.0.113.7', deps)).resolves.toEqual({ status: 500 });
    expect(logger.entries.some((entry) => entry.level === 'error')).toBe(true);
    expect(logged()).not.toMatch(/Ștefănescu|0722|\+40722|203\.0\.113\.7/);
  });

  it('logs only safe error fields, never the message', async () => {
    repository.failWith = Object.assign(new Error('Duplicate Ștefănescu +40722123456'), { code: 'ER_DUP_ENTRY' });
    await submitLead(body, '1.1.1.1', deps);
    expect(logged()).toContain('ER_DUP_ENTRY');
    expect(logged()).not.toMatch(/Ștefănescu|40722123456|Duplicate/);
  });

  it('answers 500 when the rate limiter fails', async () => {
    rateLimiter.failWith = new Error('ECONNREFUSED');
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 500 });
    expect(repository.saved).toEqual([]);
  });

  it('keeps 201 and warns when the email fails after saving', async () => {
    notifier.failWith = Object.assign(new Error('SMTP timeout for Ștefănescu'), { responseCode: 421 });
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 201 });
    await new Promise((resolve) => setImmediate(resolve));
    expect(repository.saved).toHaveLength(1);
    expect(logged()).toContain('421');
    expect(logger.entries.some((entry) => entry.level === 'warn')).toBe(true);
    expect(logged()).not.toMatch(/Ștefănescu|0722/);
  });
});

describe('isLikelyBot', () => {
  it('lets non-objects through to validation', () => {
    expect(isLikelyBot(null)).toBe(false);
    expect(isLikelyBot('x')).toBe(false);
  });

  it('accepts a whitespace-only honeypot as empty', () => {
    expect(isLikelyBot({ website: '  ', elapsedMs: 5000 })).toBe(false);
  });
});
