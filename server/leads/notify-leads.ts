import type { LeadDispatcher, Logger, NotificationChannel } from './ports';
import { safeError } from './safe-error';

export function createLeadDispatcher(channels: readonly NotificationChannel[], logger: Logger): LeadDispatcher {
  return {
    async dispatch(record) {
      const outcomes = await Promise.all(
        channels.map(async ({ name, notifier }) => {
          try {
            await notifier.notify(record);
            return true;
          } catch (error) {
            logger.warn(`[lead] ${name} notification failed; lead is saved`, { channel: name, source: record.source, ...safeError(error) });
            return false;
          }
        }),
      );
      return outcomes.some(Boolean);
    },
  };
}
