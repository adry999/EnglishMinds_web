import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createPool, type Pool } from 'mysql2/promise';

const MIGRATIONS = resolve(import.meta.dirname, '../../server/db/migrations');

export function testDatabaseUrl(): string | undefined {
  const url = process.env.TEST_DATABASE_URL?.trim();
  return url ? url : undefined;
}

export async function openTestPool(url: string): Promise<Pool> {
  const pool = createPool({ uri: url, timezone: 'Z', connectionLimit: 2 });
  for (const file of readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort()) {
    await pool.query(readFileSync(join(MIGRATIONS, file), 'utf8'));
  }
  return pool;
}

export async function resetTables(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM rate_limits');
}
