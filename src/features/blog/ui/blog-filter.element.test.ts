// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { defineBlogFilter } from './blog-filter.element';

const MARKUP = `
  <blog-filter>
    <div class="blog-filter__pills">
      <button type="button" data-category="" aria-pressed="true">Toate</button>
      <button type="button" data-category="acasa" aria-pressed="false">Acasă</button>
      <button type="button" data-category="scoala" aria-pressed="false">Școală</button>
      <button type="button" data-category="motivatie" aria-pressed="false">Motivație</button>
    </div>
    <p class="blog-filter__status" aria-live="polite"></p>
    <ul class="blog-filter__list">
      <li data-category="acasa">A1</li>
      <li data-category="scoala">S1</li>
      <li data-category="acasa">A2</li>
    </ul>
  </blog-filter>`;

const items = () => [...document.querySelectorAll<HTMLElement>('.blog-filter__list > li')];
const pill = (category: string) => document.querySelector<HTMLButtonElement>(`button[data-category="${category}"]`)!;
const status = () => document.querySelector('.blog-filter__status')!.textContent;

describe('<blog-filter>', () => {
  beforeEach(() => {
    defineBlogFilter();
    const holder = document.createElement('div');
    holder.innerHTML = MARKUP;
    document.body.replaceChildren(...holder.childNodes);
  });

  it('marks itself enhanced and features the first post', () => {
    expect(document.querySelector('blog-filter')!.hasAttribute('data-enhanced')).toBe(true);
    expect(items().map((item) => item.hasAttribute('data-featured'))).toEqual([true, false, false]);
  });

  it('filters by category and features the first visible post', () => {
    pill('scoala').click();
    expect(items().map((item) => item.hidden)).toEqual([true, false, true]);
    expect(items()[1].hasAttribute('data-featured')).toBe(true);
    expect(pill('scoala').getAttribute('aria-pressed')).toBe('true');
    expect(pill('').getAttribute('aria-pressed')).toBe('false');
    expect(status()).toBe('1 articol');
  });

  it('shows everything again with "Toate"', () => {
    pill('acasa').click();
    pill('').click();
    expect(items().every((item) => !item.hidden)).toBe(true);
    expect(status()).toBe('3 articole');
  });

  it('explains an empty category instead of leaving a gap', () => {
    pill('motivatie').click();
    expect(items().every((item) => item.hidden)).toBe(true);
    expect(status()).toBe('Niciun articol în această categorie încă.');
  });

  it('does not enhance twice when reconnected', () => {
    const element = document.querySelector('blog-filter')!;
    element.remove();
    document.body.append(element);
    pill('scoala').click();
    expect(items().filter((item) => !item.hidden)).toHaveLength(1);
  });
});
