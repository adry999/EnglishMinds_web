export type OrganizationInput = {
  readonly name: string;
  readonly url: string;
  readonly telephone: string;
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly sameAs: readonly string[];
};

export type BlogPostingInput = {
  readonly headline: string;
  readonly description: string;
  readonly url: string;
  readonly image: string;
  readonly datePublished: Date;
  readonly organizationUrl: string;
  readonly organizationName: string;
};

const CONTEXT = 'https://schema.org';
const organizationId = (url: string): string => new URL('/#organizatie', url).href;

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationJsonLd(input: OrganizationInput): object {
  return {
    '@context': CONTEXT,
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': organizationId(input.url),
    name: input.name,
    url: new URL('/', input.url).href,
    telephone: input.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: input.streetAddress,
      addressLocality: input.addressLocality,
      addressCountry: 'RO',
    },
    sameAs: [...input.sameAs],
  };
}

export function faqJsonLd(entries: readonly { question: string; answer: string }[]): object {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

export function blogPostingJsonLd(input: BlogPostingInput): object {
  const org = organizationId(input.organizationUrl);
  return {
    '@context': CONTEXT,
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    image: input.image,
    datePublished: input.datePublished.toISOString(),
    inLanguage: 'ro-RO',
    author: { '@id': org },
    publisher: { '@id': org, name: input.organizationName },
  };
}
