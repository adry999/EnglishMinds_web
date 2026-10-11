import { NO_CONSENT, toConsentSignals } from './consent-signals';

/**
 * Inline script for the top of <head>. gtag must push the `arguments` object, not an array,
 * otherwise gtag.js ignores the command.
 */
export function consentDefaultsScript(): string {
  const denied = JSON.stringify(toConsentSignals(NO_CONSENT));
  return [
    'window.dataLayer=window.dataLayer||[];',
    'window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};',
    `window.gtag('consent','default',${denied});`,
    "window.gtag('set','ads_data_redaction',true);",
  ].join('');
}
