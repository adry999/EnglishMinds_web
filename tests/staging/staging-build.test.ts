import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let outDir = '';

beforeAll(() => {
  // Inside the project: Astro renames files out of .astro/, which fails across drives (EXDEV) for an OS temp dir.
  const parent = join(process.cwd(), 'node_modules', '.cache');
  mkdirSync(parent, { recursive: true });
  outDir = mkdtempSync(join(parent, 'em-staging-'));
  execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir], {
    env: { ...process.env, SITE_ENV: 'staging' },
    stdio: 'inherit',
  });
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
