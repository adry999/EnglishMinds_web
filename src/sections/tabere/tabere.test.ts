import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import { CAMP_WHATSAPP_URL } from './camp-whatsapp';
import CampDay from './CampDay.astro';
import CampIncludes from './CampIncludes.astro';
import CampSummary from './CampSummary.astro';
import TabereHero from './TabereHero.astro';

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;');

async function render(component: Parameters<AstroContainer['renderToString']>[0]) {
  const container = await AstroContainer.create();
  return container.renderToString(component);
}

describe('camp page sections', () => {
  it('hero shows year and ages from site.camps and asks to be notified on WhatsApp', async () => {
    const html = await render(TabereHero);
    expect(html).toContain('O vară întreagă în engleză, cu Ema');
    expect(html).toContain(`Vara ${site.camps.year} · ${site.camps.ageRange}`);
    expect(html).toContain(`href="${CAMP_WHATSAPP_URL.replaceAll('&', '&amp;')}"`);
  });

  it('summary shows period, schedule, location and price', async () => {
    const html = await render(CampSummary);
    for (const value of [site.camps.period, site.camps.schedule, site.contact.street, site.camps.price]) {
      expect(html).toContain(value);
    }
  });

  it('day lists every slot with time, title and text', async () => {
    const html = await render(CampDay);
    for (const slot of site.camps.day) {
      expect(html).toContain(escapeHtml(slot.time));
      expect(html).toContain(escapeHtml(slot.title));
      expect(html).toContain(escapeHtml(slot.text));
    }
    expect(html).not.toContain('Se completează cu programul real');
  });

  it('includes list, the limited spots card and the same WhatsApp link', async () => {
    const html = await render(CampIncludes);
    for (const item of site.camps.includes) expect(html).toContain(item);
    expect(html).toContain('Locurile sunt limitate');
    expect(html).toContain(`href="${CAMP_WHATSAPP_URL.replaceAll('&', '&amp;')}"`);
    expect(html).toContain('role="list"');
  });
});
