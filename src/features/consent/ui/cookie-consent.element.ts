import * as CookieConsent from 'vanilla-cookieconsent';
import { appendScript, ensureFbq, sendTagCalls, type TrackingWindow } from '@core/analytics/track';
import { LEAD_SUBMITTED, type LeadSubmittedDetail } from '@shared/contracts/domain-events';
import { NO_CONSENT, type ConsentChoice } from '../model/consent-signals';
import { leadConversionCalls } from '../model/lead-conversion';
import { FBEVENTS_SRC, planTags } from '../model/tag-plan';
import { parseTrackingIds, type TrackingIds } from '../model/tracking-ids';
import { buildConsentConfig } from './consent-config';

function readTracking(json: string | undefined): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    console.warn('cookie-consent: data-tracking is not valid JSON', error);
    return null;
  }
}

export class CookieConsentElement extends HTMLElement {
  private started = false;
  private ids: TrackingIds = parseTrackingIds(null);
  private applied: ConsentChoice = NO_CONSENT;

  connectedCallback(): void {
    document.addEventListener(LEAD_SUBMITTED, this.onLead);
    if (this.started) return;
    this.started = true;
    this.ids = parseTrackingIds(readTracking(this.dataset.tracking));
    // Mounted here, at the top of <body>, so keyboard users reach the banner right after the skip link.
    const config = { ...buildConsentConfig({ onConsent: this.apply, onChange: this.apply }), root: this };
    CookieConsent.run(config).catch((error: unknown) => {
      console.error('cookie-consent: banner failed to start', error);
    });
  }

  disconnectedCallback(): void {
    document.removeEventListener(LEAD_SUBMITTED, this.onLead);
  }

  private readonly apply = (): void => {
    const choice: ConsentChoice = {
      analytics: CookieConsent.acceptedCategory('analytics'),
      marketing: CookieConsent.acceptedCategory('marketing'),
    };
    const plan = planTags(this.ids, choice, this.applied, new Date());
    const target = window as unknown as TrackingWindow;
    if (plan.gtagSrc) appendScript(document, plan.gtagSrc);
    if (plan.loadPixel) {
      ensureFbq(target);
      appendScript(document, FBEVENTS_SRC);
    }
    sendTagCalls(target, plan.calls);
    this.applied = choice;
  };

  private readonly onLead = (event: Event): void => {
    const { detail } = event as CustomEvent<LeadSubmittedDetail>;
    sendTagCalls(window as unknown as TrackingWindow, leadConversionCalls(detail, this.ids, this.applied));
  };
}

export function defineCookieConsent(): void {
  if (!customElements.get('cookie-consent')) customElements.define('cookie-consent', CookieConsentElement);
}
