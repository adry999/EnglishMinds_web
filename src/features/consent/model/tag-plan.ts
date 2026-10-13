import type { TagCall } from '@core/analytics/track';
import { toConsentSignals, type ConsentChoice } from './consent-signals';
import type { TrackingIds } from './tracking-ids';

export const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';
export const FBEVENTS_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
export const GTM_URL = 'https://www.googletagmanager.com/gtm.js';

export type TagPlan = {
  readonly gtmSrc: string | null;
  readonly gtagSrc: string | null;
  readonly loadPixel: boolean;
  readonly calls: readonly TagCall[];
};

const gtag = (...args: unknown[]): TagCall => ({ sink: 'gtag', args });
const fbq = (...args: unknown[]): TagCall => ({ sink: 'fbq', args });

function gtagId(ids: TrackingIds, choice: ConsentChoice): string | null {
  if (choice.analytics && ids.ga4) return ids.ga4;
  if (choice.marketing && ids.googleAds) return ids.googleAds;
  return null;
}

const pixelOn = (ids: TrackingIds, choice: ConsentChoice): boolean => Boolean(ids.metaPixel && choice.marketing);

const gtmOn = (ids: TrackingIds, choice: ConsentChoice): boolean => Boolean(ids.gtm && (choice.analytics || choice.marketing));

function planGtm(ids: TrackingIds, choice: ConsentChoice, previous: ConsentChoice, now: Date): TagPlan {
  const calls: TagCall[] = [];
  const before = gtmOn(ids, previous);
  const loaded = gtmOn(ids, choice);
  if (!loaded && !before) return { gtmSrc: null, gtagSrc: null, loadPixel: false, calls };
  calls.push(
    gtag('consent', 'update', toConsentSignals(choice)),
    { sink: 'dataLayer', args: [{ event: 'em_consent', analytics: choice.analytics, marketing: choice.marketing }] },
  );
  const gtmSrc = loaded && !before ? `${GTM_URL}?id=${ids.gtm}` : null;
  if (gtmSrc) calls.push({ sink: 'dataLayer', args: [{ 'gtm.start': now.getTime(), event: 'gtm.js' }] });
  return { gtmSrc, gtagSrc: null, loadPixel: false, calls };
}

export function planTags(ids: TrackingIds, choice: ConsentChoice, previous: ConsentChoice, now: Date): TagPlan {
  if (ids.gtm) return planGtm(ids, choice, previous, now);
  const calls: TagCall[] = [];
  const gtagNow = gtagId(ids, choice);
  const gtagBefore = gtagId(ids, previous);
  const gtagSrc = gtagNow && !gtagBefore ? `${GTAG_URL}?id=${gtagNow}` : null;

  if (gtagNow || gtagBefore) calls.push(gtag('consent', 'update', toConsentSignals(choice)));
  if (gtagSrc) calls.push(gtag('js', now));
  if (ids.ga4 && choice.analytics && !previous.analytics) calls.push(gtag('config', ids.ga4));
  if (ids.googleAds && choice.marketing && !previous.marketing) calls.push(gtag('config', ids.googleAds));

  const pixelNow = pixelOn(ids, choice);
  const pixelBefore = pixelOn(ids, previous);
  if (pixelNow && !pixelBefore) {
    calls.push(
      fbq('consent', 'grant'),
      fbq('set', 'autoConfig', false, ids.metaPixel),
      fbq('init', ids.metaPixel),
      fbq('track', 'PageView'),
    );
  }
  if (!pixelNow && pixelBefore) calls.push(fbq('consent', 'revoke'));

  return { gtmSrc: null, gtagSrc, loadPixel: pixelNow && !pixelBefore, calls };
}
