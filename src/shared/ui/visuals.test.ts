import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Badge from './Badge.astro';
import EmaPortrait from './EmaPortrait.astro';
import Eyebrow from './Eyebrow.astro';
import Photo from './Photo.astro';
import { photos } from '@shared/content/photos';
import Star from './Star.astro';
import StickyContact from './StickyContact.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0], options = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

describe('shared visuals', () => {
  it('renders a lazy responsive picture with avif and webp', async () => {
    const html = await render(Photo, { props: { photo: 'class', alt: 'Copii la curs', sizes: '100vw' } });
    expect(html).toContain('<picture');
    expect(html).toContain('type="image/avif"');
    expect(html).toContain('type="image/webp"');
    expect(html).toContain('alt="Copii la curs"');
    expect(html).toContain('loading="lazy"');
  });

  it('accepts an imported image instead of a photo key (blog covers)', async () => {
    const html = await render(Photo, { props: { photo: photos.hands, alt: '', sizes: '100vw' } });
    expect(html).toContain('<picture');
  });

  it('loads the hero photo eagerly with high priority', async () => {
    const html = await render(Photo, { props: { photo: 'class', alt: '', sizes: '100vw', eager: true } });
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
  });

  it('puts the Ema crop class on the img inside the circle', async () => {
    const html = await render(EmaPortrait, { props: { size: 'lg' } });
    expect(html).toContain('class="ema-portrait ema-portrait--lg"');
    expect(html).toMatch(/<img[^>]*class="ema-portrait__img"/);
    expect(html).toContain('alt="Ema, mascota English Minds Academy"');
  });

  it('hides decorative stars from assistive technology', async () => {
    expect(await render(Star, { props: { tone: 'orange', size: 30 } })).toMatch(
      /<span class="star star--orange" style="--star-size: ?30px;?" aria-hidden="true">/,
    );
  });

  it('renders eyebrow and badge text with their tones', async () => {
    expect(await render(Eyebrow, { props: { tone: 'sun' }, slots: { default: 'Detalii curs' } })).toContain(
      '<p class="eyebrow eyebrow--sun">Detalii curs</p>',
    );
    expect(await render(Badge, { props: { tone: 'orange' }, slots: { default: 'Vara 2026' } })).toContain(
      '<p class="badge badge--orange">Vara 2026</p>',
    );
  });

  it('offers WhatsApp and the demo lesson in the sticky contact', async () => {
    const html = await render(StickyContact);
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('href="/lectie-demo/"');
    expect(html).toContain('aria-label="Contact rapid"');
  });

  it('lets the page override the demo link', async () => {
    const html = await render(StickyContact, { props: { demoHref: '#contact' } });
    expect(html).toContain('href="#contact"');
    expect(html).not.toContain('href="/lectie-demo/"');
  });
});
