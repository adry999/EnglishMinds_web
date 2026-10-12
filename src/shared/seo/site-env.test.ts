import { describe, expect, it } from 'vitest';
import { isIndexable, leadSubmissionEnabled, siteEnv } from './site-env';

describe('siteEnv', () => {
  it('recognises production and staging and defaults to development', () => {
    expect(siteEnv('production')).toBe('production');
    expect(siteEnv('staging')).toBe('staging');
    expect(siteEnv('preview')).toBe('preview');
    expect(siteEnv(undefined)).toBe('development');
    expect(siteEnv('')).toBe('development');
    expect(siteEnv('Production')).toBe('development');
  });
});

describe('isIndexable', () => {
  it('hides staging and preview from search engines', () => {
    expect(isIndexable('preview')).toBe(false);
    expect(isIndexable('production')).toBe(true);
    expect(isIndexable('development')).toBe(true);
    expect(isIndexable('staging')).toBe(false);
  });
});

describe('leadSubmissionEnabled', () => {
  it('turns lead submission off only on the preview', () => {
    expect(leadSubmissionEnabled('preview')).toBe(false);
    expect(leadSubmissionEnabled('production')).toBe(true);
    expect(leadSubmissionEnabled('staging')).toBe(true);
    expect(leadSubmissionEnabled('development')).toBe(true);
  });
});
