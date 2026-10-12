import type { APIRoute } from 'astro';
import { site } from '@shared/content/site';
import { isIndexable, siteEnv } from '@shared/seo/site-env';
import { renderRobots } from '@shared/seo/sitemap';

export const GET: APIRoute = () =>
  new Response(renderRobots(site.url, isIndexable(siteEnv(import.meta.env.SITE_ENV))), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
