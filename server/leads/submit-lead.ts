import { validateLead, type LeadField } from '@shared/contracts/lead.schema';
import type { Clock, LeadNotifier, LeadRecord, LeadRepository, Logger, RateLimiter } from './ports';
import { safeError } from './safe-error';

export const MIN_ELAPSED_MS = 3000;

export type SubmitLeadDeps = {
  readonly repository: LeadRepository;
  readonly rateLimiter: RateLimiter;
  readonly notifier: LeadNotifier;
  readonly clock: Clock;
  readonly logger: Logger;
  readonly hashIp: (ip: string) => string;
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
  try {
    const allowed = await deps.rateLimiter.hit(deps.hashIp(clientIp ?? 'unknown'), now);
    if (!allowed) {
      deps.logger.warn('[lead] rate limited', { source: record.source });
      return { status: 429 };
    }
    await deps.repository.save(record);
  } catch (error) {
    deps.logger.error('[lead] could not save lead', { source: record.source, ...safeError(error) });
    return { status: 500 };
  }

  // Best effort: a slow or failing mail server must not delay or fail the response.
  void deps.notifier.notify(record).catch((error: unknown) => {
    deps.logger.warn('[lead] notification failed; lead is saved', { source: record.source, ...safeError(error) });
  });
  deps.logger.info('[lead] saved', { source: record.source });
  return { status: 201 };
}
