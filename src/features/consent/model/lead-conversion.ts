import type { TagCall } from '@core/analytics/track';
import type { LeadSubmittedDetail } from '@shared/contracts/domain-events';
import type { ConsentChoice } from './consent-signals';
import type { TrackingIds } from './tracking-ids';

export function leadConversionCalls(
  detail: LeadSubmittedDetail,
  ids: TrackingIds,
  granted: ConsentChoice,
): TagCall[] {
  if (ids.gtm) {
    return granted.analytics || granted.marketing
      ? [{ sink: 'dataLayer', args: [{ event: 'generate_lead', lead_source: detail.source }] }]
      : [];
  }
  const calls: TagCall[] = [];
  if (granted.analytics && ids.ga4) {
    const params = { send_to: ids.ga4, lead_source: detail.source };
    calls.push({
      sink: 'gtag',
      args: ['event', 'generate_lead', detail.ageGroup ? { ...params, age_group: detail.ageGroup } : params],
    });
  }
  if (granted.marketing && ids.adsLeadSendTo) {
    calls.push({ sink: 'gtag', args: ['event', 'conversion', { send_to: ids.adsLeadSendTo }] });
  }
  if (granted.marketing && ids.metaPixel) {
    calls.push({ sink: 'fbq', args: ['track', 'Lead', { content_name: detail.source }] });
  }
  return calls;
}
