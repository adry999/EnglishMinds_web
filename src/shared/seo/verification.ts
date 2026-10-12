export type SeoVerification = {
  readonly googleSiteVerification: string;
  readonly bingSiteVerification: string;
};

export type MetaTag = { readonly name: string; readonly content: string };

/** Search Console and Bing tokens are plain URL-safe strings; anything else (empty, TODO, markup) is not rendered. */
const TOKEN = /^[A-Za-z0-9_-]{8,100}$/;

export function verificationMeta(seo: SeoVerification): MetaTag[] {
  const tags: MetaTag[] = [];
  if (TOKEN.test(seo.googleSiteVerification)) tags.push({ name: 'google-site-verification', content: seo.googleSiteVerification });
  if (TOKEN.test(seo.bingSiteVerification)) tags.push({ name: 'msvalidate.01', content: seo.bingSiteVerification });
  return tags;
}
