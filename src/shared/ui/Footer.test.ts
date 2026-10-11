import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from './Footer.astro';

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Footer);
}

describe('Footer', () => {
  it('offers WhatsApp and a phone call', async () => {
    const html = await render();
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('href="tel:+40775630680"');
    expect(html).toContain('+40 775 630 680');
  });

  it('shows the address and Instagram', async () => {
    const html = await render();
    expect(html).toContain('Str. Observatorului 90, et.2, Cluj-Napoca');
    expect(html).toContain('href="https://www.instagram.com/englishminds_academy/"');
  });

  it('links the legal pages', async () => {
    const html = await render();
    for (const href of ['/confidentialitate/', '/cookies/', '/termeni/']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('keeps a space before the highlighted words', async () => {
    expect(await render()).toMatch(/lecția <span class="site-footer__highlight">demo gratuită<\/span>/);
  });

  it('can hide the call to action block', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, { props: { showCta: false } });
    expect(html).not.toContain('site-footer__cta');
    expect(html).toContain('href="/confidentialitate/"');
  });
});
