import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from './BaseLayout.astro';

async function render(props: { title: string; description: string }) {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, { props, slots: { default: '<main id="continut">Salut</main>' } });
}

describe('BaseLayout', () => {
  it('declares Romanian and the viewport', async () => {
    const html = await render({ title: 'Grupe', description: 'Descriere' });
    expect(html).toContain('<html lang="ro"');
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1"');
  });

  it('suffixes the page title with the academy name', async () => {
    const html = await render({ title: 'Grupe', description: 'Descriere' });
    expect(html).toContain('<title>Grupe · English Minds Academy</title>');
  });

  it('does not repeat the name on the home page', async () => {
    const html = await render({ title: 'English Minds Academy', description: 'Descriere' });
    expect(html).toContain('<title>English Minds Academy</title>');
  });

  it('renders the description, the skip link and the slot', async () => {
    const html = await render({ title: 'Grupe', description: 'Cursuri de engleză' });
    expect(html).toContain('name="description" content="Cursuri de engleză"');
    expect(html).toContain('href="#continut"');
    expect(html).toContain('<main id="continut">Salut</main>');
  });
});
