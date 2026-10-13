// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

function attachAfterParsing(html: string): void {
  const holder = document.createElement('div');
  holder.innerHTML = html;
  document.body.replaceChildren(...holder.childNodes);
}

describe('<faq-list>', () => {
  beforeEach(() => {
    defineFaqList();
    attachAfterParsing(MARKUP);
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

  describe('when connected before its children exist', () => {
    const ITEMS = `
      <div class="faq__item">
        <h3 class="faq__question">Prima?</h3>
        <div class="faq__answer" id="faq-answer-0"><p>Unu</p></div>
      </div>
      <div class="faq__item">
        <h3 class="faq__question">A doua?</h3>
        <div class="faq__answer" id="faq-answer-1"><p>Doi</p></div>
      </div>`;

    afterEach(() => {
      delete (document as unknown as Record<string, unknown>).readyState;
    });

    it('does not mark itself enhanced while empty, and enhances once reconnected with items', () => {
      document.body.replaceChildren();
      const list = document.createElement('faq-list');
      document.body.append(list);
      expect(list.hasAttribute('data-enhanced')).toBe(false);
      expect(toggles()).toHaveLength(0);

      list.innerHTML = ITEMS;
      list.remove();
      document.body.append(list);
      expect(toggles()).toHaveLength(2);
      expect(toggles().map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    });

    it('retries on DOMContentLoaded while the document is still loading', () => {
      Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
      document.body.replaceChildren();
      const list = document.createElement('faq-list');
      document.body.append(list);
      expect(toggles()).toHaveLength(0);

      list.innerHTML = ITEMS;
      document.dispatchEvent(new Event('DOMContentLoaded'));
      expect(toggles()).toHaveLength(2);
      expect(toggles().map((b) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    });
  });
});
