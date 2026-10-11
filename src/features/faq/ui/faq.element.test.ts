// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { defineFaqList } from './faq.element';

const MARKUP = `
  <faq-list>
    <div class="faq__item">
      <h3 class="faq__question">Prima?</h3>
      <div class="faq__answer" id="faq-answer-0"><p>Unu</p></div>
    </div>
    <div class="faq__item">
      <h3 class="faq__question">A doua?</h3>
      <div class="faq__answer" id="faq-answer-1"><p>Doi</p></div>
    </div>
  </faq-list>`;

const toggles = () => [...document.querySelectorAll<HTMLButtonElement>('.faq__toggle')];
const answers = () => [...document.querySelectorAll<HTMLElement>('.faq__answer')];

describe('<faq-list>', () => {
  beforeEach(() => {
    defineFaqList();
    // Parse detached, then attach: happy-dom fires connectedCallback before innerHTML children exist.
    const holder = document.createElement('div');
    holder.innerHTML = MARKUP;
    document.body.replaceChildren(...holder.childNodes);
  });

  it('turns each question into a collapsed toggle button', () => {
    expect(toggles()).toHaveLength(2);
    expect(toggles().map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    expect(toggles().map((b) => b.getAttribute('aria-controls'))).toEqual(['faq-answer-0', 'faq-answer-1']);
    expect(toggles()[0].textContent).toBe('Prima?');
    expect(answers().every((a) => a.hidden)).toBe(true);
  });

  it('opens an answer on click', () => {
    toggles()[0].click();
    expect(toggles()[0].getAttribute('aria-expanded')).toBe('true');
    expect(answers()[0].hidden).toBe(false);
  });

  it('keeps only one answer open', () => {
    toggles()[0].click();
    toggles()[1].click();
    expect(toggles().map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'true']);
    expect(answers().map((a) => a.hidden)).toEqual([true, false]);
  });

  it('closes an open answer when clicked again', () => {
    toggles()[0].click();
    toggles()[0].click();
    expect(toggles()[0].getAttribute('aria-expanded')).toBe('false');
    expect(answers()[0].hidden).toBe(true);
  });

  it('does not duplicate buttons when reconnected', () => {
    const list = document.querySelector('faq-list')!;
    list.remove();
    document.body.append(list);
    expect(toggles()).toHaveLength(2);
  });

  it('can be defined twice without throwing', () => {
    expect(() => defineFaqList()).not.toThrow();
  });
});
