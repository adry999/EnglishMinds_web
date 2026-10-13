import { describe, expect, it } from 'vitest';
import { offerConditionsRequiredByLaw } from './offer-terms';

const offer = {
  label: 'Ofertă pre-sale 2026',
  headline: '4 + 1 lună cadou',
  detail: 'Reducere pentru primii 20 înscriși',
  terms: {
    validUntil: '30 noiembrie 2026',
    appliesTo: 'toate cursurile de grup',
    discount: '10% din prețul lunar',
    howCounted: 'după data plății primei luni',
  },
};

describe('offerConditionsRequiredByLaw', () => {
  it('states both offers, their period, scope, value and how the first 20 are counted', () => {
    expect(offerConditionsRequiredByLaw(offer)).toEqual([
      'Oferta „Ofertă pre-sale 2026” (4 + 1 lună cadou) este valabilă până la 30 noiembrie 2026.',
      'Se aplică pentru: toate cursurile de grup.',
      'Reducere pentru primii 20 înscriși: 10% din prețul lunar.',
      'Primii 20 de înscriși se numără astfel: după data plății primei luni.',
    ]);
  });
});
