export function joinBase(path: string, base: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const prefix = base.replace(/\/+$/, '');
  return `${prefix}${path}`;
}

export function withBase(path: string): string {
  return joinBase(path, import.meta.env.BASE_URL);
}
