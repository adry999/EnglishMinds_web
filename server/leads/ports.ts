import type { Lead } from '@shared/contracts/lead.schema';

export type LeadRecord = Lead & { readonly consentAt: Date; readonly createdAt: Date };

export type StoredLead = LeadRecord & { readonly id: number; readonly notifyAttempts: number };

export type PendingNotificationQuery = {
  /** Only leads created at or before this moment (gives the first attempt time to finish). */
  readonly olderThan: Date;
  /** Only leads created at or after this moment. */
  readonly newerThan: Date;
  /** Only leads with fewer notification attempts than this. */
  readonly maxAttempts: number;
  readonly limit: number;
};

export interface LeadRepository {
  /** Stores the lead and returns its id. */
  save(record: LeadRecord): Promise<number>;
  deleteCreatedBefore(cutoff: Date): Promise<number>;
  /** Counts one notification attempt; sets `notified_at` when it reached at least one channel. */
  recordNotifyAttempt(id: number, delivered: boolean, at: Date): Promise<void>;
  findPendingNotification(query: PendingNotificationQuery): Promise<StoredLead[]>;
}

export interface RateLimiter {
  /** Numără o încercare; întoarce `false` dacă limita ferestrei curente e depășită. `limit` înlocuiește limita implicită a cheii. */
  hit(key: string, now: Date, limit?: number): Promise<boolean>;
  deleteWindowsBefore(cutoff: Date): Promise<number>;
}

/** One notification channel (email, Telegram). Throws when the message could not be delivered. */
export interface LeadNotifier {
  notify(record: LeadRecord): Promise<void>;
}

export type NotificationChannel = { readonly name: string; readonly notifier: LeadNotifier };

/** Sends a lead through every channel independently; `true` when at least one channel delivered it. Never throws. */
export interface LeadDispatcher {
  dispatch(record: LeadRecord): Promise<boolean>;
}

export interface Clock {
  now(): Date;
}

export type LogContext = Readonly<Record<string, unknown>>;

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export const systemClock: Clock = { now: () => new Date() };

export const consoleLogger: Logger = {
  info: (message, context) => console.info(message, context ?? {}),
  warn: (message, context) => console.warn(message, context ?? {}),
  error: (message, context) => console.error(message, context ?? {}),
};
