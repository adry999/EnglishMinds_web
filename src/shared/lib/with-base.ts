/** Prefixes a root-absolute path with the base the site is served from. Anything else is returned as is. */
export function joinBase(path: string, base: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const prefix = base.replace(/\/+$/, '');
  return `${prefix}${path}`;
}

/** Use for every internal link and asset: the preview lives under /EnglishMinds_web/, production under /. */
export function withBase(path: string): string {
  return joinBase(path, import.meta.env.BASE_URL);
}
