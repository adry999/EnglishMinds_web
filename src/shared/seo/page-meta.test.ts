import { describe, expect, it } from 'vitest';
import { canonicalUrl, fullTitle, ogImageSize } from './page-meta';

describe('canonicalUrl', () => {
  it('joins the base and the path with a trailing slash', () => {
    expect(canonicalUrl('/grupe/', 'https://englishminds.ro')).toBe('https://englishminds.ro/grupe/');
    expect(canonicalUrl('/grupe', 'https://englishminds.ro')).toBe('https://englishminds.ro/grupe/');
    expect(canonicalUrl('/', 'https://englishminds.ro/')).toBe('https://englishminds.ro/');
  });

  it('keeps file routes without a trailing slash', () => {
    expect(canonicalUrl('/404.html', 'https://englishminds.ro')).toBe('https://englishminds.ro/404.html');
  });

  it('drops query and hash', () => {
    expect(canonicalUrl('/blog/?categorie=sfaturi#x', 'https://englishminds.ro')).toBe('https://englishminds.ro/blog/');
  });
});

describe('fullTitle', () => {
  it('appends the site name except on the home title', () => {
    expect(fullTitle('Grupe', 'English Minds Academy')).toBe('Grupe · English Minds Academy');
    expect(fullTitle('English Minds Academy', 'English Minds Academy')).toBe('English Minds Academy');
  });
});

describe('ogImageSize', () => {
  it('uses 1200x630 when the source is large enough', () => {
    expect(ogImageSize({ width: 4000, height: 3000 })).toEqual({ width: 1200, height: 630 });
  });

  it('scales down to a narrow source, keeping 1.91:1', () => {
    expect(ogImageSize({ width: 640, height: 1136 })).toEqual({ width: 640, height: 336 });
  });

  it('scales down to a short source', () => {
    expect(ogImageSize({ width: 900, height: 400 })).toEqual({ width: 761, height: 400 });
  });
});
