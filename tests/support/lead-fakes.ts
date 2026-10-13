import type { Clock, LeadDispatcher, LeadNotifier, LeadRecord, LeadRepository, LogContext, Logger, PendingNotificationQuery, RateLimiter, StoredLead } from '@server/leads/ports';

const NOW = new Date('2026-10-11T09:30:00.000Z');

export function aLead(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    parentName: 'Ana Pop',
    phone: '+40722123456',
    childAgeGroup: null,
    source: 'home',
    testLevel: null,
    consent: true,
    policyVersion: '2',
    utm: { source: null, medium: null, campaign: null },
    consentAt: NOW,
    createdAt: NOW,
    ...overrides,
  };
}

export function aLeadCreatedAt(createdAt: string, overrides: Partial<LeadRecord> = {}): LeadRecord {
  return aLead({ consentAt: new Date(createdAt), createdAt: new Date(createdAt), ...overrides });
}

export function aLeadSubmission(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    parentName: 'Ana Pop',
    phone: '0722 123 456',
    childAgeGroup: null,
    source: 'home',
    testLevel: null,
    consent: true,
    policyVersion: '2',
    utm: { source: null, medium: null, campaign: null },
    website: '',
    elapsedMs: 8400,
    ...overrides,
  };
}

export const flushBackgroundWork = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

export class FakeLeadRepository implements LeadRepository {
  readonly saved: LeadRecord[] = [];
  readonly notificationBySavedIndex: { notifiedAt: Date | null; attempts: number }[] = [];
  failWith: Error | null = null;
  failRecordWith: Error | null = null;

  async save(record: LeadRecord): Promise<number> {
    if (this.failWith) throw this.failWith;
    this.saved.push(record);
    this.notificationBySavedIndex.push({ notifiedAt: null, attempts: 0 });
    return this.saved.length;
  }

  async recordNotifyAttempt(id: number, delivered: boolean, at: Date): Promise<void> {
    if (this.failRecordWith) throw this.failRecordWith;
    const state = this.notificationBySavedIndex[id - 1];
    if (!state) return;
    state.attempts += 1;
    if (delivered) state.notifiedAt = at;
  }

  async claimNotifyAttempt(id: number, expectedAttempts: number): Promise<boolean> {
    const state = this.notificationBySavedIndex[id - 1];
    if (!state || state.attempts !== expectedAttempts) return false;
    state.attempts += 1;
    return true;
  }

  async markNotified(id: number, at: Date): Promise<void> {
    const state = this.notificationBySavedIndex[id - 1];
    if (state) state.notifiedAt = at;
  }

  async findPendingNotification(query: PendingNotificationQuery): Promise<StoredLead[]> {
    return this.saved
      .map((record, index) => ({ record, state: this.notificationBySavedIndex[index], id: index + 1 }))
      .filter(
        ({ record, state }) =>
          state !== undefined &&
          state.notifiedAt === null &&
          state.attempts < query.maxAttempts &&
          record.createdAt <= query.createdBefore &&
          record.createdAt >= query.createdAfter,
      )
      .slice(0, query.limit)
      .map(({ record, state, id }) => ({ ...record, id, notifyAttempts: state?.attempts ?? 0 }));
  }

  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const before = this.saved.length;
    const keep = this.saved.map((record) => record.createdAt >= cutoff);
    const kept = this.saved.filter((_, index) => keep[index]);
    const keptState = this.notificationBySavedIndex.filter((_, index) => keep[index]);
    this.saved.splice(0, this.saved.length, ...kept);
    this.notificationBySavedIndex.splice(0, this.notificationBySavedIndex.length, ...keptState);
    return before - this.saved.length;
  }
}

export class FakeRateLimiter implements RateLimiter {
  readonly keys: string[] = [];
  readonly limits = new Map<string, number | undefined>();
  allow = true;
  readonly refusedKeys = new Set<string>();
  failWith: Error | null = null;

  async hit(key: string, _now?: Date, limit?: number): Promise<boolean> {
    if (this.failWith) throw this.failWith;
    this.keys.push(key);
    this.limits.set(key, limit);
    return this.allow && !this.refusedKeys.has(key);
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
