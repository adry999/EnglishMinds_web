import { MIN_ELAPSED_MS, validateLead, type LeadField } from '@shared/contracts/lead.schema';
import { GLOBAL_RATE_KEY } from './rate-limit';
import type { Clock, LeadDispatcher, LeadRecord, LeadRepository, Logger, RateLimiter } from './ports';
import { errorFieldsWithoutMessage } from './error-fields';

export type SubmitLeadDeps = {
  readonly repository: LeadRepository;
  readonly rateLimiter: RateLimiter;
  readonly dispatcher: LeadDispatcher;
  readonly clock: Clock;
  readonly logger: Logger;
  readonly hashIp: (ip: string) => string;
  readonly globalHourlyCap: number;
};

export type SubmitLeadOutcome =
  | { readonly status: 201 }
  | { readonly status: 400; readonly fields: LeadField[] }
  | { readonly status: 429 }
  | { readonly status: 500 };

export function isLikelyBot(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const { website, elapsedMs } = body as Record<string, unknown>;
  if (typeof website === 'string' && website.trim() !== '') return true;
  return typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < MIN_ELAPSED_MS;
}

export async function submitLead(body: unknown, clientIp: string | null, deps: SubmitLeadDeps): Promise<SubmitLeadOutcome> {
  if (isLikelyBot(body)) {
    deps.logger.info('[lead] filtered as automated submission');
    return { status: 201 };
  }
  const validation = validateLead(body);
  if (!validation.ok) return { status: 400, fields: validation.fields };

  const now = deps.clock.now();
  const record: LeadRecord = { ...validation.lead, consentAt: now, createdAt: now };
  let id: number;
  try {
    if (!(await visitorWithinLimit(clientIp, record, now, deps))) {
      deps.logger.warn('[lead] rate limited', { source: record.source });
      return { status: 429 };
    }
    if (!(await deps.rateLimiter.hit(GLOBAL_RATE_KEY, now, deps.globalHourlyCap))) {
      deps.logger.warn('[lead] site-wide hourly limit reached', { source: record.source });
      return { status: 429 };
    }
    id = await deps.repository.save(record);
  } catch (error) {
    deps.logger.error('[lead] could not save lead', { source: record.source, ...errorFieldsWithoutMessage(error) });
    return { status: 500 };
  }

  void notifyInBackground(id, record, deps);
  deps.logger.info('[lead] saved', { source: record.source });
  return { status: 201 };
}

async function visitorWithinLimit(clientIp: string | null, record: LeadRecord, now: Date, deps: SubmitLeadDeps): Promise<boolean> {
  if (clientIp === null) {
    deps.logger.warn('[lead] client address unknown; only the site-wide limit applies', { source: record.source });
    return true;
  }
  return deps.rateLimiter.hit(deps.hashIp(clientIp), now);
}

async function notifyInBackground(id: number, record: LeadRecord, deps: SubmitLeadDeps): Promise<void> {
  try {
    const delivered = await deps.dispatcher.dispatch(record);
    await deps.repository.recordNotifyAttempt(id, delivered, deps.clock.now());
  } catch (error) {
    deps.logger.warn('[lead] could not record the notification state', { source: record.source, ...errorFieldsWithoutMessage(error) });
  }
}
