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
    if (!(await deps.repository.claimNotifyAttempt(lead.id, lead.notifyAttempts))) continue;
    const ok = await deps.dispatcher.dispatch(lead);
    if (ok) {
      await deps.repository.markNotified(lead.id, deps.clock.now());
      delivered += 1;
    } else if (lead.notifyAttempts + 1 >= MAX_NOTIFY_ATTEMPTS) {
      // Id only: the lead is still in the database, call the parent from there.
      deps.logger.error('[notify] lead gave up after the last attempt, call the parent', { leadId: lead.id, attempts: lead.notifyAttempts + 1 });
    }
  }
  // Silent when there was nothing to do: cPanel mails every line of cron output.
  if (pending.length > 0) deps.logger.info('[notify] pending leads retried', { found: pending.length, delivered });
  return { found: pending.length, delivered };
}
