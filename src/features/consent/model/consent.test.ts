import { describe, expect, it } from 'vitest';
import { consentDefaultsScript } from './consent-defaults';
import { NO_CONSENT, toConsentSignals } from './consent-signals';
import { leadConversionCalls } from './lead-conversion';
import { FBEVENTS_SRC, GTAG_URL, GTM_URL, planTags } from './tag-plan';
import { parseTrackingIds, type TrackingIds } from './tracking-ids';

const RAW = {
  ga4MeasurementId: 'G-ABC123XYZ',
  metaPixelId: '123456789012345',
  googleAdsId: 'AW-1234567890',
  googleAdsLeadLabel: 'AbC-dEf_123',
};
const IDS = parseTrackingIds(RAW);
const ALL = { analytics: true, marketing: true };
const STATS = { analytics: true, marketing: false };
const NOW = new Date('2026-10-12T10:00:00Z');

describe('parseTrackingIds', () => {
  it('keeps well-formed ids and builds the Ads send_to', () => {
    expect(IDS).toEqual({
      gtm: null,
      ga4: 'G-ABC123XYZ',
      metaPixel: '123456789012345',
      googleAds: 'AW-1234567890',
      adsLeadSendTo: 'AW-1234567890/AbC-dEf_123',
    });
  });

  it('turns TODO markers and malformed ids into null', () => {
    expect(
      parseTrackingIds({
        ga4MeasurementId: 'TODO: ID GA4 (G-…)',
        metaPixelId: '12ab',
        googleAdsId: 'AW-12',
        googleAdsLeadLabel: 'x',
      }),
    ).toEqual({ gtm: null, ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
  });

  it('drops the conversion when only the label is wrong', () => {
    expect(parseTrackingIds({ ...RAW, googleAdsLeadLabel: 'bad label!' })).toMatchObject({
      googleAds: 'AW-1234567890',
      adsLeadSendTo: null,
    });
  });

  it('survives non-object input', () => {
    expect(parseTrackingIds(null)).toEqual({ gtm: null, ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
    expect(parseTrackingIds('G-ABC123XYZ')).toEqual({ gtm: null, ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
  });
});

describe('parseTrackingIds, GTM', () => {
  it('accepts a GTM container id and treats empty or malformed ones as off', () => {
    expect(parseTrackingIds({ gtmContainerId: 'GTM-ABC1234' }).gtm).toBe('GTM-ABC1234');
    for (const bad of ['', 'GTM-', 'gtm-abc1234', 'G-ABC123XYZ', 'GTM-ABC 123', 'TODO: GTM', 42, null]) {
      expect(parseTrackingIds({ gtmContainerId: bad }).gtm).toBeNull();
    }
  });
});

describe('toConsentSignals', () => {
  it('maps analytics to analytics_storage and marketing to the three ad signals', () => {
    expect(toConsentSignals(NO_CONSENT)).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(toConsentSignals(STATS)).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(toConsentSignals({ analytics: false, marketing: true })).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});

describe('planTags', () => {
  it('does nothing on refusal', () => {
    expect(planTags(IDS, NO_CONSENT, NO_CONSENT, NOW)).toEqual({ gtmSrc: null, gtagSrc: null, loadPixel: false, calls: [] });
  });

  it('loads everything once on accept all', () => {
    const plan = planTags(IDS, ALL, NO_CONSENT, NOW);
    expect(plan.gtagSrc).toBe(`${GTAG_URL}?id=G-ABC123XYZ`);
    expect(plan.loadPixel).toBe(true);
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(ALL)] },
      { sink: 'gtag', args: ['js', NOW] },
      { sink: 'gtag', args: ['config', 'G-ABC123XYZ'] },
      { sink: 'gtag', args: ['config', 'AW-1234567890'] },
      { sink: 'fbq', args: ['consent', 'grant'] },
      { sink: 'fbq', args: ['set', 'autoConfig', false, '123456789012345'] },
      { sink: 'fbq', args: ['init', '123456789012345'] },
      { sink: 'fbq', args: ['track', 'PageView'] },
    ]);
  });

  it('turns off Meta automatic form scraping before init', () => {
    const fbqArgs = planTags(IDS, ALL, NO_CONSENT, NOW)
      .calls.filter((c) => c.sink === 'fbq')
      .map((c) => c.args);
    const autoConfig = fbqArgs.findIndex((a) => a[0] === 'set' && a[1] === 'autoConfig');
    const init = fbqArgs.findIndex((a) => a[0] === 'init');
    expect(autoConfig).toBeGreaterThan(-1);
    expect(autoConfig).toBeLessThan(init);
    expect(fbqArgs[init]).toEqual(['init', '123456789012345']);
  });

  it('repeats nothing when the same choice arrives again', () => {
    const plan = planTags(IDS, ALL, ALL, NOW);
    expect(plan.gtagSrc).toBeNull();
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls).toEqual([{ sink: 'gtag', args: ['consent', 'update', toConsentSignals(ALL)] }]);
  });

  it('adds only marketing when upgrading from statistics', () => {
    const plan = planTags(IDS, ALL, STATS, NOW);
    expect(plan.gtagSrc).toBeNull();
    expect(plan.loadPixel).toBe(true);
    expect(plan.calls).not.toContainEqual({ sink: 'gtag', args: ['config', 'G-ABC123XYZ'] });
    expect(plan.calls).toContainEqual({ sink: 'gtag', args: ['config', 'AW-1234567890'] });
  });

  it('uses the Ads id to load gtag.js when only marketing is accepted', () => {
    const plan = planTags(IDS, { analytics: false, marketing: true }, NO_CONSENT, NOW);
    expect(plan.gtagSrc).toBe(`${GTAG_URL}?id=AW-1234567890`);
    expect(plan.calls).not.toContainEqual({ sink: 'gtag', args: ['config', 'G-ABC123XYZ'] });
  });

  it('loads only GA4 with analytics consent alone: no Ads config, no Meta', () => {
    const plan = planTags(IDS, STATS, NO_CONSENT, NOW);
    expect(plan.gtagSrc).toBe(`${GTAG_URL}?id=G-ABC123XYZ`);
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls.filter((c) => c.sink === 'fbq')).toEqual([]);
    expect(plan.calls).toContainEqual({ sink: 'gtag', args: ['config', 'G-ABC123XYZ'] });
    expect(plan.calls).not.toContainEqual({ sink: 'gtag', args: ['config', 'AW-1234567890'] });
  });

  it('does not load Meta with marketing consent but no pixel id', () => {
    const noPixel = parseTrackingIds({ ...RAW, metaPixelId: 'TODO' });
    const plan = planTags(noPixel, ALL, NO_CONSENT, NOW);
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls.filter((c) => c.sink === 'fbq')).toEqual([]);
    expect(plan.gtagSrc).toBe(`${GTAG_URL}?id=G-ABC123XYZ`);
  });

  it('revokes marketing and denies the signals when marketing is withdrawn', () => {
    const plan = planTags(IDS, STATS, ALL, NOW);
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(STATS)] },
      { sink: 'fbq', args: ['consent', 'revoke'] },
    ]);
  });

  it('loads nothing when the ids are missing, whatever the choice', () => {
    const none: TrackingIds = parseTrackingIds({});
    expect(planTags(none, ALL, NO_CONSENT, NOW)).toEqual({ gtmSrc: null, gtagSrc: null, loadPixel: false, calls: [] });
  });

  it('exposes the Meta script url', () => {
    expect(FBEVENTS_SRC).toBe('https://connect.facebook.net/en_US/fbevents.js');
  });
});

const GTM_IDS = parseTrackingIds({ ...RAW, gtmContainerId: 'GTM-ABC1234' });
const push = (event: Record<string, unknown>) => ({ sink: 'dataLayer', args: [event] });

describe('planTags in GTM mode', () => {
  it('does nothing before consent and on refusal', () => {
    expect(planTags(GTM_IDS, NO_CONSENT, NO_CONSENT, NOW)).toEqual({ gtmSrc: null, gtagSrc: null, loadPixel: false, calls: [] });
  });

  it('loads only GTM on accept all, never gtag.js or the pixel, even with the direct ids filled', () => {
    const plan = planTags(GTM_IDS, ALL, NO_CONSENT, NOW);
    expect(plan.gtmSrc).toBe(`${GTM_URL}?id=GTM-ABC1234`);
    expect(plan.gtagSrc).toBeNull();
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(ALL)] },
      push({ event: 'em_consent', analytics: true, marketing: true }),
      push({ 'gtm.start': NOW.getTime(), event: 'gtm.js' }),
    ]);
    expect(plan.calls.some((c) => c.sink === 'fbq' || (c.sink === 'gtag' && c.args[0] === 'config'))).toBe(false);
  });

  it('loads GTM with analytics alone or marketing alone', () => {
    expect(planTags(GTM_IDS, STATS, NO_CONSENT, NOW).gtmSrc).toBe(`${GTM_URL}?id=GTM-ABC1234`);
    expect(planTags(GTM_IDS, { analytics: false, marketing: true }, NO_CONSENT, NOW).gtmSrc).toBe(`${GTM_URL}?id=GTM-ABC1234`);
  });

  it('loads GTM once, and only reports the new choice on a change', () => {
    const plan = planTags(GTM_IDS, ALL, STATS, NOW);
    expect(plan.gtmSrc).toBeNull();
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(ALL)] },
      push({ event: 'em_consent', analytics: true, marketing: true }),
    ]);
  });

  it('reports a withdrawal without reloading GTM', () => {
    const plan = planTags(GTM_IDS, NO_CONSENT, ALL, NOW);
    expect(plan.gtmSrc).toBeNull();
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(NO_CONSENT)] },
      push({ event: 'em_consent', analytics: false, marketing: false }),
    ]);
  });

  it('ignores a malformed GTM id and falls back to the direct tags', () => {
    const ids = parseTrackingIds({ ...RAW, gtmContainerId: 'nope' });
    expect(planTags(ids, ALL, NO_CONSENT, NOW).gtmSrc).toBeNull();
    expect(planTags(ids, ALL, NO_CONSENT, NOW).gtagSrc).toBe(`${GTAG_URL}?id=G-ABC123XYZ`);
  });
});

describe('leadConversionCalls in GTM mode', () => {
  const detail = { source: 'landing', ageGroup: '7–8 ani' } as const;

  it('sends nothing without consent', () => {
    expect(leadConversionCalls(detail, GTM_IDS, NO_CONSENT)).toEqual([]);
  });

  it('pushes one generate_lead with the source only, instead of gtag and fbq calls', () => {
    for (const granted of [STATS, ALL, { analytics: false, marketing: true }]) {
      expect(leadConversionCalls(detail, GTM_IDS, granted)).toEqual([push({ event: 'generate_lead', lead_source: 'landing' })]);
    }
  });

  it('never puts name, phone, email or age group in the dataLayer', () => {
    const leaky = { ...detail, name: 'Maria Popescu', phone: '0775630680', email: 'maria@example.ro' };
    const payload = JSON.stringify(leadConversionCalls(leaky, GTM_IDS, ALL));
    expect(payload).toContain('generate_lead');
    for (const secret of ['Maria', 'Popescu', '0775630680', 'maria@example.ro', '"name"', '"phone"', '"email"', '7–8']) {
      expect(payload).not.toContain(secret);
    }
  });
});

describe('leadConversionCalls', () => {
  const detail = { source: 'home', ageGroup: '7–8 ani' } as const;

  it('sends nothing without consent', () => {
    expect(leadConversionCalls(detail, IDS, NO_CONSENT)).toEqual([]);
  });

  it('sends the GA4 event only with statistics consent', () => {
    expect(leadConversionCalls(detail, IDS, STATS)).toEqual([
      {
        sink: 'gtag',
        args: ['event', 'generate_lead', { send_to: 'G-ABC123XYZ', lead_source: 'home', age_group: '7–8 ani' }],
      },
    ]);
  });

  it('sends the Ads conversion and the Meta Lead with marketing consent', () => {
    expect(leadConversionCalls(detail, IDS, { analytics: false, marketing: true })).toEqual([
      { sink: 'gtag', args: ['event', 'conversion', { send_to: 'AW-1234567890/AbC-dEf_123' }] },
      { sink: 'fbq', args: ['track', 'Lead', { content_name: 'home' }] },
    ]);
  });

  it('never puts name, phone or email in a tag payload, even if the event detail carries them', () => {
    const leaky = { ...detail, name: 'Maria Popescu', phone: '0775630680', email: 'maria@example.ro' };
    const calls = leadConversionCalls(leaky, IDS, ALL);
    expect(calls.length).toBeGreaterThan(0);
    const payload = JSON.stringify(calls);
    for (const secret of ['Maria', 'Popescu', '0775630680', 'maria@example.ro', '"name"', '"phone"', '"email"']) {
      expect(payload).not.toContain(secret);
    }
  });

  it('leaves out a missing age group', () => {
    const [call] = leadConversionCalls({ source: 'test', ageGroup: null }, IDS, STATS);
    expect(call?.args[2]).toEqual({ send_to: 'G-ABC123XYZ', lead_source: 'test' });
  });
});

describe('consentDefaultsScript', () => {
  it('queues consent default=denied as an arguments object before anything else', () => {
    const win: { dataLayer?: unknown[]; gtag?: unknown } = {};
    new Function('window', consentDefaultsScript())(win);
    expect(typeof win.gtag).toBe('function');
    const [first, second] = (win.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
    expect(first).toEqual(['consent', 'default', toConsentSignals(NO_CONSENT)]);
    expect(second).toEqual(['set', 'ads_data_redaction', true]);
  });

  it('keeps an existing dataLayer', () => {
    const win: { dataLayer: unknown[] } = { dataLayer: ['earlier'] };
    new Function('window', consentDefaultsScript())(win);
    expect(win.dataLayer[0]).toBe('earlier');
    expect(win.dataLayer).toHaveLength(3);
  });
});
