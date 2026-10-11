import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const dist = resolve(import.meta.dirname, '../../dist');
const PAGES = ['index.html', 'grupe/index.html', 'metoda-cambridge/index.html', 'tabere/index.html', 'test-de-nivel/index.html', 'lectie-demo/index.html', 'blog/index.html', '404.html'];

const read = (page: string) => readFileSync(join(dist, page), 'utf8');

describe('built pages', () => {
  beforeAll(() => {
    if (!existsSync(dist)) throw new Error('dist/ is missing: run "npm run build" before "npm run test:dist".');
  });

  it.each(PAGES)('%s exists with lang="ro", one h1, a title and a description', (page) => {
    const html = read(page);
    expect(html).toContain('<html lang="ro"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain('id="continut"');
  });

  it.each(PAGES)('%s has alt text on every image', (page) => {
    for (const img of read(page).match(/<img[^>]*>/g) ?? []) expect(img).toMatch(/\salt(=|\s|>)/);
  });

  it('home links every level to its anchor on the groups page, and each anchor exists', () => {
    const home = read('index.html');
    const grupe = read('grupe/index.html');
    for (const slug of ['starters', 'pre-a1', 'movers', 'flyers', 'a2-key']) {
      expect(home).toContain(`href="/grupe/#${slug}"`);
      expect(grupe).toContain(`id="${slug}"`);
    }
  });

  it('level test page ships the element, the WhatsApp fallback and the active nav link', () => {
    const html = read('test-de-nivel/index.html');
    expect(html).toContain('<level-test');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toMatch(/<a[^>]*href="\/test-de-nivel\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/test-de-nivel\/"/);
  });

  it('every lead form page ships its form with the right source', () => {
    expect(read('index.html')).toMatch(/<lead-form[^>]*data-source="home"/);
    expect(read('lectie-demo/index.html')).toMatch(/<lead-form[^>]*data-source="landing"/);
    expect(read('test-de-nivel/index.html')).toMatch(/<lead-form[^>]*data-source="test"[^>]*hidden|<lead-form[^>]*hidden[^>]*data-source="test"/);
  });

  it('the landing page has no main navigation and keeps the header phone and the band WhatsApp', () => {
    const html = read('lectie-demo/index.html');
    expect(html).not.toContain('site-header__nav');
    expect(html).toMatch(/<a[^>]*class="landing-header__phone"[^>]*href="tel:\+40775630680"|<a[^>]*href="tel:\+40775630680"[^>]*class="landing-header__phone"/);
    const band = html.slice(html.indexOf('landing-band'));
    expect(band).toContain('href="https://wa.me/40775630680"');
  });

  it('the home and landing forms are visible from the start', () => {
    for (const page of ['index.html', 'lectie-demo/index.html']) {
      expect(read(page).match(/<lead-form[^>]*>/)?.[0]).not.toMatch(/\shidden/);
    }
  });

  it('blog shows the empty state and publishes no draft posts', () => {
    expect(read('blog/index.html')).toContain('Primele articole apar în curând.');
    const subfolders = readdirSync(join(dist, 'blog')).filter((name) => statSync(join(dist, 'blog', name)).isDirectory());
    expect(subfolders).toEqual([]);
  });

  it.each(PAGES)('%s sends consent defaults (all denied) before any other script', (page) => {
    const html = read(page);
    const head = html.slice(0, html.indexOf('</head>'));
    const firstScript = head.slice(head.indexOf('<script'));
    expect(firstScript).toMatch(/^<script>window\.dataLayer=/);
    for (const signal of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
      expect(firstScript).toContain(`"${signal}":"denied"`);
    }
  });

  it.each(PAGES)('%s ships the banner but no tag script in the static HTML', (page) => {
    const html = read(page);
    expect(html).toContain('<cookie-consent');
    expect(html).toContain('data-cc="show-preferencesModal"');
    expect(html).not.toMatch(/<script[^>]*src="https:\/\/www\.googletagmanager\.com/);
    expect(html).not.toMatch(/<script[^>]*src="https:\/\/connect\.facebook\.net/);
  });

  const ROUTE: Record<string, string> = {
    'index.html': '/',
    'grupe/index.html': '/grupe/',
    'metoda-cambridge/index.html': '/metoda-cambridge/',
    'tabere/index.html': '/tabere/',
    'test-de-nivel/index.html': '/test-de-nivel/',
    'lectie-demo/index.html': '/lectie-demo/',
    'blog/index.html': '/blog/',
  };

  it.each(Object.entries(ROUTE))('%s has an absolute canonical and Open Graph tags', (page, route) => {
    const html = read(page);
    const url = `https://englishminds.ro${route}`;
    expect(html).toContain(`<link rel="canonical" href="${url}"`);
    expect(html).toContain(`<meta property="og:url" content="${url}"`);
    expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);
    expect(html).toMatch(/<meta property="og:description" content="[^"]+"/);
    expect(html).not.toContain('name="robots"');
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? '';
    expect(image).toMatch(/^https:\/\/englishminds\.ro\/_astro\/.+\.jpg$/);
    expect(existsSync(join(dist, image.replace('https://englishminds.ro/', '')))).toBe(true);
  });

  it('keeps the 404 page out of search results', () => {
    expect(read('404.html')).toContain('<meta name="robots" content="noindex"');
  });

  it('ships optimized images, not the original jpgs', () => {
    const home = read('index.html');
    expect(home).toMatch(/type="image\/avif"/);
    expect(home).not.toMatch(/src="[^"]*ema-reading\.jpg"/);
    for (const img of home.match(/<img[^>]*>/g) ?? []) expect(img).toMatch(/srcset="[^"]*\.\w+ \d+w/);
  });
});
