import type { APIRoute } from 'astro';
import { getPublishedPosts, lastModified } from '@features/blog';
import { site } from '@shared/content/site';
import { withBase } from '@shared/lib/with-base';
import { siteRootUrl } from '@shared/seo/page-meta';
import { STATIC_ROUTES, renderSitemap } from '@shared/seo/sitemap';

export const GET: APIRoute = async ({ site: astroSite }) => {
  const posts = await getPublishedPosts();
  const entries = [
    ...STATIC_ROUTES.map((path) => ({ path: withBase(path) })),
    ...posts.map((post) => ({ path: withBase(`/blog/${post.id}/`), lastmod: lastModified(post.data) })),
  ];
  return new Response(renderSitemap(entries, siteRootUrl(astroSite, site.url, import.meta.env.BASE_URL)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
