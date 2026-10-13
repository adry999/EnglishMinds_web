import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Pool } from 'mysql2/promise';
import { createDatabasePool } from '@server/db/pool';

const MIGRATIONS = resolve(import.meta.dirname, '../../server/db/migrations');

export function testDatabaseUrl(): string | undefined {
  const url = process.env.TEST_DATABASE_URL?.trim();
  return url ? url : undefined;
}

export async function openTestPool(url: string): Promise<Pool> {
  const parsed = new URL(url);
  const pool = createDatabasePool({
    host: parsed.hostname,
    port: parsed.port === '' ? 3306 : Number(parsed.port),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.slice(1)),
  });
  await runMigrationsOnOneConnection(pool);
  return pool;
}

export async function runMigrationsOnOneConnection(pool: Pool): Promise<void> {
  const connection = await pool.getConnection();
  try {
    for (const file of readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort()) {
      const statements = readFileSync(join(MIGRATIONS, file), 'utf8')
        .split(/;[ \t]*\r?\n/)
        .map((statement) => statement.trim())
        .filter((statement) => statement.replace(/^--.*$/gm, '').trim() !== '');
      for (const statement of statements) await connection.query(statement);
    }
  } finally {
    connection.release();
  }
}

export async function resetTables(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM rate_limits');
}
