import { beforeEach, describe, expect, it } from 'vitest';
import { FakeDispatcher, FakeLeadRepository, RecordingLogger, fixedClock } from '@test-support/lead-fakes';
import type { LeadRecord } from '../leads/ports';
import { notifyPending } from './notify-pending';

const NOW = '2026-10-11T12:00:00.000Z';
const lead = (createdAt: string): LeadRecord => ({
  parentName: 'Ana Pop',
  phone: '+40722123456',
  childAgeGroup: null,
  source: 'home',
  testLevel: null,
  consent: true,
  policyVersion: '2',
  utm: { source: null, medium: null, campaign: null },
  consentAt: new Date(createdAt),
  createdAt: new Date(createdAt),
});

let repository: FakeLeadRepository;
let dispatcher: FakeDispatcher;
let logger: RecordingLogger;

beforeEach(() => {
  repository = new FakeLeadRepository();
  dispatcher = new FakeDispatcher();
  logger = new RecordingLogger();
});

const run = () => notifyPending({ repository, dispatcher, clock: fixedClock(NOW), logger });

describe('notifyPending', () => {
  it('re-sends unnotified leads older than 5 minutes and marks them notified', async () => {
    await repository.save(lead('2026-10-11T11:50:00.000Z'));
    await expect(run()).resolves.toEqual({ found: 1, delivered: 1 });
    expect(dispatcher.sent).toHaveLength(1);
    expect(repository.state[0]).toEqual({ notifiedAt: new Date(NOW), attempts: 1 });
    await expect(run()).resolves.toEqual({ found: 0, delivered: 0 });
  });

  it('leaves leads younger than 5 minutes to the first attempt', async () => {
    await repository.save(lead('2026-10-11T11:56:00.000Z'));
    await expect(run()).resolves.toEqual({ found: 0, delivered: 0 });
  });

  it('gives up after a week', async () => {
    await repository.save(lead('2026-10-04T11:59:00.000Z'));
    await expect(run()).resolves.toEqual({ found: 0, delivered: 0 });
    await repository.save(lead('2026-10-04T12:01:00.000Z'));
    await expect(run()).resolves.toEqual({ found: 1, delivered: 1 });
  });

  it('stops after 3 attempts in total, counting the first one', async () => {
    dispatcher.delivered = false;
    await repository.save(lead('2026-10-11T11:00:00.000Z'));
    await repository.recordNotifyAttempt(1, false, new Date(NOW));
    await expect(run()).resolves.toEqual({ found: 1, delivered: 0 });
    await expect(run()).resolves.toEqual({ found: 1, delivered: 0 });
    await expect(run()).resolves.toEqual({ found: 0, delivered: 0 });
    expect(repository.state[0]?.attempts).toBe(3);
    expect(dispatcher.sent).toHaveLength(2);
  });

  it('skips leads that were already notified', async () => {
    await repository.save(lead('2026-10-11T11:00:00.000Z'));
    await repository.recordNotifyAttempt(1, true, new Date(NOW));
    await expect(run()).resolves.toEqual({ found: 0, delivered: 0 });
  });

  it('logs counts only', async () => {
    await repository.save(lead('2026-10-11T11:00:00.000Z'));
    await run();
    expect(logger.entries).toEqual([{ level: 'info', message: '[notify] pending leads retried', context: { found: 1, delivered: 1 } }]);
  });
});
