import type { Clock, LeadNotifier, LeadRecord, LeadRepository, LogContext, Logger, RateLimiter } from '@server/leads/ports';

export class FakeLeadRepository implements LeadRepository {
  readonly saved: LeadRecord[] = [];
  failWith: Error | null = null;

  async save(record: LeadRecord): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.saved.push(record);
  }

  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const before = this.saved.length;
    this.saved.splice(0, this.saved.length, ...this.saved.filter((record) => record.createdAt >= cutoff));
    return before - this.saved.length;
  }
}

export class FakeRateLimiter implements RateLimiter {
  readonly keys: string[] = [];
  allow = true;
  failWith: Error | null = null;

  async hit(key: string): Promise<boolean> {
    if (this.failWith) throw this.failWith;
    this.keys.push(key);
    return this.allow;
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
