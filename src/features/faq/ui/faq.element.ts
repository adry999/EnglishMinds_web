export class FaqList extends HTMLElement {
  connectedCallback(): void {
    if (this.dataset.enhanced === 'true') return;
    this.dataset.enhanced = 'true';
    for (const item of this.items()) {
      const question = item.querySelector<HTMLElement>('.faq__question');
      const answer = item.querySelector<HTMLElement>('.faq__answer');
      if (!question || !answer) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'faq__toggle';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', answer.id);
      button.append(...question.childNodes);
      question.append(button);
      answer.hidden = true;
      button.addEventListener('click', () => this.toggle(item));
    }
  }

  private items(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(':scope > .faq__item')];
  }

  private toggle(target: HTMLElement): void {
    const wasOpen = target.querySelector('.faq__toggle')?.getAttribute('aria-expanded') === 'true';
    for (const item of this.items()) {
      const open = item === target && !wasOpen;
      item.querySelector('.faq__toggle')?.setAttribute('aria-expanded', String(open));
      const answer = item.querySelector<HTMLElement>('.faq__answer');
      if (answer) answer.hidden = !open;
    }
  }
}

export function defineFaqList(): void {
  if (!customElements.get('faq-list')) customElements.define('faq-list', FaqList);
}
