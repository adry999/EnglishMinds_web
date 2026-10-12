import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { openTestPool, resetTables, runMigrations, testDatabaseUrl } from '@test-support/mysql';
import { createMysqlLeadRepository } from './lead.repository';
import type { LeadRecord } from './ports';
import { GLOBAL_RATE_KEY, createMysqlRateLimiter } from './rate-limit';

const url = testDatabaseUrl();

const record = (createdAt: string): LeadRecord => ({
  parentName: 'Ştefănescu Ţurcan Ana',
  phone: '+40722123456',
  childAgeGroup: '7–8 ani',
  source: 'test',
  testLevel: 'level:movers',
  consent: true,
  policyVersion: '2',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  consentAt: new Date(createdAt),
  createdAt: new Date(createdAt),
});

describe.skipIf(!url)('MySQL adapters', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = await openTestPool(url ?? '');
  });

  afterAll(async () => {
    await pool?.end();
  });

  beforeEach(async () => {
    await resetTables(pool);
  });

  it('saves a lead with diacritics and UTC timestamps intact', async () => {
    await createMysqlLeadRepository(pool).save(record('2026-10-11T09:30:00.000Z'));
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM leads');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      parent_name: 'Ştefănescu Ţurcan Ana',
      phone: '+40722123456',
      child_age_group: '7–8 ani',
      source: 'test',
      test_level: 'level:movers',
      utm_source: 'instagram',
      utm_medium: 'paid',
      utm_campaign: 'demo-toamna',
      policy_version: '2',
    });
    expect((rows[0]?.created_at as Date).toISOString()).toBe('2026-10-11T09:30:00.000Z');
    expect((rows[0]?.consent_at as Date).toISOString()).toBe('2026-10-11T09:30:00.000Z');
  });

  it('deletes only leads created before the cutoff', async () => {
    const repository = createMysqlLeadRepository(pool);
    await repository.save(record('2025-10-11T09:29:59.000Z'));
    await repository.save(record('2025-10-11T09:30:00.000Z'));
    await expect(repository.deleteCreatedBefore(new Date('2025-10-11T09:30:00.000Z'))).resolves.toBe(1);
    const [rows] = await pool.query<RowDataPacket[]>('SELECT created_at FROM leads');
    expect(rows).toHaveLength(1);
  });

  it('allows 5 hits per key and hour, then refuses', async () => {
    const limiter = createMysqlRateLimiter(pool);
    const now = new Date('2026-10-11T09:10:00.000Z');
    const results: boolean[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) results.push(await limiter.hit('a'.repeat(64), now));
    expect(results).toEqual([true, true, true, true, true, false]);
    await expect(limiter.hit('b'.repeat(64), now)).resolves.toBe(true);
    await expect(limiter.hit('a'.repeat(64), new Date('2026-10-11T10:00:00.000Z'))).resolves.toBe(true);
  });

  it('deletes old rate limit windows', async () => {
    const limiter = createMysqlRateLimiter(pool);
    await limiter.hit('a'.repeat(64), new Date('2026-10-10T08:00:00.000Z'));
    await limiter.hit('a'.repeat(64), new Date('2026-10-11T09:00:00.000Z'));
    await expect(limiter.deleteWindowsBefore(new Date('2026-10-10T09:30:00.000Z'))).resolves.toBe(1);
  });

  it('applies the migrations a second time without error and keeps the notification columns', async () => {
    await runMigrations(pool);
    const [columns] = await pool.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME IN ('notified_at', 'notify_attempts')",
    );
    expect(columns.map((row) => row.COLUMN_NAME as string).sort()).toEqual(['notified_at', 'notify_attempts']);
  });

  it('stores consent and policy version, and starts with no notification', async () => {
    const id = await createMysqlLeadRepository(pool).save(record('2026-10-11T09:30:00.000Z'));
    expect(id).toBeGreaterThan(0);
    const [rows] = await pool.query<RowDataPacket[]>('SELECT notified_at, notify_attempts, consent_at, policy_version FROM leads WHERE id = ?', [id]);
    expect(rows[0]).toMatchObject({ notified_at: null, notify_attempts: 0, policy_version: '2' });
    expect((rows[0]?.consent_at as Date).toISOString()).toBe('2026-10-11T09:30:00.000Z');
  });

  it('records notification attempts and sets notified_at only on delivery', async () => {
    const repository = createMysqlLeadRepository(pool);
    const id = await repository.save(record('2026-10-11T09:30:00.000Z'));
    await repository.recordNotifyAttempt(id, false, new Date('2026-10-11T09:31:00.000Z'));
    let [rows] = await pool.query<RowDataPacket[]>('SELECT notified_at, notify_attempts FROM leads WHERE id = ?', [id]);
    expect(rows[0]).toMatchObject({ notified_at: null, notify_attempts: 1 });
    await repository.recordNotifyAttempt(id, true, new Date('2026-10-11T09:32:00.000Z'));
    [rows] = await pool.query<RowDataPacket[]>('SELECT notified_at, notify_attempts FROM leads WHERE id = ?', [id]);
    expect(rows[0]?.notify_attempts).toBe(2);
    expect((rows[0]?.notified_at as Date).toISOString()).toBe('2026-10-11T09:32:00.000Z');
  });

  it('finds unnotified leads inside the retry window with attempts left', async () => {
    const repository = createMysqlLeadRepository(pool);
    const tooOld = await repository.save(record('2026-10-01T09:00:00.000Z'));
    const pending = await repository.save(record('2026-10-11T09:00:00.000Z'));
    const tooNew = await repository.save(record('2026-10-11T11:58:00.000Z'));
    const done = await repository.save(record('2026-10-11T09:10:00.000Z'));
    const exhausted = await repository.save(record('2026-10-11T09:20:00.000Z'));
    await repository.recordNotifyAttempt(done, true, new Date('2026-10-11T09:11:00.000Z'));
    for (let attempt = 0; attempt < 3; attempt += 1) await repository.recordNotifyAttempt(exhausted, false, new Date('2026-10-11T09:21:00.000Z'));

    const found = await repository.findPendingNotification({
      olderThan: new Date('2026-10-11T11:55:00.000Z'),
      newerThan: new Date('2026-10-04T12:00:00.000Z'),
      maxAttempts: 3,
      limit: 50,
    });
    expect(found.map((lead) => lead.id)).toEqual([pending]);
    expect(found[0]).toMatchObject({ parentName: 'Ştefănescu Ţurcan Ana', phone: '+40722123456', source: 'test', notifyAttempts: 0, policyVersion: '2' });
    expect(found[0]?.createdAt.toISOString()).toBe('2026-10-11T09:00:00.000Z');
    expect([tooOld, tooNew, done, exhausted]).not.toContain(found[0]?.id);
  });

  it('counts the site-wide key against its own limit', async () => {
    const limiter = createMysqlRateLimiter(pool);
    const now = new Date('2026-10-11T09:10:00.000Z');
    const results: boolean[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) results.push(await limiter.hit(GLOBAL_RATE_KEY, now, 3));
    expect(results).toEqual([true, true, true, false]);
    await expect(limiter.hit('a'.repeat(64), now)).resolves.toBe(true);
  });
});
