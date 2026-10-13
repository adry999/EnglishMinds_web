export function canonicalUrl(pathname: string, base: string): string {
  const path = pathname.split(/[?#]/)[0] ?? '/';
  const withSlash = /\.[a-z0-9]+$/i.test(path) || path.endsWith('/') ? path : `${path}/`;
  return new URL(withSlash, base).href;
}

export function siteRootUrl(astroSite: URL | undefined, fallback: string, base: string): string {
  const prefix = base.replace(/\/+$/, '');
  return new URL(`${prefix}/`, astroSite ?? fallback).href;
}

export function fullTitle(title: string, siteName: string): string {
  return title === siteName ? title : `${title} · ${siteName}`;
}

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export function ogImageSize(source: { width: number; height: number }): { width: number; height: number } {
  const width = Math.min(OG_WIDTH, source.width, Math.floor((source.height * OG_WIDTH) / OG_HEIGHT));
  return { width, height: Math.round((width * OG_HEIGHT) / OG_WIDTH) };
}
