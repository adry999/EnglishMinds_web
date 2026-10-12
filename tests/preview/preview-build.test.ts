import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BASE = '/EnglishMinds_web';
const SITE = 'https://adry999.github.io';
let outDir = '';

beforeAll(() => {
  // Inside the project: Astro renames files out of .astro/, which fails across drives (EXDEV) for an OS temp dir.
  const parent = join(process.cwd(), 'node_modules', '.cache');
  mkdirSync(parent, { recursive: true });
  outDir = mkdtempSync(join(parent, 'em-preview-'));
  // Vitest sets BASE_URL=/ in the environment, and Vite lets a BASE_URL variable override the configured base.
  const inherited = { ...process.env };
  delete inherited.BASE_URL;
  execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir], {
    env: { ...inherited, SITE_ENV: 'preview', SITE_BASE: BASE, SITE_URL: SITE },
    stdio: 'inherit',
  });
}, 300_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

const read = (file: string): string => readFileSync(join(outDir, file), 'utf8');

function filesUnder(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(path, extension);
    return entry.name.endsWith(extension) ? [path] : [];
  });
}

const outsideBase = (value: string): boolean => value.startsWith('/') && !value.startsWith('//') && !value.startsWith(`${BASE}/`);

describe('preview build', () => {
  it('serves every root-absolute link and asset under the base path', () => {
    const offenders: string[] = [];
    for (const file of filesUnder(outDir, '.html')) {
      const html = readFileSync(file, 'utf8');
      const name = relative(outDir, file).split(sep).join('/');
      for (const [, attribute, value = ''] of html.matchAll(/\s(href|src|action|content|poster|data-src)="([^"]*)"/g)) {
        if (outsideBase(value)) offenders.push(`${name} ${attribute}="${value}"`);
      }
      for (const [, value = ''] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
        for (const candidate of value.split(',')) {
          const url = candidate.trim().split(/\s+/)[0] ?? '';
          if (outsideBase(url)) offenders.push(`${name} srcset="${url}"`);
        }
      }
      for (const [, value = ''] of html.matchAll(/url\(\s*["']?([^"')\s]+)/g)) {
        if (outsideBase(value)) offenders.push(`${name} url(${value})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('prefixes the links built in scripts (cookie banner) as well', () => {
    const offenders: string[] = [];
    for (const file of filesUnder(join(outDir, '_astro'), '.js')) {
      for (const [, value = ''] of readFileSync(file, 'utf8').matchAll(/href="(\/[^"]*)"/g)) {
        if (outsideBase(value)) offenders.push(`${relative(outDir, file)} href="${value}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('prefixes the links of the Markdown pages', () => {
    expect(read('cookies/index.html')).toContain(`href="${BASE}/confidentialitate/"`);
    expect(read('confidentialitate/index.html')).toContain(`href="${BASE}/cookies/"`);
  });

  it('points the canonical, og:url and the sitemap at the Pages address', () => {
    const home = read('index.html');
    expect(home).toContain(`<link rel="canonical" href="${SITE}${BASE}/"`);
    expect(home).toContain(`property="og:url" content="${SITE}${BASE}/"`);
    expect(home).not.toContain('englishminds.ro');
    expect(read('sitemap.xml')).toContain(`<loc>${SITE}${BASE}/grupe/</loc>`);
  });

  it('asks crawlers to stay away', () => {
    expect(read('robots.txt')).toBe('User-agent: *\nDisallow: /\n');
    for (const page of ['index.html', 'grupe/index.html', 'lectie-demo/index.html', 'cookies/index.html']) {
      expect(read(page)).toContain('<meta name="robots" content="noindex"');
    }
  });

  it('marks the lead forms as demo, so they never reach the API', () => {
    expect(read('lectie-demo/index.html')).toMatch(/<lead-form[^>]*\sdata-demo/);
    expect(read('index.html')).toMatch(/<lead-form[^>]*\sdata-demo/);
  });
});
