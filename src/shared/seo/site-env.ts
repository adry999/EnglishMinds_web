export type SiteEnv = 'production' | 'staging' | 'development';

export function siteEnv(raw: string | undefined): SiteEnv {
  return raw === 'production' || raw === 'staging' ? raw : 'development';
}

/** Staging must never be indexed; local and CI builds stay indexable so the dist checks describe production. */
export function isIndexable(env: SiteEnv): boolean {
  return env !== 'staging';
}
