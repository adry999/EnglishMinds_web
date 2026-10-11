import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ConsentDefaults from './ConsentDefaults.astro';

describe('ConsentDefaults', () => {
  it('renders the denied defaults as a plain inline script', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ConsentDefaults);
    expect(html).toMatch(/^<script>window\.dataLayer=/);
    expect(html).toContain(`"analytics_storage":"denied"`);
    expect(html).toContain(`"ad_user_data":"denied"`);
    expect(html).not.toContain('type="module"');
  });
});
