import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSiteOnSameDrive } from '../support/astro-build';

let outDir = '';

beforeAll(() => {
  outDir = buildSiteOnSameDrive('staging', { SITE_ENV: 'staging' });
}, 300_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe('staging build', () => {
  it('asks crawlers to stay away and lists no sitemap', () => {
    expect(readFileSync(join(outDir, 'robots.txt'), 'utf8')).toBe('User-agent: *\nDisallow: /\n');
  });

  it.each(['index.html', 'grupe/index.html', 'lectie-demo/index.html', 'cookies/index.html'])('%s is noindex', (page) => {
    expect(readFileSync(join(outDir, page), 'utf8')).toContain('<meta name="robots" content="noindex"');
  });
});
