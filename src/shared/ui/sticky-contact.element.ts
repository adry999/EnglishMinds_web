export class StickyContact extends HTMLElement {
  private observer: IntersectionObserver | null = null;
  private readonly visible = new Set<Element>();

  private sync(): void {
    const bar = this.querySelector<HTMLElement>('.sticky-contact');
    if (bar) bar.hidden = this.visible.size > 0;
  }

  connectedCallback(): void {
    const selector = this.dataset.hideWhileVisible?.trim();
    if (!selector || typeof IntersectionObserver === 'undefined') return;
    const targets = [...document.querySelectorAll(selector)];
    if (targets.length === 0) return;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) this.visible.add(entry.target);
        else this.visible.delete(entry.target);
      }
      this.sync();
    });
    for (const target of targets) {
      this.visible.add(target);
      this.observer.observe(target);
    }
    this.sync();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.visible.clear();
    this.sync();
  }
}

export function defineStickyContact(): void {
  if (!customElements.get('sticky-contact')) customElements.define('sticky-contact', StickyContact);
}
