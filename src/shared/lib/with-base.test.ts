import { describe, expect, it } from 'vitest';
import { joinBase } from './with-base';

describe('joinBase', () => {
  it('leaves paths untouched when the site is served from the root', () => {
    expect(joinBase('/grupe/', '/')).toBe('/grupe/');
    expect(joinBase('/', '/')).toBe('/');
  });

  it('prefixes root-absolute paths with the base, with exactly one slash between', () => {
    expect(joinBase('/grupe/', '/EnglishMinds_web')).toBe('/EnglishMinds_web/grupe/');
    expect(joinBase('/grupe/', '/EnglishMinds_web/')).toBe('/EnglishMinds_web/grupe/');
    expect(joinBase('/', '/EnglishMinds_web')).toBe('/EnglishMinds_web/');
    expect(joinBase('/', '/EnglishMinds_web/')).toBe('/EnglishMinds_web/');
  });

  it('keeps the query string and the fragment', () => {
    expect(joinBase('/lectie-demo/?grupa=a1', '/EnglishMinds_web')).toBe('/EnglishMinds_web/lectie-demo/?grupa=a1');
    expect(joinBase('/grupe/#a1', '/EnglishMinds_web')).toBe('/EnglishMinds_web/grupe/#a1');
  });

  it('returns external, fragment and relative values unchanged', () => {
    for (const value of ['https://wa.me/1', 'http://x.ro/', 'mailto:a@b.ro', 'tel:+40722', '#contact', '//cdn.x.ro/a.js', 'grupe/']) {
      expect(joinBase(value, '/EnglishMinds_web')).toBe(value);
    }
  });
});
