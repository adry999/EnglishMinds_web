/**
 * Fades pictures in once they have loaded, over the photo background of their frame. Without JavaScript nothing
 * is ever marked, so every image is simply visible. Images that are already complete, and eager ones (the LCP
 * candidates), are never touched.
 */
export function fadeInImages(root: ParentNode = document): void {
  for (const image of root.querySelectorAll<HTMLImageElement>('img')) {
    if (image.complete || image.loading === 'eager' || image.getAttribute('fetchpriority') === 'high') continue;
    const reveal = (): void => {
      image.removeEventListener('load', reveal);
      image.removeEventListener('error', reveal);
      delete image.dataset.loading;
    };
    image.addEventListener('load', reveal);
    // A broken image must show its alt text, not stay invisible.
    image.addEventListener('error', reveal);
    image.dataset.fade = '';
    image.dataset.loading = '';
  }
}
