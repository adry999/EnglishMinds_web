import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from './BaseLayout.astro';

async function render(props: { title: string; description: string; noindex?: boolean; type?: 'website' | 'article'; publishedTime?: Date; modifiedTime?: Date }) {
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

  it('emits a canonical and og:url on an indexable page', async () => {
    const html = await render({ title: 'Grupe', description: 'Descriere' });
    expect(html).toContain('<link rel="canonical"');
    expect(html).toContain('property="og:url"');
  });

  it('emits no canonical and no og:url on a noindex page', async () => {
    const html = await render({ title: 'Ups', description: 'Descriere', noindex: true });
    expect(html).toContain('<meta name="robots" content="noindex"');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('og:url');
  });

  it('emits article times only when given', async () => {
    const plain = await render({ title: 'Grupe', description: 'Descriere' });
    expect(plain).not.toContain('article:');
    const published = await render({ title: 'A', description: 'D', type: 'article', publishedTime: new Date('2026-09-01T00:00:00Z') });
    expect(published).toContain('<meta property="article:published_time" content="2026-09-01T00:00:00.000Z"');
    expect(published).not.toContain('article:modified_time');
    const updated = await render({
      title: 'A',
      description: 'D',
      type: 'article',
      publishedTime: new Date('2026-09-01T00:00:00Z'),
      modifiedTime: new Date('2026-09-15T00:00:00Z'),
    });
    expect(updated).toContain('<meta property="article:modified_time" content="2026-09-15T00:00:00.000Z"');
  });
});
