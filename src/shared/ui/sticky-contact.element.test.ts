// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineStickyContact } from './sticky-contact.element';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let notify: Callback = () => undefined;
let observed: Element[] = [];
let disconnect = vi.fn();

class FakeObserver {
  constructor(callback: Callback) {
    notify = callback;
    disconnect = this.disconnect;
  }
  observe = vi.fn((target: Element) => {
    observed.push(target);
  });
  disconnect = vi.fn();
}

const MARKUP = `
  <div class="hero-actions">botoane</div>
  <form class="contact-form">formular</form>
  <sticky-contact data-hide-while-visible=".hero-actions, .contact-form">
    <nav class="sticky-contact" aria-label="Contact rapid"><a href="#a">A</a></nav>
  </sticky-contact>`;

const bar = () => document.querySelector<HTMLElement>('.sticky-contact')!;
const hero = () => document.querySelector('.hero-actions')!;
const form = () => document.querySelector('.contact-form')!;
const report = (target: Element, isIntersecting: boolean) => notify([{ target, isIntersecting }]);

function mount(markup = MARKUP): void {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  document.body.replaceChildren(...holder.childNodes);
}

beforeEach(() => {
  observed = [];
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  defineStickyContact();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<sticky-contact>', () => {
  it('observes every element matched by the comma-separated selector list', () => {
    mount();
    expect(observed).toEqual([hero(), form()]);
  });

  it('starts hidden while the targets have not been measured yet', () => {
    mount();
    expect(bar().hidden).toBe(true);
  });

  it('stays hidden while any of the targets is on screen', () => {
    mount();
    notify([
      { target: hero(), isIntersecting: true },
      { target: form(), isIntersecting: false },
    ]);
    expect(bar().hidden).toBe(true);
    report(hero(), false);
    report(form(), true);
    expect(bar().hidden).toBe(true);
  });

  it('shows the bar once none of the targets is on screen, and hides it again on the way back', () => {
    mount();
    notify([
      { target: hero(), isIntersecting: false },
      { target: form(), isIntersecting: false },
    ]);
    expect(bar().hidden).toBe(false);
    report(form(), true);
    expect(bar().hidden).toBe(true);
    report(form(), false);
    expect(bar().hidden).toBe(false);
  });

  it('hides the bar on every screen width, without checking a media query', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    mount();
    report(hero(), true);
    expect(bar().hidden).toBe(true);
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('never hides the bar when no selector is given', () => {
    mount(MARKUP.replace(' data-hide-while-visible=".hero-actions, .contact-form"', ''));
    expect(observed).toEqual([]);
    expect(bar().hidden).toBe(false);
  });

  it('leaves the bar alone when no target exists', () => {
    mount(MARKUP.replace('".hero-actions, .contact-form"', '".missing, .absent"'));
    expect(observed).toEqual([]);
    expect(bar().hidden).toBe(false);
  });

  it('leaves the bar alone without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    mount();
    expect(bar().hidden).toBe(false);
  });

  it('stops observing and shows the bar again when removed', () => {
    mount();
    const element = document.querySelector('sticky-contact')!;
    element.remove();
    expect(disconnect).toHaveBeenCalled();
    expect(element.querySelector<HTMLElement>('.sticky-contact')!.hidden).toBe(false);
  });
});
