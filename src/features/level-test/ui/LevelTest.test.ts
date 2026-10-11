import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LevelTest from './LevelTest.astro';

describe('LevelTest.astro', () => {
  it('renders Ema, the bubble and a useful fallback without JavaScript', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LevelTest);
    expect(html).toContain('<level-test');
    expect(html).toContain('class="level-test__bubble"');
    expect(html).toContain('Hei, eu sunt Ema! Alege testul și începem.');
    expect(html).toContain('class="level-test__card"');
    expect(html).toContain('Testul pornește când JavaScript e activat în browser.');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toMatch(/<img[^>]*class="ema-portrait__img"/);
  });
});
