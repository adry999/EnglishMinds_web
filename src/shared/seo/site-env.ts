export type SiteEnv = 'production' | 'staging' | 'preview' | 'development';

export function siteEnv(raw: string | undefined): SiteEnv {
  return raw === 'production' || raw === 'staging' || raw === 'preview' ? raw : 'development';
}

export function isIndexable(env: SiteEnv): boolean {
  return env !== 'staging' && env !== 'preview';
}

export function leadSubmissionEnabled(env: SiteEnv): boolean {
  return env !== 'preview';
}
