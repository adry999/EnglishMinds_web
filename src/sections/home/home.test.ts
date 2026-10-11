import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import HomeContact from './HomeContact.astro';
import HomeHero from './HomeHero.astro';
import LevelsOverview from './LevelsOverview.astro';
import OfferStrip from './OfferStrip.astro';
import TestTeaser from './TestTeaser.astro';
import ValueCards from './ValueCards.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0], options = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

describe('home sections', () => {
  it('hero has the single h1, the test link and the contact anchor', async () => {
    const html = await render(HomeHero);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('Engleză de la 5 ani, după metoda');
    expect(html).toContain('href="/test-de-nivel/"');
    expect(html).toContain('href="#contact"');
    expect(html).toContain('Hei, eu sunt Ema!');
    expect(html).toContain('loading="eager"');
  });

  it('offer strip shows label, headline and detail', async () => {
    const html = await render(OfferStrip);
    expect(html).toContain('Ofertă pre-sale 2026');
    expect(html).toContain('4 + 1 lună cadou');
    expect(html).toContain('Reducere pentru primii 20 înscriși');
  });

  it('links every level card to its anchor on the groups page', async () => {
    const html = await render(LevelsOverview);
    for (const slug of ['starters', 'pre-a1', 'movers', 'flyers', 'a2-key']) {
      expect(html).toContain(`href="/grupe/#${slug}"`);
    }
    expect(html).toContain('id="cursuri"');
  });

  it('renders the three value cards in order', async () => {
    const html = await render(ValueCards);
    const order = ['Program structurat pe niveluri', 'Metodologie Cambridge', 'Rezultate vizibile după prima lună'];
    const positions = order.map((title) => html.indexOf(title));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('teaser sends parents to the full level test', async () => {
    const html = await render(TestTeaser);
    expect(html).toContain('id="test"');
    expect(html).toContain('href="/test-de-nivel/"');
    expect(html).toContain('Descoperă nivelul potrivit copilului tău');
  });

  it('contact section has phone, WhatsApp, maps link and a slot for the form', async () => {
    const html = await render(HomeContact, { slots: { default: '<form id="viitor"></form>' } });
    expect(html).toContain('id="contact"');
    expect(html).toContain('href="tel:+40775630680"');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=');
    expect(html).toContain('<form id="viitor"></form>');
    expect(html).toContain('Lasă-ne un număr de telefon');
  });

  it('contact section does not promise a phone form when no form is slotted', async () => {
    const html = await render(HomeContact);
    expect(html).not.toContain('Lasă-ne un număr de telefon');
    expect(html).toContain('Scrie-ne pe WhatsApp sau sună-ne și stabilim împreună ziua și ora.');
  });
});
