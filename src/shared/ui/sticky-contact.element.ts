const PHONE = '(max-width: 767.98px)';

export class StickyContact extends HTMLElement {
  private observer: IntersectionObserver | null = null;
  private phone: MediaQueryList | null = null;
  private targetVisible = true;

  private readonly sync = (): void => {
    const bar = this.querySelector<HTMLElement>('.sticky-contact');
    if (!bar) return;
    const hide = (this.phone?.matches ?? false) && this.targetVisible;
    bar.hidden = hide;
  };

  connectedCallback(): void {
    const selector = this.dataset.hideWhileVisible;
    const target = selector ? document.querySelector(selector) : null;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    this.phone = window.matchMedia(PHONE);
    this.phone.addEventListener('change', this.sync);
    this.observer = new IntersectionObserver((entries) => {
      const latest = entries.at(-1);
      if (latest) this.targetVisible = latest.isIntersecting;
      this.sync();
    });
    this.observer.observe(target);
    this.sync();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.phone?.removeEventListener('change', this.sync);
    this.phone = null;
  }
}

export function defineStickyContact(): void {
  if (!customElements.get('sticky-contact')) customElements.define('sticky-contact', StickyContact);
}
