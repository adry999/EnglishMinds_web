import type * as CookieConsentApi from 'vanilla-cookieconsent';
import { withBase } from '@shared/lib/with-base';

/** Bump when the cookie policy changes; everyone is asked again. */
export const COOKIE_REVISION = 1;

type Handlers = {
  readonly onConsent: () => void;
  readonly onChange: () => void;
};

const POLICY_LINKS =
  `<a href="${withBase('/cookies/')}">Politica de cookies</a> <a href="${withBase('/confidentialitate/')}">Confidențialitate</a>`;

export function buildConsentConfig(handlers: Handlers): CookieConsentApi.CookieConsentConfig {
  return {
    revision: COOKIE_REVISION,
    cookie: { name: 'em_consent', sameSite: 'Lax', expiresAfterDays: 182 },
    guiOptions: {
      consentModal: { layout: 'box wide', position: 'bottom center', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
    },
    onConsent: handlers.onConsent,
    onChange: handlers.onChange,
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {
        autoClear: { cookies: [{ name: /^_ga/ }, { name: '_gid' }], reloadPage: true },
      },
      marketing: {
        autoClear: { cookies: [{ name: /^_fb[cp]$/ }, { name: /^_gcl/ }], reloadPage: true },
      },
    },
    language: {
      default: 'ro',
      translations: {
        ro: {
          consentModal: {
            title: 'Cookie-uri doar cu acordul tău',
            description:
              'Cookie-urile necesare țin minte doar alegerea ta. Cu acordul tău folosim și cookie-uri de statistici (Google Analytics) și de marketing (Meta, Google Ads), ca să știm ce reclame aduc părinții la lecția demo.',
            acceptAllBtn: 'Accept toate',
            acceptNecessaryBtn: 'Refuz',
            showPreferencesBtn: 'Aleg eu',
            footer: POLICY_LINKS,
          },
          preferencesModal: {
            title: 'Setări cookies',
            acceptAllBtn: 'Accept toate',
            acceptNecessaryBtn: 'Refuz toate',
            savePreferencesBtn: 'Salvez alegerea',
            closeIconLabel: 'Închide',
            sections: [
              {
                description:
                  'Alegi ce cookie-uri accepți. Poți schimba oricând alegerea din linkul „Setări cookies” din subsolul paginii.',
              },
              {
                title: 'Necesare',
                description: 'Țin minte alegerea ta despre cookie-uri. Nu pot fi oprite.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Statistici',
                description: 'Google Analytics: câți părinți vizitează site-ul și ce pagini citesc. Fără nume sau telefon.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Marketing',
                description:
                  'Meta Pixel și Google Ads: ne arată ce reclame aduc rezervări la lecția demo. Fără nume sau telefon.',
                linkedCategory: 'marketing',
              },
              { title: 'Mai multe', description: POLICY_LINKS },
            ],
          },
        },
      },
    },
  };
}
