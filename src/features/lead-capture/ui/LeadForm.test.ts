import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LeadForm from './LeadForm.astro';

const render = async (props: Record<string, unknown>): Promise<string> =>
  (await AstroContainer.create()).renderToString(LeadForm, { props });

describe('LeadForm.astro', () => {
  it('renders a hidden form, a no-JS fallback and labelled fields', async () => {
    const html = await render({ source: 'landing', title: 'Rezervă locul acum' });
    expect(html).toContain('data-source="landing"');
    expect(html).toMatch(/<form[^>]*class="lead-form__form"[^>]*hidden/);
    expect(html).toContain('Formularul are nevoie de JavaScript');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('<label for="lead-landing-parentName">Numele părintelui</label>');
    expect(html).toContain('<label for="lead-landing-phone">Telefon</label>');
    expect(html).toContain('aria-describedby="lead-landing-phone-error"');
    expect(html).toContain('href="/confidentialitate/"');
    expect(html).toContain('name="website"');
    expect(html.match(/name="childAgeGroup"/g)).toHaveLength(5);
    expect(html).toMatch(/<h2[^>]*id="lead-landing-title"[^>]*>Rezervă locul acum<\/h2>/);
  });

  it('can drop the age groups, use an h3 and start hidden', async () => {
    const html = await render({ source: 'test', showAgeGroups: false, headingLevel: 3, title: 'T', hidden: true });
    expect(html).not.toContain('name="childAgeGroup"');
    expect(html).toMatch(/<h3[^>]*>T<\/h3>/);
    expect(html).toMatch(/<lead-form[^>]*\shidden/);
  });

  it('uses the sun button on navy and the orange one on cream', async () => {
    expect(await render({ source: 'home', tone: 'navy' })).toContain('button--sun lead-form__submit');
    expect(await render({ source: 'landing' })).toContain('button--primary lead-form__submit');
  });
});
