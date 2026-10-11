export function canonicalUrl(pathname: string, base: string): string {
  const path = pathname.split(/[?#]/)[0] ?? '/';
  const withSlash = /\.[a-z0-9]+$/i.test(path) || path.endsWith('/') ? path : `${path}/`;
  return new URL(withSlash, base).href;
}

export function fullTitle(title: string, siteName: string): string {
  return title === siteName ? title : `${title} · ${siteName}`;
}
