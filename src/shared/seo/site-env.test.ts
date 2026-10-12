import { describe, expect, it } from 'vitest';
import { isIndexable, siteEnv } from './site-env';

describe('siteEnv', () => {
  it('recognises production and staging and defaults to development', () => {
    expect(siteEnv('production')).toBe('production');
    expect(siteEnv('staging')).toBe('staging');
    expect(siteEnv(undefined)).toBe('development');
    expect(siteEnv('')).toBe('development');
    expect(siteEnv('Production')).toBe('development');
  });
});

describe('isIndexable', () => {
  it('hides only staging from search engines', () => {
    expect(isIndexable('production')).toBe(true);
    expect(isIndexable('development')).toBe(true);
    expect(isIndexable('staging')).toBe(false);
  });
});
