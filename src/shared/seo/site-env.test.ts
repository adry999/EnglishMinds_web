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
  it('is false for staging', () => {
    expect(isIndexable('staging')).toBe(false);
  });

  it('is false for the client preview', () => {
    expect(isIndexable('preview')).toBe(false);
  });

  it('is true for production', () => {
    expect(isIndexable('production')).toBe(true);
  });

  it('keeps local and CI builds indexable so the dist checks describe production', () => {
    expect(isIndexable('development')).toBe(true);
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
