import type { Lead } from '@shared/contracts/lead.schema';

export type LeadRecord = Lead & { readonly consentAt: Date; readonly createdAt: Date };

export type StoredLead = LeadRecord & { readonly id: number; readonly notifyAttempts: number };

export type PendingNotificationQuery = {
  readonly createdBefore: Date;
  readonly createdAfter: Date;
  readonly maxAttempts: number;
  readonly limit: number;
};

export interface LeadRepository {
  save(record: LeadRecord): Promise<number>;
  deleteCreatedBefore(cutoff: Date): Promise<number>;
  recordNotifyAttempt(id: number, delivered: boolean, at: Date): Promise<void>;
  claimNotifyAttempt(id: number, expectedAttempts: number): Promise<boolean>;
  markNotified(id: number, at: Date): Promise<void>;
  findPendingNotification(query: PendingNotificationQuery): Promise<StoredLead[]>;
}

export interface RateLimiter {
  hit(key: string, now: Date, limit?: number): Promise<boolean>;
  deleteWindowsBefore(cutoff: Date): Promise<number>;
}

export interface LeadNotifier {
  notify(record: LeadRecord): Promise<void>;
}

export type NotificationChannel = { readonly name: string; readonly notifier: LeadNotifier };

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

function logArguments(message: string, context: LogContext | undefined): [string] | [string, LogContext] {
  return context === undefined ? [message] : [message, context];
}

export const consoleLogger: Logger = {
  info: (message, context) => console.info(...logArguments(message, context)),
  warn: (message, context) => console.warn(...logArguments(message, context)),
  error: (message, context) => console.error(...logArguments(message, context)),
};
