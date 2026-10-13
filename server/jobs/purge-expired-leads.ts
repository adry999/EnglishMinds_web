import { createMysqlLeadRepository } from '../leads/lead.repository';
import { consoleLogger, systemClock } from '../leads/ports';
import { createMysqlRateLimiter } from '../leads/rate-limit';
import { purgeExpired } from './purge';
import { runJob } from './run-job';

void runJob('purge', (_env, pool) =>
  purgeExpired({
    repository: createMysqlLeadRepository(pool),
    rateLimiter: createMysqlRateLimiter(pool),
    clock: systemClock,
    logger: consoleLogger,
  }),
);
