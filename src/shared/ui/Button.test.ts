import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button from './Button.astro';

async function render(props: Record<string, unknown>, label = 'Apasă') {
  const container = await AstroContainer.create();
  return container.renderToString(Button, { props, slots: { default: label } });
}

describe('Button', () => {
  it('renders a primary link by default', async () => {
    expect(await render({ href: '/grupe/' })).toMatch(/<a class="button button--primary" href="\/grupe\/">Apasă<\/a>/);
  });

  it.each(['sun', 'navy', 'outline', 'outline-light', 'whatsapp'])('supports the %s variant', async (variant) => {
    expect(await render({ href: '/', variant })).toContain(`button--${variant}`);
  });

  it('passes an extra class through for layout', async () => {
    expect(await render({ href: '/', class: 'home-hero__primary' })).toMatch(
      /class="button button--primary home-hero__primary"/,
    );
  });
});
