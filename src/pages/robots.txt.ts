import type { APIRoute } from 'astro';
import { site } from '@shared/content/site';
import { renderRobots } from '@shared/seo/sitemap';

export const GET: APIRoute = () =>
  new Response(renderRobots(site.url), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
