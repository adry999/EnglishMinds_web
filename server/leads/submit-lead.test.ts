import { beforeEach, describe, expect, it } from 'vitest';
import { FakeDispatcher, FakeLeadRepository, FakeNotifier, FakeRateLimiter, RecordingLogger, aLeadSubmission, fixedClock, flushBackgroundWork } from '@test-support/lead-fakes';
import { createLeadDispatcher } from './notify-leads';
import { isLikelyBot, submitLead, type SubmitLeadDeps } from './submit-lead';

const NOW = '2026-10-11T09:30:00.000Z';

const body = aLeadSubmission({
  parentName: 'Ștefănescu Ana',
  childAgeGroup: '7–8 ani',
  source: 'landing',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
});

let repository: FakeLeadRepository;
let rateLimiter: FakeRateLimiter;
let dispatcher: FakeDispatcher;
let logger: RecordingLogger;
let deps: SubmitLeadDeps;

beforeEach(() => {
  repository = new FakeLeadRepository();
  rateLimiter = new FakeRateLimiter();
  dispatcher = new FakeDispatcher();
  logger = new RecordingLogger();
  deps = { repository, rateLimiter, dispatcher, logger, clock: fixedClock(NOW), hashIp: (ip) => `hash(${ip})`, globalHourlyCap: 60 };
});

const logged = (): string => JSON.stringify(logger.entries);

describe('submitLead', () => {
  it('saves a valid lead with server timestamps, notifies and answers 201', async () => {
    await expect(submitLead(body, '203.0.113.7', deps)).resolves.toEqual({ status: 201 });
    expect(repository.saved).toHaveLength(1);
    const record = repository.saved[0];
    expect(record).toMatchObject({ parentName: 'Ștefănescu Ana', phone: '+40722123456', source: 'landing', policyVersion: '2' });
    expect(record?.consentAt.toISOString()).toBe(NOW);
    expect(record?.createdAt.toISOString()).toBe(NOW);
    expect(record).not.toHaveProperty('website');
    expect(dispatcher.sent).toEqual([record]);
    expect(rateLimiter.keys).toEqual(['hash(203.0.113.7)', 'global']);
    expect(rateLimiter.limits.get('global')).toBe(60);
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
    expect(dispatcher.sent).toEqual([]);
  });

  it('does not pool unknown visitors into one bucket: only the site-wide cap applies, and it warns', async () => {
    await expect(submitLead(body, null, deps)).resolves.toEqual({ status: 201 });
    expect(rateLimiter.keys).toEqual(['global']);
    expect(logger.entries.some((entry) => entry.level === 'warn' && entry.message.includes('address unknown'))).toBe(true);
  });

  it('answers 429 when the site-wide hourly cap is reached, without saving', async () => {
    rateLimiter.refusedKeys.add('global');
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 429 });
    expect(repository.saved).toEqual([]);
    expect(dispatcher.sent).toEqual([]);
  });

  it('enforces the site-wide cap for unknown visitors too', async () => {
    rateLimiter.refusedKeys.add('global');
    await expect(submitLead(body, null, deps)).resolves.toEqual({ status: 429 });
  });

  it('uses the configured site-wide cap', async () => {
    await submitLead(body, '1.1.1.1', { ...deps, globalHourlyCap: 7 });
    expect(rateLimiter.limits.get('global')).toBe(7);
  });

  it('does not spend the site-wide cap on a visitor who is already rate limited', async () => {
    rateLimiter.refusedKeys.add('hash(1.1.1.1)');
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 429 });
    expect(rateLimiter.keys).toEqual(['hash(1.1.1.1)']);
  });

  it('marks the lead as notified when a channel delivered it', async () => {
    await submitLead(body, '1.1.1.1', deps);
    await flushBackgroundWork();
    expect(repository.notificationBySavedIndex[0]?.notifiedAt?.toISOString()).toBe(NOW);
    expect(repository.notificationBySavedIndex[0]?.attempts).toBe(1);
  });

  it('leaves the lead pending when no channel delivered it', async () => {
    dispatcher.delivered = false;
    await submitLead(body, '1.1.1.1', deps);
    await flushBackgroundWork();
    expect(repository.notificationBySavedIndex[0]).toEqual({ notifiedAt: null, attempts: 1 });
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
    expect(dispatcher.sent).toEqual([]);
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
    const email = new FakeNotifier();
    email.failWith = Object.assign(new Error('SMTP timeout for Ștefănescu'), { responseCode: 421 });
    const real = { ...deps, dispatcher: createLeadDispatcher([{ name: 'email', notifier: email }], logger) };
    await expect(submitLead(body, '1.1.1.1', real)).resolves.toEqual({ status: 201 });
    await flushBackgroundWork();
    expect(repository.saved).toHaveLength(1);
    expect(repository.notificationBySavedIndex[0]).toEqual({ notifiedAt: null, attempts: 1 });
    expect(logged()).toContain('421');
    expect(logger.entries.some((entry) => entry.level === 'warn')).toBe(true);
    expect(logged()).not.toMatch(/Ștefănescu|0722/);
  });

  it('keeps 201 when recording the notification state fails', async () => {
    repository.failRecordWith = Object.assign(new Error('Ștefănescu'), { code: 'ECONNRESET' });
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 201 });
    await flushBackgroundWork();
    expect(logger.entries.some((entry) => entry.level === 'warn')).toBe(true);
    expect(logged()).not.toMatch(/Ștefănescu/);
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
