import { NO_CONSENT, toConsentSignals } from './consent-signals';

const GTAG_STUB = 'window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};';

export function consentDefaultsScript(): string {
  const denied = JSON.stringify(toConsentSignals(NO_CONSENT));
  return [
    'window.dataLayer=window.dataLayer||[];',
    GTAG_STUB,
    `window.gtag('consent','default',${denied});`,
    "window.gtag('set','ads_data_redaction',true);",
  ].join('');
}
