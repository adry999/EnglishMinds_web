import type { Lead } from '@shared/contracts/lead.schema';

export type LeadRecord = Lead & { readonly consentAt: Date; readonly createdAt: Date };

export interface LeadRepository {
  save(record: LeadRecord): Promise<void>;
  deleteCreatedBefore(cutoff: Date): Promise<number>;
}

export interface RateLimiter {
  /** Numără o încercare; întoarce `false` dacă limita ferestrei curente e depășită. */
  hit(key: string, now: Date): Promise<boolean>;
  deleteWindowsBefore(cutoff: Date): Promise<number>;
}

export interface LeadNotifier {
  notify(record: LeadRecord): Promise<void>;
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
