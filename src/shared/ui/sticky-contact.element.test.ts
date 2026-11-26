// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineStickyContact } from './sticky-contact.element';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let notify: Callback = () => undefined;

class FakeObserver {
  constructor(callback: Callback) {
    notify = callback;
  }
  observe = vi.fn();
  disconnect = vi.fn();
}

const MARKUP = `
  <div class="hero-actions">botoane</div>
  <sticky-contact data-hide-while-visible=".hero-actions">
    <nav class="sticky-contact" aria-label="Contact rapid"><a href="#a">A</a></nav>
  </sticky-contact>`;

const bar = () => document.querySelector<HTMLElement>('.sticky-contact')!;

function mount(markup = MARKUP): void {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  document.body.replaceChildren(...holder.childNodes);
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  defineStickyContact();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<sticky-contact>', () => {
  it('hides the bar while the hero buttons are on screen', () => {
    mount();
    expect(bar().hidden).toBe(true);
    notify([{ isIntersecting: true }]);
    expect(bar().hidden).toBe(true);
  });

  it('shows the bar once the hero buttons have scrolled out of view, and hides it again on the way back', () => {
    mount();
    notify([{ isIntersecting: false }]);
    expect(bar().hidden).toBe(false);
    notify([{ isIntersecting: true }]);
    expect(bar().hidden).toBe(true);
  });

  it('leaves the bar alone when the target does not exist', () => {
    mount(MARKUP.replace('hero-actions">', 'other">'));
    expect(bar().hidden).toBe(false);
  });

  it('leaves the bar alone without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    mount();
    expect(bar().hidden).toBe(false);
  });
});
