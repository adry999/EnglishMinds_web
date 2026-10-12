// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { fadeInImages } from './image-fade';

function image(attributes: Record<string, string>, complete: boolean): HTMLImageElement {
  const img = document.createElement('img');
  for (const [name, value] of Object.entries(attributes)) img.setAttribute(name, value);
  Object.defineProperty(img, 'complete', { value: complete, configurable: true });
  document.body.append(img);
  return img;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('fadeInImages', () => {
  it('hides a pending lazy image until it loads', () => {
    const img = image({ loading: 'lazy' }, false);
    fadeInImages();
    expect(img.hasAttribute('data-loading')).toBe(true);
    expect(img.hasAttribute('data-fade')).toBe(true);
    img.dispatchEvent(new Event('load'));
    expect(img.hasAttribute('data-loading')).toBe(false);
    expect(img.hasAttribute('data-fade')).toBe(true);
  });

  it('shows the alt text of a broken image instead of keeping it hidden', () => {
    const img = image({ loading: 'lazy', alt: 'Copii' }, false);
    fadeInImages();
    img.dispatchEvent(new Event('error'));
    expect(img.hasAttribute('data-loading')).toBe(false);
  });

  it('leaves images that are already loaded alone', () => {
    const img = image({ loading: 'lazy' }, true);
    fadeInImages();
    expect(img.hasAttribute('data-loading')).toBe(false);
    expect(img.hasAttribute('data-fade')).toBe(false);
  });

  it('never hides the eager images, which are the LCP candidates', () => {
    const eager = image({ loading: 'eager' }, false);
    const high = image({ fetchpriority: 'high' }, false);
    fadeInImages();
    expect(eager.hasAttribute('data-loading')).toBe(false);
    expect(high.hasAttribute('data-loading')).toBe(false);
  });

  it('removes its listeners after the first event', () => {
    const img = image({ loading: 'lazy' }, false);
    fadeInImages();
    img.dispatchEvent(new Event('load'));
    img.dataset.loading = '';
    img.dispatchEvent(new Event('load'));
    expect(img.hasAttribute('data-loading')).toBe(true);
  });
});
