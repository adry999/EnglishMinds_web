export type SiteEnv = 'production' | 'staging' | 'preview' | 'development';

export function siteEnv(raw: string | undefined): SiteEnv {
  return raw === 'production' || raw === 'staging' || raw === 'preview' ? raw : 'development';
}

/** Staging and the client preview must never be indexed; local and CI builds stay indexable so the dist checks describe production. */
export function isIndexable(env: SiteEnv): boolean {
  return env !== 'staging' && env !== 'preview';
}

/** The preview is a static demo with no API behind it, so the lead form must not try to submit. */
export function leadSubmissionEnabled(env: SiteEnv): boolean {
  return env !== 'preview';
}
