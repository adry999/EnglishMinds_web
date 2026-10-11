export class BlogFilter extends HTMLElement {
  connectedCallback(): void {
    if (this.dataset.enhanced === 'true') return;
    if (this.items().length === 0 && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      return;
    }
    this.dataset.enhanced = 'true';
    for (const pill of this.pills()) {
      pill.addEventListener('click', () => this.select(pill.dataset.category ?? ''));
    }
    this.select('', { announce: false });
  }

  private pills(): HTMLButtonElement[] {
    return [...this.querySelectorAll<HTMLButtonElement>('.blog-filter__pills [data-category]')];
  }

  private items(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('.blog-filter__list > [data-category]')];
  }

  private select(category: string, { announce = true } = {}): void {
    for (const pill of this.pills()) {
      pill.setAttribute('aria-pressed', String((pill.dataset.category ?? '') === category));
    }
    let visible = 0;
    for (const item of this.items()) {
      const show = category === '' || item.dataset.category === category;
      item.hidden = !show;
      item.toggleAttribute('data-featured', show && visible === 0);
      if (show) visible += 1;
    }
    const status = this.querySelector('.blog-filter__status');
    if (status) status.textContent = announce ? describeCount(visible) : '';
  }
}

function describeCount(count: number): string {
  if (count === 0) return 'Niciun articol în această categorie încă.';
  return count === 1 ? '1 articol' : `${count} articole`;
}

export function defineBlogFilter(): void {
  if (!customElements.get('blog-filter')) customElements.define('blog-filter', BlogFilter);
}
