import type { Clock, LeadDispatcher, LeadRepository, Logger } from '../leads/ports';

export const RETRY_AFTER_MS = 5 * 60 * 1000;
export const RETRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Counts the first attempt made when the lead arrived. */
export const MAX_NOTIFY_ATTEMPTS = 3;
const BATCH = 50;

export type NotifyPendingDeps = {
  readonly repository: LeadRepository;
  readonly dispatcher: LeadDispatcher;
  readonly clock: Clock;
  readonly logger: Logger;
};

export async function notifyPending(deps: NotifyPendingDeps): Promise<{ found: number; delivered: number }> {
  const now = deps.clock.now();
  const pending = await deps.repository.findPendingNotification({
    olderThan: new Date(now.getTime() - RETRY_AFTER_MS),
    newerThan: new Date(now.getTime() - RETRY_WINDOW_MS),
    maxAttempts: MAX_NOTIFY_ATTEMPTS,
    limit: BATCH,
  });
  let delivered = 0;
  for (const lead of pending) {
    const ok = await deps.dispatcher.dispatch(lead);
    await deps.repository.recordNotifyAttempt(lead.id, ok, deps.clock.now());
    if (ok) delivered += 1;
  }
  deps.logger.info('[notify] pending leads retried', { found: pending.length, delivered });
  return { found: pending.length, delivered };
}
