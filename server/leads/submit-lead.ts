import { MIN_ELAPSED_MS, validateLead, type LeadField } from '@shared/contracts/lead.schema';
import { GLOBAL_RATE_KEY } from './rate-limit';
import type { Clock, LeadDispatcher, LeadRecord, LeadRepository, Logger, RateLimiter } from './ports';
import { safeError } from './safe-error';

export type SubmitLeadDeps = {
  readonly repository: LeadRepository;
  readonly rateLimiter: RateLimiter;
  readonly dispatcher: LeadDispatcher;
  readonly clock: Clock;
  readonly logger: Logger;
  readonly hashIp: (ip: string) => string;
  /** Leads per hour across all visitors. */
  readonly globalHourlyCap?: number;
};

export const DEFAULT_GLOBAL_HOURLY_CAP = 60;

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
    if (clientIp === null) {
      // Unknown visitor address: do not pool every visitor into one small bucket. Only the site-wide cap applies.
      deps.logger.warn('[lead] client address unknown; only the site-wide limit applies', { source: record.source });
    } else if (!(await deps.rateLimiter.hit(deps.hashIp(clientIp), now))) {
      deps.logger.warn('[lead] rate limited', { source: record.source });
      return { status: 429 };
    }
    if (!(await deps.rateLimiter.hit(GLOBAL_RATE_KEY, now, deps.globalHourlyCap ?? DEFAULT_GLOBAL_HOURLY_CAP))) {
      deps.logger.warn('[lead] site-wide hourly limit reached', { source: record.source });
      return { status: 429 };
    }
    id = await deps.repository.save(record);
  } catch (error) {
    deps.logger.error('[lead] could not save lead', { source: record.source, ...safeError(error) });
    return { status: 500 };
  }

  // Best effort: slow or failing channels must not delay or fail the response. Unnotified leads are retried by the cron job.
  void notifyAndRecord(id, record, deps);
  deps.logger.info('[lead] saved', { source: record.source });
  return { status: 201 };
}

async function notifyAndRecord(id: number, record: LeadRecord, deps: SubmitLeadDeps): Promise<void> {
  try {
    const delivered = await deps.dispatcher.dispatch(record);
    await deps.repository.recordNotifyAttempt(id, delivered, deps.clock.now());
  } catch (error) {
    deps.logger.warn('[lead] could not record the notification state', { source: record.source, ...safeError(error) });
  }
}
