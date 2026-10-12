import type { SiteEnv } from '@shared/seo/site-env';

/** Drafts are shown while developing and on the client preview (so the list and the article template can be judged); never in staging or production. */
export function draftsVisible(dev: boolean, env: SiteEnv): boolean {
  return dev || env === 'preview';
}
