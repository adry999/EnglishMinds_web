import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, renderRobots, renderSitemap } from './sitemap';

describe('renderSitemap', () => {
  it('lists absolute urls with trailing slashes and optional lastmod', () => {
    const xml = renderSitemap(
      [{ path: '/' }, { path: '/blog/a&b/', lastmod: new Date('2026-09-01T10:00:00Z') }],
      'https://englishminds.ro',
    );
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(xml).toContain('<url><loc>https://englishminds.ro/</loc></url>');
    expect(xml).toContain('<url><loc>https://englishminds.ro/blog/a&amp;b/</loc><lastmod>2026-09-01</lastmod></url>');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });
});

describe('renderRobots', () => {
  it('points at the sitemap under the base path of the site', () => {
    expect(renderRobots('https://adry999.github.io/EnglishMinds_web/', true)).toContain('Sitemap: https://adry999.github.io/EnglishMinds_web/sitemap.xml');
  });

  it('allows everything and points to the sitemap', () => {
    expect(renderRobots('https://englishminds.ro', true)).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://englishminds.ro/sitemap.xml\n',
    );
  });

  it('blocks every crawler on a non-indexable build and omits the sitemap', () => {
    expect(renderRobots('https://englishminds.ro', false)).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('STATIC_ROUTES', () => {
  it('covers every indexable page and never the 404', () => {
    expect(STATIC_ROUTES).toEqual([
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
    ]);
  });
});
