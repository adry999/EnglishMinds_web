import { describe, expect, it } from 'vitest';
import { consentDefaultsScript } from './consent-defaults';
import { NO_CONSENT, toConsentSignals } from './consent-signals';
import { leadConversionCalls } from './lead-conversion';
import { FBEVENTS_SRC, GTAG_URL, planTags } from './tag-plan';
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
    ).toEqual({ ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
  });

  it('drops the conversion when only the label is wrong', () => {
    expect(parseTrackingIds({ ...RAW, googleAdsLeadLabel: 'bad label!' })).toMatchObject({
      googleAds: 'AW-1234567890',
      adsLeadSendTo: null,
    });
  });

  it('survives non-object input', () => {
    expect(parseTrackingIds(null)).toEqual({ ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
    expect(parseTrackingIds('G-ABC123XYZ')).toEqual({ ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
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
    expect(planTags(IDS, NO_CONSENT, NO_CONSENT, NOW)).toEqual({ gtagSrc: null, loadPixel: false, calls: [] });
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
    expect(planTags(none, ALL, NO_CONSENT, NOW)).toEqual({ gtagSrc: null, loadPixel: false, calls: [] });
  });

  it('exposes the Meta script url', () => {
    expect(FBEVENTS_SRC).toBe('https://connect.facebook.net/en_US/fbevents.js');
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
