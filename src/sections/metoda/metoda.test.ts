import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import LevelPath from './LevelPath.astro';
import MetodaHero from './MetodaHero.astro';
import ParentBenefits from './ParentBenefits.astro';
import ThreeThings from './ThreeThings.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0]) {
  const container = await AstroContainer.create();
  return container.renderToString(component);
}

describe('method page sections', () => {
  it('hero asks the question in the h1', async () => {
    const html = await render(MetodaHero);
    expect(html).toContain('<h1');
    expect(html).toContain('De ce predăm după această metodă?');
    expect(html).toContain('Metoda Cambridge, pe înțelesul părinților');
  });

  it('lists the three things in order', async () => {
    const html = await render(ThreeThings);
    const titles = ['Engleza se vorbește din prima lecție', 'Niveluri recunoscute internațional', 'Adaptată vârstei'];
    const positions = titles.map((title) => html.indexOf(title));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('builds the level path from site.levels plus B1 Preliminary', async () => {
    const html = await render(LevelPath);
    for (const level of site.levels) {
      expect(html).toContain(level.name);
      expect(html).toContain(level.ageGroup);
    }
    expect(html).toContain('B1 Preliminary');
    expect(html).toContain('Examenele oficiale Cambridge sunt opționale');
    expect(html).toContain('centru de examen autorizat');
    expect(html).toContain('Academia pregătește copiii pentru ele și lucrează cu manuale Cambridge.');
    expect(html).not.toContain('diplomă recunoscută');
  });

  it('keeps the staircase bars decorative', async () => {
    const html = await render(LevelPath);
    const bars = html.match(/level-path__bar[^>]*aria-hidden="true"/g) ?? [];
    expect(bars).toHaveLength(site.levels.length + 1);
  });

  it('parent benefits end with a link to the level test', async () => {
    const html = await render(ParentBenefits);
    expect(html).toContain('Un nivel clar de pornire, stabilit la lecția demo');
    expect(html).toContain('href="/test-de-nivel/"');
  });
});
