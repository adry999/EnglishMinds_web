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
    // 'shown' counts visible items so far; the first one becomes the featured card.
    let shown = 0;
    for (const item of this.items()) {
      const show = category === '' || item.dataset.category === category;
      item.hidden = !show;
      item.toggleAttribute('data-featured', show && shown === 0);
      if (show) shown += 1;
    }
    const status = this.querySelector('.blog-filter__status');
    if (status instanceof HTMLElement) {
      status.textContent = announce ? describeCount(shown) : '';
      status.toggleAttribute('data-empty', announce && shown === 0);
    }
  }
}

function describeCount(count: number): string {
  if (count === 0) return 'Niciun articol în această categorie încă.';
  return count === 1 ? '1 articol' : `${count} articole`;
}

export function defineBlogFilter(): void {
  if (!customElements.get('blog-filter')) customElements.define('blog-filter', BlogFilter);
}
