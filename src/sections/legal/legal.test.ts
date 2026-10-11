import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { COOKIE_INVENTORY } from '@features/consent';
import { site } from '@shared/content/site';
import LegalDocument from './LegalDocument.astro';

type Entry = Parameters<typeof LegalDocument>[0]['entry'];

// A hand-built entry: the component only reads `data` and calls render(entry),
// which falls back to an empty body when the entry has no rendered markdown.
const entry = {
  id: 'cookies',
  collection: 'legal',
  data: { title: 'Politica de test', description: 'Descriere.', updatedAt: new Date('2026-10-12') },
} as unknown as Entry;

async function render(props: { showCookies?: boolean; showPolicyVersion?: boolean }) {
  const container = await AstroContainer.create();
  return container.renderToString(LegalDocument, { props: { entry, ...props } });
}

describe('LegalDocument', () => {
  it('shows the operator block, the draft note and the update date', async () => {
    const html = await render({});
    expect(html).toContain('<h1>Politica de test</h1>');
    expect(html).toContain(site.company.legalName);
    expect(html).toContain(site.company.cui);
    expect(html).toContain(site.company.registeredOffice);
    expect(html).toContain(`href="tel:${site.contact.phoneE164}"`);
    expect(html).toContain(`${site.contact.street}, ${site.contact.city}`);
    expect(html).toContain('class="legal__draft" role="note"');
    expect(html).toContain('<time datetime="2026-10-12');
    expect(html).toContain('12 octombrie 2026');
  });

  it('with showCookies lists every cookie from the inventory', async () => {
    const html = await render({ showCookies: true });
    expect(html).toContain('<table');
    expect(html).toContain('Cookie-urile folosite');
    for (const cookie of COOKIE_INVENTORY) expect(html).toContain(cookie.names);
  });

  it('without showCookies renders no table', async () => {
    expect(await render({})).not.toContain('<table');
  });
});
