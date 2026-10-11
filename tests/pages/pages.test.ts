import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const dist = resolve(import.meta.dirname, '../../dist');
const PAGES = ['index.html', 'grupe/index.html', 'metoda-cambridge/index.html', 'tabere/index.html', 'blog/index.html', '404.html'];

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

  it('ships optimized images, not the original jpgs', () => {
    expect(read('index.html')).toMatch(/type="image\/avif"/);
    const home = read('index.html');
    expect(home).not.toMatch(/src="[^"]*ema-reading\.jpg"/);
    for (const img of home.match(/<img[^>]*>/g) ?? []) expect(img).toMatch(/srcset="[^"]*\.\w+ \d+w/);
  });
});
