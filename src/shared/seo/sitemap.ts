import { canonicalUrl } from './page-meta';

export type SitemapEntry = {
  readonly path: string;
  readonly lastmod?: Date;
};

/** Every indexable page that is not generated from content. Keep in sync with src/pages. */
export const STATIC_ROUTES = [
  '/',
  '/grupe/',
  '/metoda-cambridge/',
  '/test-de-nivel/',
  '/lectie-demo/',
  '/tabere/',
  '/blog/',
  '/confidentialitate/',
  '/cookies/',
  '/termeni/',
] as const;

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function renderSitemap(entries: readonly SitemapEntry[], base: string): string {
  const urls = entries.map((entry) => {
    const loc = `<loc>${escapeXml(canonicalUrl(entry.path, base))}</loc>`;
    const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>` : '';
    return `<url>${loc}${lastmod}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function renderRobots(base: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', base).href}\n`;
}
