import type { Clock, LeadRepository, Logger, RateLimiter } from '../leads/ports';

export function leadCutoff(now: Date): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  return cutoff;
}

export function rateLimitCutoff(now: Date): Date {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

export type PurgeDeps = {
  readonly repository: LeadRepository;
  readonly rateLimiter: RateLimiter;
  readonly clock: Clock;
  readonly logger: Logger;
};

export async function purgeExpired(deps: PurgeDeps): Promise<{ leads: number; rateLimits: number }> {
  const now = deps.clock.now();
  const leads = await deps.repository.deleteCreatedBefore(leadCutoff(now));
  const rateLimits = await deps.rateLimiter.deleteWindowsBefore(rateLimitCutoff(now));
  deps.logger.info('[purge] expired data deleted', { leads, rateLimits });
  return { leads, rateLimits };
}
