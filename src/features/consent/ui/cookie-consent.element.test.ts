// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "disableJavaScriptFileLoading": true, "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as CookieConsentApi from 'vanilla-cookieconsent';
import { CONSENT_CHANGED, createLeadSubmitted, type ConsentChangedDetail } from '@shared/contracts/domain-events';
import { FBEVENTS_SRC, GTAG_URL, GTM_URL } from '../model/tag-plan';

const lib = vi.hoisted(() => ({
  config: null as CookieConsentApi.CookieConsentConfig | null,
  accepted: new Set<string>(),
}));

vi.mock('vanilla-cookieconsent', () => ({
  run: vi.fn(async (config: CookieConsentApi.CookieConsentConfig) => {
    lib.config = config;
  }),
  acceptedCategory: vi.fn((name: string) => lib.accepted.has(name)),
}));

const { run } = await import('vanilla-cookieconsent');
const { defineCookieConsent } = await import('./cookie-consent.element');
const { COOKIE_REVISION } = await import('./consent-config');

const TRACKING = {
  ga4MeasurementId: 'G-ABC123XYZ',
  metaPixelId: '123456789012345',
  googleAdsId: 'AW-1234567890',
  googleAdsLeadLabel: 'AbC-dEf_123',
};

type TestWindow = Window & { dataLayer: unknown[]; gtag: (...args: unknown[]) => void; fbq?: unknown; _fbq?: unknown };
const win = window as unknown as TestWindow;

function mount(tracking: object = TRACKING): HTMLElement {
  const el = document.createElement('cookie-consent');
  el.dataset.tracking = JSON.stringify(tracking);
  document.body.append(el);
  return el;
}

const commands = () => win.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>));
const scriptSrcs = () => Array.from(document.head.querySelectorAll('script')).map((s) => s.getAttribute('src'));
const consent = () => lib.config?.onConsent?.({ cookie: {} as CookieConsentApi.CookieValue });
const change = () =>
  lib.config?.onChange?.({ cookie: {} as CookieConsentApi.CookieValue, changedCategories: [], changedServices: {} });

beforeEach(() => {
  defineCookieConsent();
  lib.config = null;
  lib.accepted.clear();
  vi.mocked(run).mockClear();
  win.dataLayer = [];
  win.gtag = (...args: unknown[]) => {
    win.dataLayer.push(args);
  };
  delete document.documentElement.dataset.consent;
  delete win.fbq;
  delete win._fbq;
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('<cookie-consent>', () => {
  it('starts the library once, in Romanian, with equal Accept/Refuz buttons', () => {
    const el = mount();
    el.remove();
    document.body.append(el);
    expect(run).toHaveBeenCalledTimes(1);
    const config = lib.config;
    expect(config?.language.default).toBe('ro');
    expect(config?.revision).toBe(COOKIE_REVISION);
    expect(config?.categories.necessary).toMatchObject({ enabled: true, readOnly: true });
    expect(Object.keys(config?.categories ?? {})).toEqual(['necessary', 'analytics', 'marketing']);
    expect(config?.guiOptions?.consentModal?.equalWeightButtons).toBe(true);
    expect(config?.guiOptions?.preferencesModal?.equalWeightButtons).toBe(true);
  });

  it('loads nothing and calls nothing after a refusal', () => {
    mount();
    consent();
    expect(scriptSrcs()).toEqual([]);
    expect(commands()).toEqual([]);
  });

  it('publishes the accepted categories for other features, as an attribute and as an event', () => {
    const seen: ConsentChangedDetail[] = [];
    document.addEventListener(CONSENT_CHANGED, (event) => seen.push((event as CustomEvent<ConsentChangedDetail>).detail), { once: false });
    mount();
    consent();
    expect(document.documentElement.dataset.consent).toBe('');
    lib.accepted = new Set(['marketing']);
    change();
    expect(document.documentElement.dataset.consent).toBe('marketing');
    lib.accepted = new Set(['analytics', 'marketing']);
    change();
    expect(document.documentElement.dataset.consent).toBe('analytics marketing');
    expect(seen).toEqual([
      { analytics: false, marketing: false },
      { analytics: false, marketing: true },
      { analytics: true, marketing: true },
    ]);
  });

  it('loads gtag.js and the pixel once on accept all, even if onChange repeats the choice', () => {
    mount();
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    change();
    expect(scriptSrcs()).toEqual([`${GTAG_URL}?id=G-ABC123XYZ`, FBEVENTS_SRC]);
    const configs = commands().filter((c) => c[0] === 'config');
    expect(configs).toEqual([
      ['config', 'G-ABC123XYZ'],
      ['config', 'AW-1234567890'],
    ]);
    const queue = (win.fbq as { queue: unknown[][] }).queue;
    expect(queue).toContainEqual(['init', '123456789012345']);
  });

  it('loads only gtag.js with analytics consent alone, with no Ads config and no Meta', () => {
    mount();
    lib.accepted = new Set(['analytics']);
    consent();
    expect(scriptSrcs()).toEqual([`${GTAG_URL}?id=G-ABC123XYZ`]);
    expect(commands().filter((c) => c[0] === 'config')).toEqual([['config', 'G-ABC123XYZ']]);
    expect(win.fbq).toBeUndefined();
    expect(win._fbq).toBeUndefined();
  });

  it('does not load Meta or define fbq with marketing consent but no pixel id', () => {
    const el = document.createElement('cookie-consent');
    el.dataset.tracking = JSON.stringify({ ...TRACKING, metaPixelId: 'TODO: ID pixel' });
    document.body.append(el);
    lib.accepted = new Set(['marketing']);
    consent();
    expect(scriptSrcs()).toEqual([`${GTAG_URL}?id=AW-1234567890`]);
    expect(win.fbq).toBeUndefined();
    expect(win._fbq).toBeUndefined();
    document.body.dispatchEvent(createLeadSubmitted({ source: 'home', ageGroup: null }));
    expect(win.fbq).toBeUndefined();
  });

  it('turns lead.submitted into GA4, Ads and Meta Lead events when everything is accepted', () => {
    const el = mount();
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    const form = document.createElement('div');
    el.after(form);
    form.dispatchEvent(createLeadSubmitted({ source: 'landing', ageGroup: null }));
    expect(commands()).toContainEqual(['event', 'generate_lead', { send_to: 'G-ABC123XYZ', lead_source: 'landing' }]);
    expect(commands()).toContainEqual(['event', 'conversion', { send_to: 'AW-1234567890/AbC-dEf_123' }]);
    expect((win.fbq as { queue: unknown[][] }).queue).toContainEqual(['track', 'Lead', { content_name: 'landing' }]);
  });

  it('never sends name, phone or email to the tags', () => {
    mount();
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    const detail = { source: 'home', ageGroup: null, name: 'Maria Popescu', phone: '0775630680', email: 'maria@example.ro' };
    document.body.dispatchEvent(new CustomEvent('lead.submitted', { detail, bubbles: true }));
    const sent = JSON.stringify([commands(), (win.fbq as { queue: unknown[][] }).queue]);
    expect(sent).toContain('generate_lead');
    expect(sent).toContain('"Lead"');
    for (const secret of ['Maria', '0775630680', 'maria@example.ro']) expect(sent).not.toContain(secret);
  });

  it('sends no Lead anywhere after a refusal', () => {
    mount();
    consent();
    document.body.dispatchEvent(createLeadSubmitted({ source: 'home', ageGroup: null }));
    expect(commands()).toEqual([]);
    expect(win.fbq).toBeUndefined();
  });

  it('stops listening once removed', () => {
    const el = mount();
    lib.accepted = new Set(['analytics']);
    consent();
    el.remove();
    win.dataLayer = [];
    document.body.dispatchEvent(createLeadSubmitted({ source: 'home', ageGroup: null }));
    expect(commands()).toEqual([]);
  });

  it('treats a missing or broken data-tracking as no ids', () => {
    const el = document.createElement('cookie-consent');
    el.dataset.tracking = '{not json';
    document.body.append(el);
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    expect(scriptSrcs()).toEqual([]);
  });
});

describe('<cookie-consent> in GTM mode', () => {
  const GTM = { ...TRACKING, gtmContainerId: 'GTM-ABC1234' };
  const events = () => win.dataLayer.filter((e) => !('length' in (e as object))) as Record<string, unknown>[];

  it('loads nothing before consent', () => {
    mount(GTM);
    consent();
    expect(scriptSrcs()).toEqual([]);
    expect(events()).toEqual([]);
  });

  it('loads only GTM after consent and reports it through em_consent', () => {
    mount(GTM);
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    change();
    expect(scriptSrcs()).toEqual([`${GTM_URL}?id=GTM-ABC1234`]);
    expect(win.fbq).toBeUndefined();
    expect(commands().filter((c) => c[0] === 'config')).toEqual([]);
    expect(events().filter((e) => e.event === 'gtm.js')).toHaveLength(1);
    expect(events()).toContainEqual({ event: 'em_consent', analytics: true, marketing: true });
  });

  it('pushes generate_lead with the source only, and no name, phone or email', () => {
    mount(GTM);
    lib.accepted = new Set(['marketing']);
    consent();
    const detail = { source: 'test', ageGroup: null, name: 'Maria Popescu', phone: '0775630680', email: 'maria@example.ro' };
    document.body.dispatchEvent(new CustomEvent('lead.submitted', { detail, bubbles: true }));
    expect(events()).toContainEqual({ event: 'generate_lead', lead_source: 'test' });
    const sent = JSON.stringify(win.dataLayer);
    for (const secret of ['Maria', '0775630680', 'maria@example.ro']) expect(sent).not.toContain(secret);
    expect(commands().filter((c) => c[0] === 'event')).toEqual([]);
  });

  it('sends no lead after a refusal', () => {
    mount(GTM);
    consent();
    document.body.dispatchEvent(createLeadSubmitted({ source: 'home', ageGroup: null }));
    expect(win.dataLayer).toEqual([]);
  });
});
