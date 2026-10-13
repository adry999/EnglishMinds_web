export type OfferWithTerms = {
  readonly label: string;
  readonly headline: string;
  readonly detail: string;
  readonly terms: {
    readonly validUntil: string;
    readonly appliesTo: string;
    readonly discount: string;
    readonly howCounted: string;
  };
};

export function offerConditionsRequiredByLaw(offer: OfferWithTerms): string[] {
  const { terms } = offer;
  return [
    `Oferta „${offer.label}” (${offer.headline}) este valabilă până la ${terms.validUntil}.`,
    `Se aplică pentru: ${terms.appliesTo}.`,
    `${offer.detail}: ${terms.discount}.`,
    `Primii 20 de înscriși se numără astfel: ${terms.howCounted}.`,
  ];
}
