export type Utm = {
  readonly source: string | null;
  readonly medium: string | null;
  readonly campaign: string | null;
};

export const EMPTY_UTM: Utm = Object.freeze({ source: null, medium: null, campaign: null });
export const UTM_STORAGE_KEY = 'em-utm';

const KEYS = ['source', 'medium', 'campaign'] as const;

const clean = (value: string | null): string | null => {
  const trimmed = value?.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').trim().slice(0, 100) ?? '';
  return trimmed === '' ? null : trimmed;
};

const hasAny = (utm: Utm): boolean => KEYS.some((key) => utm[key] !== null);

export function parseUtm(search: string): Utm | null {
  const params = new URLSearchParams(search);
  const utm: Utm = {
    source: clean(params.get('utm_source')),
    medium: clean(params.get('utm_medium')),
    campaign: clean(params.get('utm_campaign')),
  };
  return hasAny(utm) ? utm : null;
}

export function parseStoredUtm(raw: string | null): Utm | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const read = (key: (typeof KEYS)[number]): string | null | undefined => {
    const value = record[key];
    if (value === null) return null;
    return typeof value === 'string' ? clean(value) : undefined;
  };
  const source = read('source');
  const medium = read('medium');
  const campaign = read('campaign');
  if (source === undefined || medium === undefined || campaign === undefined) return null;
  const utm: Utm = { source, medium, campaign };
  return hasAny(utm) ? utm : null;
}
