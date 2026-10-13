import type { SiteEnv } from '@shared/seo/site-env';

export function draftsVisible(dev: boolean, env: SiteEnv): boolean {
  return dev || env === 'preview';
}
