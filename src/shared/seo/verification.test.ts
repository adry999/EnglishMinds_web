import { describe, expect, it } from 'vitest';
import { verificationMeta } from './verification';

describe('verificationMeta', () => {
  it('renders nothing while the fields are empty', () => {
    expect(verificationMeta({ googleSiteVerification: '', bingSiteVerification: '' })).toEqual([]);
  });

  it('renders the Google and Bing verification tags when set', () => {
    expect(verificationMeta({ googleSiteVerification: 'abc123_DEF-456xyz', bingSiteVerification: '0123456789ABCDEF' })).toEqual([
      { name: 'google-site-verification', content: 'abc123_DEF-456xyz' },
      { name: 'msvalidate.01', content: '0123456789ABCDEF' },
    ]);
  });

  it('renders each one on its own', () => {
    expect(verificationMeta({ googleSiteVerification: 'abc123_DEF-456xyz', bingSiteVerification: '' })).toHaveLength(1);
    expect(verificationMeta({ googleSiteVerification: '', bingSiteVerification: '0123456789ABCDEF' })).toEqual([
      { name: 'msvalidate.01', content: '0123456789ABCDEF' },
    ]);
  });

  it('drops placeholders and anything that is not a plain token', () => {
    expect(verificationMeta({ googleSiteVerification: 'TODO: codul din Search Console', bingSiteVerification: '"><script>' })).toEqual([]);
  });
});
