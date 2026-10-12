import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import OfferTermsLink from './OfferTermsLink.astro';
import VatNote from './VatNote.astro';

describe('VatNote', () => {
  it('shows the VAT mention from site.ts as small muted text', async () => {
    const container = await AstroContainer.create();
    expect(await container.renderToString(VatNote)).toBe(`<small class="vat-note">${site.pricing.vatNote}</small>`);
  });
});

describe('OfferTermsLink', () => {
  it('links to the offer conditions on the terms page', async () => {
    const container = await AstroContainer.create();
    expect(await container.renderToString(OfferTermsLink)).toBe('<a class="offer-terms-link" href="/termeni/#oferte">Condițiile ofertei</a>');
  });
});
