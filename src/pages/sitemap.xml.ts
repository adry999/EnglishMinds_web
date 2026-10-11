import type { APIRoute } from 'astro';
import { getPublishedPosts } from '@features/blog';
import { site } from '@shared/content/site';
import { STATIC_ROUTES, renderSitemap } from '@shared/seo/sitemap';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const entries = [
    ...STATIC_ROUTES.map((path) => ({ path })),
    ...posts.map((post) => ({ path: `/blog/${post.id}/`, lastmod: post.data.publishedAt })),
  ];
  return new Response(renderSitemap(entries, site.url), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
