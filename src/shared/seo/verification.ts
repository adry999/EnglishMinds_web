export type SeoVerification = {
  readonly googleSiteVerification: string;
  readonly bingSiteVerification: string;
};

export type MetaTag = { readonly name: string; readonly content: string };

const URL_SAFE_TOKEN = /^[A-Za-z0-9_-]{8,100}$/;

export function verificationMeta(seo: SeoVerification): MetaTag[] {
  const tags: MetaTag[] = [];
  if (URL_SAFE_TOKEN.test(seo.googleSiteVerification)) tags.push({ name: 'google-site-verification', content: seo.googleSiteVerification });
  if (URL_SAFE_TOKEN.test(seo.bingSiteVerification)) tags.push({ name: 'msvalidate.01', content: seo.bingSiteVerification });
  return tags;
}
