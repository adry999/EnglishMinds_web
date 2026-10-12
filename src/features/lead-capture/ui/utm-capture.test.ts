// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { createConsentChanged } from '@shared/contracts/domain-events';
import { captureUtm } from './utm-capture';

const STORED = '{"source":"meta","medium":null,"campaign":null}';
const stored = (): unknown => JSON.parse(sessionStorage.getItem('em-utm') ?? 'null');

beforeEach(() => {
  sessionStorage.clear();
  delete document.documentElement.dataset.consent;
});

describe('captureUtm', () => {
  it('stores nothing before the visitor has consented', () => {
    window.history.replaceState({}, '', '/?utm_source=meta&utm_medium=paid');
    captureUtm();
    expect(sessionStorage.getItem('em-utm')).toBeNull();
  });

  it('stores UTM from the address when consent was already given', () => {
    document.documentElement.dataset.consent = 'analytics';
    window.history.replaceState({}, '', '/?utm_source=meta&utm_medium=paid');
    captureUtm();
    expect(stored()).toEqual({ source: 'meta', medium: 'paid', campaign: null });
  });

  it('stores the UTM of the current address when consent to marketing arrives later', () => {
    window.history.replaceState({}, '', '/lectie-demo/?utm_source=google&utm_campaign=toamna');
    captureUtm();
    expect(sessionStorage.getItem('em-utm')).toBeNull();
    document.dispatchEvent(createConsentChanged({ analytics: false, marketing: true }));
    expect(stored()).toEqual({ source: 'google', medium: null, campaign: 'toamna' });
  });

  it('also stores for analytics alone', () => {
    window.history.replaceState({}, '', '/?utm_source=bing');
    captureUtm();
    document.dispatchEvent(createConsentChanged({ analytics: true, marketing: false }));
    expect(stored()).toEqual({ source: 'bing', medium: null, campaign: null });
  });

  it('keeps the stored UTM when the address has none', () => {
    document.documentElement.dataset.consent = 'analytics marketing';
    sessionStorage.setItem('em-utm', STORED);
    window.history.replaceState({}, '', '/grupe/');
    captureUtm();
    expect(sessionStorage.getItem('em-utm')).toBe(STORED);
  });

  it('removes what it stored when consent is withdrawn', () => {
    sessionStorage.setItem('em-utm', STORED);
    window.history.replaceState({}, '', '/');
    captureUtm();
    document.dispatchEvent(createConsentChanged({ analytics: false, marketing: false }));
    expect(sessionStorage.getItem('em-utm')).toBeNull();
  });
});
