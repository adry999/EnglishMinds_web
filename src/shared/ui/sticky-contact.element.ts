export class StickyContact extends HTMLElement {
  private observer: IntersectionObserver | null = null;

  private sync(targetVisible: boolean): void {
    const bar = this.querySelector<HTMLElement>('.sticky-contact');
    if (bar) bar.hidden = targetVisible;
  }

  connectedCallback(): void {
    const selector = this.dataset.hideWhileVisible;
    const target = selector ? document.querySelector(selector) : null;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver((entries) => {
      const latest = entries.at(-1);
      if (latest) this.sync(latest.isIntersecting);
    });
    this.observer.observe(target);
    this.sync(true);
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

export function defineStickyContact(): void {
  if (!customElements.get('sticky-contact')) customElements.define('sticky-contact', StickyContact);
}
