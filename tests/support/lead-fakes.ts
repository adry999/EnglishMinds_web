import type { Clock, LeadDispatcher, LeadNotifier, LeadRecord, LeadRepository, LogContext, Logger, PendingNotificationQuery, RateLimiter, StoredLead } from '@server/leads/ports';

export class FakeLeadRepository implements LeadRepository {
  readonly saved: LeadRecord[] = [];
  /** Notification state by index in `saved`. */
  readonly state: { notifiedAt: Date | null; attempts: number }[] = [];
  failWith: Error | null = null;
  failRecordWith: Error | null = null;

  async save(record: LeadRecord): Promise<number> {
    if (this.failWith) throw this.failWith;
    this.saved.push(record);
    this.state.push({ notifiedAt: null, attempts: 0 });
    return this.saved.length;
  }

  async recordNotifyAttempt(id: number, delivered: boolean, at: Date): Promise<void> {
    if (this.failRecordWith) throw this.failRecordWith;
    const state = this.state[id - 1];
    if (!state) return;
    state.attempts += 1;
    if (delivered) state.notifiedAt = at;
  }

  async findPendingNotification(query: PendingNotificationQuery): Promise<StoredLead[]> {
    return this.saved
      .map((record, index) => ({ record, state: this.state[index], id: index + 1 }))
      .filter(
        ({ record, state }) =>
          state !== undefined &&
          state.notifiedAt === null &&
          state.attempts < query.maxAttempts &&
          record.createdAt <= query.olderThan &&
          record.createdAt >= query.newerThan,
      )
      .slice(0, query.limit)
      .map(({ record, state, id }) => ({ ...record, id, notifyAttempts: state?.attempts ?? 0 }));
  }

  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const before = this.saved.length;
    const keep = this.saved.map((record) => record.createdAt >= cutoff);
    const kept = this.saved.filter((_, index) => keep[index]);
    const keptState = this.state.filter((_, index) => keep[index]);
    this.saved.splice(0, this.saved.length, ...kept);
    this.state.splice(0, this.state.length, ...keptState);
    return before - this.saved.length;
  }
}

export class FakeRateLimiter implements RateLimiter {
  readonly keys: string[] = [];
  /** Limits passed with each hit, by key. */
  readonly limits = new Map<string, number | undefined>();
  allow = true;
  /** Keys that are refused even when `allow` is true. */
  readonly refuse = new Set<string>();
  failWith: Error | null = null;

  async hit(key: string, _now?: Date, limit?: number): Promise<boolean> {
    if (this.failWith) throw this.failWith;
    this.keys.push(key);
    this.limits.set(key, limit);
    return this.allow && !this.refuse.has(key);
  }

  async deleteWindowsBefore(): Promise<number> {
    return 0;
  }
}

export class FakeNotifier implements LeadNotifier {
  readonly sent: LeadRecord[] = [];
  failWith: Error | null = null;

  async notify(record: LeadRecord): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(record);
  }
}

export class FakeDispatcher implements LeadDispatcher {
  readonly sent: LeadRecord[] = [];
  delivered = true;

  async dispatch(record: LeadRecord): Promise<boolean> {
    this.sent.push(record);
    return this.delivered;
  }
}

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

export class RecordingLogger implements Logger {
  readonly entries: { level: 'info' | 'warn' | 'error'; message: string; context?: LogContext }[] = [];
  info(message: string, context?: LogContext): void {
    this.entries.push({ level: 'info', message, context });
  }
  warn(message: string, context?: LogContext): void {
    this.entries.push({ level: 'warn', message, context });
  }
  error(message: string, context?: LogContext): void {
    this.entries.push({ level: 'error', message, context });
  }
}
