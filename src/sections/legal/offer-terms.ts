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

/** The conditions of the offers shown on the site, as full sentences (Legea 363/2007: no hidden conditions). */
export function offerTermsSentences(offer: OfferWithTerms): string[] {
  const { terms } = offer;
  return [
    `Oferta „${offer.label}” (${offer.headline}) este valabilă până la ${terms.validUntil}.`,
    `Se aplică pentru: ${terms.appliesTo}.`,
    `${offer.detail}: ${terms.discount}.`,
    `Primii 20 de înscriși se numără astfel: ${terms.howCounted}.`,
  ];
}
