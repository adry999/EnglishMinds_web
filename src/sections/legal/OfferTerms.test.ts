import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import { offerConditionsRequiredByLaw } from './offer-terms';
import OfferTerms from './OfferTerms.astro';

describe('OfferTerms', () => {
  it('renders the section anchored as #oferte with every condition from site.ts', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(OfferTerms);
    expect(html).toContain('id="oferte"');
    expect(html).toContain('<h2 id="oferte-titlu">Oferte și reduceri</h2>');
    expect(html).toContain('aria-labelledby="oferte-titlu"');
    for (const sentence of offerConditionsRequiredByLaw(site.offer)) expect(html).toContain(sentence);
    for (const value of Object.values(site.offer.terms)) expect(html).toContain(value);
  });
});
