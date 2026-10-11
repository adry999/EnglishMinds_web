import { readEnvironment } from '../config/environment';
import { createDatabasePool } from '../db/pool';
import { createMysqlLeadRepository } from '../leads/lead.repository';
import { consoleLogger, systemClock } from '../leads/ports';
import { safeError } from '../leads/safe-error';
import { createMysqlRateLimiter } from '../leads/rate-limit';
import { purgeExpired } from './purge';

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
