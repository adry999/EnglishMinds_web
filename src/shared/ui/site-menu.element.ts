export class SiteMenu extends HTMLElement {
  private toggle: HTMLButtonElement | null = null;

  private readonly onToggle = (): void => this.setOpen(!this.hasAttribute('data-open'));

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.hasAttribute('data-open')) return;
    this.setOpen(false);
    this.toggle?.focus();
  };

  private readonly onLinkClick = (event: Event): void => {
    if (event.target instanceof Element && event.target.closest('a')) this.setOpen(false);
  };

  connectedCallback(): void {
    this.toggle = this.querySelector<HTMLButtonElement>('.site-header__toggle');
    if (!this.toggle) return;
    this.toggle.hidden = false;
    this.toggle.addEventListener('click', this.onToggle);
    this.querySelector('nav')?.addEventListener('click', this.onLinkClick);
    document.addEventListener('keydown', this.onKeydown);
    this.dataset.enhanced = 'true';
  }

  disconnectedCallback(): void {
    this.toggle?.removeEventListener('click', this.onToggle);
    this.querySelector('nav')?.removeEventListener('click', this.onLinkClick);
    document.removeEventListener('keydown', this.onKeydown);
  }

  private setOpen(open: boolean): void {
    this.toggleAttribute('data-open', open);
    this.toggle?.setAttribute('aria-expanded', String(open));
    if (open) this.querySelector<HTMLAnchorElement>('nav a')?.focus();
  }
}

export function defineSiteMenu(): void {
  if (!customElements.get('site-menu')) customElements.define('site-menu', SiteMenu);
}
