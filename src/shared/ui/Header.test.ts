import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Header from './Header.astro';

async function render(props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(Header, { props });
}

describe('Header', () => {
  it('links every public section', async () => {
    const html = await render();
    for (const href of ['/', '/grupe/', '/metoda-cambridge/', '/test-de-nivel/', '/tabere/', '/blog/']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('marks only the active section as the current page', async () => {
    const html = await render({ active: 'test' });
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/href="\/test-de-nivel\/"[^>]*aria-current="page"/);
  });

  it('marks nothing when no section is active', async () => {
    expect(await render()).not.toContain('aria-current');
  });

  it('sends the main call to action to the demo lesson page', async () => {
    expect(await render()).toMatch(/href="\/lectie-demo\/"[^>]*>Rezervă locul acum</);
  });

  it('gives the logo link an accessible name', async () => {
    expect(await render()).toContain('aria-label="English Minds Academy – Acasă"');
  });
});
