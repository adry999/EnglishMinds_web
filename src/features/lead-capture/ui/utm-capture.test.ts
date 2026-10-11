// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { captureUtm } from './utm-capture';

describe('captureUtm', () => {
  it('stores UTM from the address for the rest of the visit', () => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/?utm_source=meta&utm_medium=paid');
    captureUtm();
    expect(JSON.parse(sessionStorage.getItem('em-utm') ?? 'null')).toEqual({ source: 'meta', medium: 'paid', campaign: null });
  });

  it('keeps the stored UTM when the address has none', () => {
    sessionStorage.setItem('em-utm', '{"source":"meta","medium":null,"campaign":null}');
    window.history.replaceState({}, '', '/grupe/');
    captureUtm();
    expect(sessionStorage.getItem('em-utm')).toBe('{"source":"meta","medium":null,"campaign":null}');
  });
});
