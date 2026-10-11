import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Faq from './Faq.astro';

const items = [
  { question: 'Prima?', answer: 'Unu' },
  { question: 'A doua?', answer: 'Doi' },
];

describe('Faq.astro', () => {
  it('renders every question and answer as plain HTML, visible without JavaScript', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Faq, { props: { items } });
    expect(html).toContain('<faq-list');
    expect(html).toContain('Prima?');
    expect(html).toContain('Unu');
    expect(html).toContain('id="faq-answer-1"');
    expect(html).not.toMatch(/\shidden(?=[\s>=])/);
  });

  it('uses the default heading', async () => {
    const container = await AstroContainer.create();
    expect(await container.renderToString(Faq, { props: { items } })).toContain('Întrebări frecvente');
  });
});
