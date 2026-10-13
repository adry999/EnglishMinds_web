import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';

const dist = resolve(import.meta.dirname, '../../dist');
const PAGES = ['index.html', 'grupe/index.html', 'metoda-cambridge/index.html', 'tabere/index.html', 'test-de-nivel/index.html', 'lectie-demo/index.html', 'blog/index.html', 'confidentialitate/index.html', 'cookies/index.html', 'termeni/index.html', '404.html'];

const PRELOADED_FACES = (4 + 1) * 2;

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

  it.each(PAGES)('%s preloads every font face, so no late swap shifts the layout', (page) => {
    const html = read(page);
    expect(html.match(/<link rel="preload"[^>]*as="font"/g)).toHaveLength(PRELOADED_FACES);
    const declared = new Set([...html.matchAll(/@font-face\{[^}]*font-weight:(\d+)/g)].map((match) => match[1]));
    for (const weight of ['600', '700', '800', '900']) expect(declared).toContain(weight);
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
    'confidentialitate/index.html': '/confidentialitate/',
    'cookies/index.html': '/cookies/',
    'termeni/index.html': '/termeni/',
  };

  it.each(Object.entries(ROUTE))('%s has an absolute canonical and Open Graph tags', async (page, route) => {
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
    const file = join(dist, image.replace('https://englishminds.ro/', ''));
    const { width, height } = await sharp(file).metadata();
    expect(html).toContain(`<meta property="og:image:width" content="${width}"`);
    expect(html).toContain(`<meta property="og:image:height" content="${height}"`);
  });

  it.each(PAGES.filter((page) => page !== '404.html'))('%s identifies the company and links the ANPC SAL platform in the footer', (page) => {
    const html = read(page);
    expect(html).toContain('class="site-footer__company"');
    expect(html).toContain('Nr. Reg. Com.');
    expect(html).toMatch(/<a href="mailto:[^"]+">/);
    expect(html).toMatch(/<a class="site-footer__anpc" href="https:\/\/reclamatiisal\.anpc\.ro\/" target="_blank" rel="noopener noreferrer">/);
  });

  it('terms page has the offer conditions section that every offer links to', () => {
    expect(read('termeni/index.html')).toContain('id="oferte"');
    for (const page of ['index.html', 'grupe/index.html', 'lectie-demo/index.html']) {
      expect(read(page)).toContain('href="/termeni/#oferte"');
    }
  });

  it('shows the VAT note next to the course and camp prices', () => {
    expect(read('grupe/index.html')).toContain('class="vat-note"');
    expect(read('tabere/index.html')).toContain('class="vat-note"');
  });

  it('keeps the 404 page out of search results', () => {
    expect(read('404.html')).toContain('<meta name="robots" content="noindex"');
  });

  it('gives the 404 page no canonical and no og:url', () => {
    const html = read('404.html');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('og:url');
  });

  it('ships optimized images, not the original jpgs', () => {
    const home = read('index.html');
    expect(home).toMatch(/type="image\/avif"/);
    expect(home).not.toMatch(/src="[^"]*ema-reading\.jpg"/);
    for (const img of home.match(/<img[^>]*>/g) ?? []) expect(img).toMatch(/srcset="[^"]*\.\w+ \d+w/);
  });

  const jsonLdBlocks = (html: string): unknown[] =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1] ?? ''));

  it('home describes the organization and the FAQ', () => {
    const types = jsonLdBlocks(read('index.html')).map((block) => (block as { '@type': unknown })['@type']);
    expect(types).toContainEqual(['EducationalOrganization', 'LocalBusiness']);
    expect(types).toContain('FAQPage');
  });

  it('the sitemap lists every built page except the 404, and every published article', () => {
    const xml = read('sitemap.xml');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const built = readdirSync(dist, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('index.html'))
      .map((file) => `https://englishminds.ro/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}`);
    expect([...locs].sort()).toEqual([...built].sort());
    expect(xml).not.toContain('404');
  });

  it('every internal link on every page points to a built file', () => {
    const htmlFiles = readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.html'));
    const missing: string[] = [];
    for (const file of htmlFiles) {
      for (const [, href] of read(file).matchAll(/<a[^>]*\shref="(\/[^"#?]*)/g)) {
        const target = href?.endsWith('/') ? join(dist, href, 'index.html') : join(dist, href ?? '');
        if (!existsSync(target)) missing.push(`${file} → ${href}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the cookie policy shows the cookie table', () => {
    const html = read('cookies/index.html');
    for (const name of ['em_consent', '_ga', '_fbp', '_fbc', '_gcl_']) expect(html).toContain(name);
  });

  it('robots.txt points to the sitemap', () => {
    expect(read('robots.txt')).toContain('Sitemap: https://englishminds.ro/sitemap.xml');
  });

  it('every published article has a valid BlogPosting', () => {
    const posts = readdirSync(join(dist, 'blog')).filter((entry) => statSync(join(dist, 'blog', entry)).isDirectory());
    for (const slug of posts) {
      const [block] = jsonLdBlocks(read(`blog/${slug}/index.html`)) as { '@type': string; url: string; image: string }[];
      expect(block?.['@type']).toBe('BlogPosting');
      expect(block?.url).toBe(`https://englishminds.ro/blog/${slug}/`);
      expect(block?.image).toMatch(/^https:\/\/englishminds\.ro\/_astro\/.+\.jpg$/);
    }
  });

  const SEO_PAGES = ['index.html', 'grupe/index.html', 'metoda-cambridge/index.html', 'test-de-nivel/index.html', 'tabere/index.html', 'blog/index.html', 'lectie-demo/index.html'];

  it('main pages have a title up to 65 characters and a unique 120-160 character description', () => {
    const descriptions = new Set<string>();
    for (const page of SEO_PAGES) {
      const html = read(page);
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
      const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
      expect(title.length, `${page} title: ${title}`).toBeLessThanOrEqual(65);
      expect(title).toContain('English Minds Academy');
      expect(description.length, `${page} description: ${description}`).toBeGreaterThanOrEqual(120);
      expect(description.length, `${page} description: ${description}`).toBeLessThanOrEqual(160);
      descriptions.add(description);
    }
    expect(descriptions.size).toBe(SEO_PAGES.length);
  });

  it('every inner page has a BreadcrumbList starting at Acasa with absolute urls', () => {
    for (const page of SEO_PAGES.filter((p) => p !== 'index.html').concat(['cookies/index.html', 'termeni/index.html', 'confidentialitate/index.html'])) {
      const crumbs = jsonLdBlocks(read(page)).find((b) => (b as { '@type': string })['@type'] === 'BreadcrumbList') as
        | { itemListElement: { position: number; name: string; item: string }[] }
        | undefined;
      expect(crumbs, page).toBeDefined();
      expect(crumbs?.itemListElement[0]).toEqual({ '@type': 'ListItem', position: 1, name: 'Acasă', item: 'https://englishminds.ro/' });
      for (const entry of crumbs?.itemListElement ?? []) expect(entry.item).toMatch(/^https:\/\/englishminds\.ro\//);
    }
    expect(jsonLdBlocks(read('index.html')).some((b) => (b as { '@type': string })['@type'] === 'BreadcrumbList')).toBe(false);
  });

  it('the groups page describes the five levels as Courses with no offers', () => {
    const courses = jsonLdBlocks(read('grupe/index.html')).filter((b) => (b as { '@type': string })['@type'] === 'Course') as {
      url: string;
      typicalAgeRange: string;
      offers?: unknown;
    }[];
    expect(courses.map((c) => c.url.split('#')[1])).toEqual(['starters', 'pre-a1', 'movers', 'flyers', 'a2-key']);
    expect(courses.map((c) => c.typicalAgeRange)).toEqual(['5-6', '7-8', '9-10', '11-12', '13-14']);
    for (const course of courses) expect(course.offers).toBeUndefined();
  });

  it.each(PAGES)('%s ships no TODO placeholder in its structured data', (page) => {
    for (const block of jsonLdBlocks(read(page))) expect(JSON.stringify(block)).not.toContain('TODO');
  });

  it('home ships the organization with a logo and no empty FAQ', () => {
    const org = jsonLdBlocks(read('index.html')).find((b) => Array.isArray((b as { '@type': unknown })['@type'])) as { logo: string; areaServed: string };
    expect(org.logo).toMatch(/^https:\/\/englishminds\.ro\/_astro\/.+\.jpg$/);
    expect(org.areaServed).toBe('Cluj-Napoca');
  });

  it.each(PAGES)('%s renders no search engine verification tag while the tokens are empty', (page) => {
    const html = read(page);
    expect(html).not.toContain('google-site-verification');
    expect(html).not.toContain('msvalidate.01');
  });

  it('blog posts link to the level test and the demo lesson', () => {
    const posts = readdirSync(join(dist, 'blog')).filter((entry) => statSync(join(dist, 'blog', entry)).isDirectory());
    for (const slug of posts) {
      const html = read(`blog/${slug}/index.html`);
      expect(html).toContain('href="/test-de-nivel/"');
      expect(html).toContain('href="/lectie-demo/"');
    }
  });

  it('ships the Apache config with the 404 page, HTTPS redirect and security headers, and never rewrites /api', () => {
    const htaccess = read('.htaccess');
    expect(htaccess).toContain('ErrorDocument 404 /404.html');
    expect(htaccess).toContain('Options -Indexes');
    expect(htaccess).toMatch(/RewriteRule \^ https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\} \[L,R=301\]/);
    for (const header of ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options']) {
      expect(htaccess).toContain(header);
    }
    expect(htaccess).not.toMatch(/RewriteRule\s+\^?\/?api/);
  });
});
