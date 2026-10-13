export function fadeInImages(root: ParentNode = document): void {
  for (const image of root.querySelectorAll<HTMLImageElement>('img')) {
    if (image.complete || image.loading === 'eager' || image.getAttribute('fetchpriority') === 'high') continue;
    const reveal = (): void => {
      image.removeEventListener('load', reveal);
      image.removeEventListener('error', reveal);
      delete image.dataset.loading;
    };
    image.addEventListener('load', reveal);
    image.addEventListener('error', reveal);
    image.dataset.fade = '';
    image.dataset.loading = '';
  }
}
