import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import CourseDetails from './CourseDetails.astro';
import GrupeHero from './GrupeHero.astro';
import LevelSection from './LevelSection.astro';
import TestBand from './TestBand.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0], options = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

describe('groups page sections', () => {
  it('hero has the h1 and a shortcut to every level anchor', async () => {
    const html = await render(GrupeHero);
    expect(html).toContain('Ce va învăța copilul tău la cursurile noastre de limbă engleză');
    for (const level of site.levels) expect(html).toContain(`href="#${level.slug}"`);
  });

  it('course details list every fact once, with the offer', async () => {
    const html = await render(CourseDetails);
    for (const label of ['Durată', 'Zile', 'Mărimea grupei', 'Manual', 'Preț']) expect(html).toContain(label);
    expect(html).toContain(site.courseFacts.duration);
    expect(html).toContain(site.offer.headline);
  });

  it('level section is anchored by slug and books the demo for that group', async () => {
    const level = site.levels[2];
    const html = await render(LevelSection, { props: { level } });
    expect(html).toContain(`id="${level.slug}"`);
    expect(html).toContain(`Nivelul ${level.name} · ${level.ageGroup}`);
    expect(html).toContain(level.description);
    for (const outcome of level.outcomes) expect(html).toContain(outcome);
    expect(html).toContain(`href="/lectie-demo/?grupa=${level.slug}"`);
  });

  it('test band links to the level test', async () => {
    expect(await render(TestBand)).toContain('href="/test-de-nivel/"');
  });
});
