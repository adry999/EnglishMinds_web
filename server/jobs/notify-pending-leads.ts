import { ConfigError, readEnvironment } from '../config/environment';
import { createDatabasePool } from '../db/pool';
import { createChannels } from '../leads/channels';
import { createMysqlLeadRepository } from '../leads/lead.repository';
import { createLeadDispatcher } from '../leads/notify-leads';
import { consoleLogger, systemClock } from '../leads/ports';
import { safeError } from '../leads/safe-error';
import { notifyPending } from './notify-pending';

async function main(): Promise<void> {
  const env = readEnvironment();
  const pool = createDatabasePool(env.db);
  try {
    await notifyPending({
      repository: createMysqlLeadRepository(pool),
      dispatcher: createLeadDispatcher(createChannels(env), consoleLogger),
      clock: systemClock,
      logger: consoleLogger,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  consoleLogger.error('[notify] failed', error instanceof ConfigError ? { ...safeError(error), variable: error.variable } : safeError(error));
  process.exitCode = 1;
});
