import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import { companyLine } from '@shared/lib/company-line';
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

  it('does not force white text onto the call-to-action buttons', () => {
    const css = readFileSync(resolve(import.meta.dirname, 'Footer.css'), 'utf8');
    expect(css).toContain('.site-footer a:not(.button) {');
    expect(css).not.toContain('.site-footer a {');
  });

  it('shows the address and Instagram', async () => {
    const html = await render();
    expect(html).toContain('Str. Observatorului 90, et.2, Cluj-Napoca');
    expect(html).toContain('href="https://www.instagram.com/englishminds_academy/"');
  });

  it('opens Instagram in a new tab, announces it and keeps the opener away', async () => {
    const html = await render();
    const social = html.match(/<a class="site-footer__social"([^>]*)>([\s\S]*?)<\/a>/);
    expect(social?.[1]).toContain('href="https://www.instagram.com/englishminds_academy/"');
    expect(social?.[1]).toContain('target="_blank"');
    expect(social?.[1]).toContain('rel="noopener noreferrer"');
    expect(social?.[2]).toContain('<svg');
    expect(social?.[2]).toContain('aria-hidden="true"');
    expect(social?.[2]).toContain('(se deschide într-un tab nou)');
  });

  it('links every public section and the demo lesson', async () => {
    const html = await render();
    const pages = html.match(/<nav class="site-footer__col"[\s\S]*?<\/nav>/)?.[0] ?? '';
    for (const href of ['/grupe/', '/metoda-cambridge/', '/test-de-nivel/', '/tabere/', '/blog/', '/lectie-demo/']) {
      expect(pages).toContain(`href="${href}"`);
    }
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

  it('lets the visitor reopen the cookie settings', async () => {
    expect(await render()).toMatch(/<button[^>]*type="button"[^>]*data-cc="show-preferencesModal"[^>]*>Setări cookies<\/button>/);
  });

  it('identifies the company in the bottom bar with CUI, trade register number and registered office', async () => {
    const html = await render();
    const bottom = html.match(/<div class="site-footer__bottom">[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(bottom).toContain(`<p class="site-footer__company">${companyLine(site.company)}</p>`);
    expect(bottom).toContain(`CUI ${site.company.cui}`);
    expect(bottom).toContain(`Nr. Reg. Com. ${site.company.registrationNumber}`);
  });

  it('offers the contact email as a mailto link', async () => {
    const html = await render();
    expect(html).toContain(`<a href="mailto:${site.contact.email}">${site.contact.email}</a>`);
  });

  it('links the ANPC alternative dispute resolution platform in a new tab, announced, as a 250x50 badge', async () => {
    const html = await render();
    const badge = html.match(/<a class="site-footer__anpc"([^>]*)>([\s\S]*?)<\/a>/);
    expect(badge?.[1]).toContain('href="https://reclamatiisal.anpc.ro/"');
    expect(badge?.[1]).toContain('target="_blank"');
    expect(badge?.[1]).toContain('rel="noopener noreferrer"');
    expect(badge?.[2]).toContain('ANPC – Soluționarea alternativă a litigiilor');
    expect(badge?.[2]).toContain('(se deschide într-un tab nou)');
  });

  it('can hide the call to action block', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, { props: { showCta: false } });
    expect(html).not.toContain('site-footer__cta');
    expect(html).toContain('href="/confidentialitate/"');
  });
});
