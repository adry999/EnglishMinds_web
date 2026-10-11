export type ConsentChoice = {
  readonly analytics: boolean;
  readonly marketing: boolean;
};

export const NO_CONSENT: ConsentChoice = { analytics: false, marketing: false };

type Signal = 'granted' | 'denied';

export type ConsentSignals = {
  readonly analytics_storage: Signal;
  readonly ad_storage: Signal;
  readonly ad_user_data: Signal;
  readonly ad_personalization: Signal;
};

const signal = (granted: boolean): Signal => (granted ? 'granted' : 'denied');

export function toConsentSignals(choice: ConsentChoice): ConsentSignals {
  return {
    analytics_storage: signal(choice.analytics),
    ad_storage: signal(choice.marketing),
    ad_user_data: signal(choice.marketing),
    ad_personalization: signal(choice.marketing),
  };
}
