import { readEnvironment } from '../config/environment';
import { createDatabasePool } from '../db/pool';
import { createMysqlLeadRepository } from '../leads/lead.repository';
import { consoleLogger, systemClock } from '../leads/ports';
import { createMysqlRateLimiter } from '../leads/rate-limit';
import { purgeExpired } from './purge';

/** Safe error fields only: never the message, which may echo personal data. */
function safeError(error: unknown): Record<string, string | number | boolean> {
  if (typeof error !== 'object' || error === null) return { errorName: typeof error };
  const source = error as Record<string, unknown>;
  const safe: Record<string, string | number | boolean> = { errorName: error instanceof Error ? error.name : 'Error' };
  for (const key of ['code', 'errno']) {
    const value = source[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') safe[key] = value;
  }
  return safe;
}

async function main(): Promise<void> {
  const env = readEnvironment();
  const pool = createDatabasePool(env.db);
  try {
    await purgeExpired({
      repository: createMysqlLeadRepository(pool),
      rateLimiter: createMysqlRateLimiter(pool),
      clock: systemClock,
      logger: consoleLogger,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  consoleLogger.error('[purge] failed', safeError(error));
  process.exitCode = 1;
});
