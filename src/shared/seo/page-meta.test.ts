import { describe, expect, it } from 'vitest';
import { canonicalUrl, fullTitle } from './page-meta';

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
