export type TrackingIds = {
  /** Set = GTM mode: the direct tags below are not loaded. */
  readonly gtm: string | null;
  readonly ga4: string | null;
  readonly metaPixel: string | null;
  readonly googleAds: string | null;
  readonly adsLeadSendTo: string | null;
};

const GTM = /^GTM-[A-Z0-9]{4,10}$/;
const GA4 = /^G-[A-Z0-9]{4,20}$/;
const META_PIXEL = /^\d{10,20}$/;
const GOOGLE_ADS = /^AW-\d{6,15}$/;
const ADS_LABEL = /^[A-Za-z0-9_-]{4,40}$/;

function pick(raw: unknown, key: string, pattern: RegExp): string | null {
  if (raw === null || typeof raw !== 'object') return null;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === 'string' && pattern.test(value) ? value : null;
}

export function parseTrackingIds(raw: unknown): TrackingIds {
  const googleAds = pick(raw, 'googleAdsId', GOOGLE_ADS);
  const label = pick(raw, 'googleAdsLeadLabel', ADS_LABEL);
  return {
    gtm: pick(raw, 'gtmContainerId', GTM),
    ga4: pick(raw, 'ga4MeasurementId', GA4),
    metaPixel: pick(raw, 'metaPixelId', META_PIXEL),
    googleAds,
    adsLeadSendTo: googleAds && label ? `${googleAds}/${label}` : null,
  };
}
