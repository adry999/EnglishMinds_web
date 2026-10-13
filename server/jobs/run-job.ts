import type { Pool } from 'mysql2/promise';
import { ConfigError, readEnvironment, type Environment } from '../config/environment';
import { createDatabasePool } from '../db/pool';
import { consoleLogger } from '../leads/ports';
import { errorFieldsWithoutMessage } from '../leads/error-fields';

export async function runJob(name: string, job: (env: Environment, pool: Pool) => Promise<unknown>): Promise<void> {
  try {
    const env = readEnvironment();
    const pool = createDatabasePool(env.db);
    try {
      await job(env, pool);
    } finally {
      await pool.end();
    }
  } catch (error) {
    consoleLogger.error(`[${name}] failed`, error instanceof ConfigError ? { ...errorFieldsWithoutMessage(error), variable: error.variable } : errorFieldsWithoutMessage(error));
    process.exitCode = 1;
  }
}
