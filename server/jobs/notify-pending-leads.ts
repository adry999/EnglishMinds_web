import { createChannels } from '../leads/channels';
import { createMysqlLeadRepository } from '../leads/lead.repository';
import { createLeadDispatcher } from '../leads/notify-leads';
import { consoleLogger, systemClock } from '../leads/ports';
import { notifyPending } from './notify-pending';
import { runJob } from './run-job';

void runJob('notify', (env, pool) =>
  notifyPending({
    repository: createMysqlLeadRepository(pool),
    dispatcher: createLeadDispatcher(createChannels(env), consoleLogger),
    clock: systemClock,
    logger: consoleLogger,
  }),
);
