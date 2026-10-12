import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import LandingBand from './LandingBand.astro';
import LandingHeader from './LandingHeader.astro';
import LandingHero from './LandingHero.astro';
import LandingPhotos from './LandingPhotos.astro';
import LandingSteps from './LandingSteps.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0]) {
  const container = await AstroContainer.create();
  return container.renderToString(component);
}

describe('demo landing sections', () => {
  it('header has the logo and phone link but no navigation', async () => {
    const html = await render(LandingHeader);
    expect(html).toContain('href="tel:+40775630680"');
    expect(html).toContain('+40 775 630 680');
    expect(html).toContain('class="logo"');
    expect(html).not.toContain('site-header__nav');
  });

  it('hero has the h1, copy, Ema bubble and the landing form', async () => {
    const html = await render(LandingHero);
    expect(html).toContain('<h1');
    expect(html).toContain('Lecție demo gratuită de engleză');
    expect(html).toContain('Cluj-Napoca · 5–14 ani');
    expect(html).toContain('Copilul tău participă la o lecție reală, după metoda Cambridge.');
    expect(html).toContain('Hei, eu sunt Ema! Te aștept la lecție.');
    expect(html).toMatch(/<lead-form[^>]*data-source="landing"/);
    expect(html).toContain('Rezervă locul acum');
    expect(html).toContain('Rezervă lecția gratuită');
    expect(html).toContain(site.offer.detail);
    expect(html).toContain('href="/termeni/#oferte"');
  });

  it('steps list the three steps', async () => {
    const html = await render(LandingSteps);
    for (const text of ['Cum se desfășoară', 'Completezi formularul', 'Durează 30 de secunde.', 'Te sunăm', 'Stabilim împreună ziua și ora potrivită.', 'Copilul vine la lecție', 'La final îți spunem nivelul și grupa recomandată.']) {
      expect(html).toContain(text);
    }
  });

  it('photos render four images with alt text', async () => {
    const html = await render(LandingPhotos);
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(4);
    for (const img of images) expect(img).toMatch(/alt="[^"]+"/);
    for (const alt of ['Lecție', 'Elevii academiei', 'Profesoară la curs', 'Copii la curs']) expect(html).toContain(`alt="${alt}"`);
  });

  it('band shows the offer, the address and the WhatsApp button', async () => {
    const html = await render(LandingBand);
    expect(html).toContain('Ofertă pre-sale 2026: 4 + 1 lună cadou');
    expect(html).toContain('href="/termeni/#oferte"');
    expect(html).toContain(`${site.contact.street}, ${site.contact.city}`);
    expect(html).toContain('Scrie-ne pe WhatsApp');
    expect(html).toContain(`href="${site.contact.whatsappUrl}"`);
  });
});
