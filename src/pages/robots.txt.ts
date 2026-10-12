import type { APIRoute } from 'astro';
import { site } from '@shared/content/site';
import { isIndexable, siteEnv } from '@shared/seo/site-env';
import { siteRootUrl } from '@shared/seo/page-meta';
import { renderRobots } from '@shared/seo/sitemap';

export const GET: APIRoute = ({ site: astroSite }) =>
  new Response(renderRobots(siteRootUrl(astroSite, site.url, import.meta.env.BASE_URL), isIndexable(siteEnv(import.meta.env.SITE_ENV))), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
