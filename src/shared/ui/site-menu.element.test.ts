// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { defineSiteMenu } from './site-menu.element';

const MARKUP = `
  <site-menu>
    <button class="site-header__toggle" type="button" aria-expanded="false" aria-controls="site-nav" hidden>Meniu</button>
    <nav id="site-nav"><ul><li><a href="/grupe/">Grupe</a></li></ul></nav>
  </site-menu>`;

const menu = () => document.querySelector<HTMLElement>('site-menu')!;
const toggle = () => document.querySelector<HTMLButtonElement>('.site-header__toggle')!;

function attachAfterParsing(html: string): void {
  const holder = document.createElement('div');
  holder.innerHTML = html;
  document.body.replaceChildren(...holder.childNodes);
}

describe('<site-menu>', () => {
  beforeEach(() => {
    defineSiteMenu();
    attachAfterParsing(MARKUP);
  });

  it('shows the toggle and starts closed once enhanced', () => {
    expect(toggle().hidden).toBe(false);
    expect(menu().dataset.enhanced).toBe('true');
    expect(menu().hasAttribute('data-open')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens and closes the menu from the toggle', () => {
    toggle().click();
    expect(menu().hasAttribute('data-open')).toBe(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    toggle().click();
    expect(menu().hasAttribute('data-open')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('moves focus to the first link when the menu opens', () => {
    toggle().focus();
    toggle().click();
    expect(document.activeElement).toBe(document.querySelector('nav a'));
  });

  it('does not move focus when the menu closes', () => {
    toggle().click();
    toggle().focus();
    toggle().click();
    expect(document.activeElement).toBe(toggle());
  });

  it('closes on Escape and gives focus back to the toggle', () => {
    toggle().click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu().hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('ignores Escape while closed', () => {
    document.querySelector<HTMLAnchorElement>('nav a')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).not.toBe(toggle());
  });

  it('closes when a link is chosen', () => {
    toggle().click();
    document.querySelector<HTMLAnchorElement>('nav a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(menu().hasAttribute('data-open')).toBe(false);
  });
});
