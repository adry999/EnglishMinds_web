import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { openTestPool, resetTables, testDatabaseUrl } from '@test-support/mysql';
import { createMysqlLeadRepository } from './lead.repository';
import type { LeadRecord } from './ports';
import { createMysqlRateLimiter } from './rate-limit';

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
      policy_version: '1',
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
});
