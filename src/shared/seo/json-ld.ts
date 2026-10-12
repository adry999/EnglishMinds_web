export type OrganizationInput = {
  readonly name: string;
  readonly url: string;
  readonly telephone: string;
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly sameAs: readonly string[];
  readonly email?: string;
  /** Absolute url of the brand image, used as image and logo. */
  readonly image?: string;
};

export type CourseInput = {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly organizationUrl: string;
  readonly organizationName: string;
  readonly educationalLevel: string;
  readonly typicalAgeRange: string;
};

export type Crumb = { readonly name: string; readonly url: string };

export type BlogPostingInput = {
  readonly headline: string;
  readonly description: string;
  readonly url: string;
  readonly image: string;
  readonly datePublished: Date;
  readonly dateModified?: Date;
  readonly organizationUrl: string;
  readonly organizationName: string;
};

const CONTEXT = 'https://schema.org';
const organizationId = (url: string): string => new URL('./#organizatie', url).href;

/** Content still waiting for the client must never reach search engines. */
const hasTodo = (value: string): boolean => value.includes('TODO');
const usable = (value: string | undefined): value is string => Boolean(value) && !hasTodo(value as string);

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationJsonLd(input: OrganizationInput): object {
  return {
    '@context': CONTEXT,
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': organizationId(input.url),
    name: input.name,
    url: new URL('./', input.url).href,
    telephone: input.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: input.streetAddress,
      addressLocality: input.addressLocality,
      addressCountry: 'RO',
    },
    ...(usable(input.email) && { email: input.email }),
    ...(usable(input.image) && { image: input.image, logo: input.image }),
    areaServed: input.addressLocality,
    sameAs: [...input.sameAs],
  };
}

/** Null when no entry is publishable: an empty FAQPage is invalid. */
export function faqJsonLd(entries: readonly { question: string; answer: string }[]): object | null {
  const ready = entries.filter((entry) => !hasTodo(entry.question) && !hasTodo(entry.answer));
  if (ready.length === 0) return null;
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: ready.map((entry) => ({
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
    dateModified: (input.dateModified ?? input.datePublished).toISOString(),
    inLanguage: 'ro-RO',
    author: { '@type': 'Organization', '@id': org, name: input.organizationName },
    publisher: { '@id': org, name: input.organizationName },
  };
}

export function breadcrumbJsonLd(crumbs: readonly Crumb[]): object {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: crumb.url })),
  };
}

/** `'5–6 ani'` becomes `'5-6'`, the form schema.org expects for typicalAgeRange. */
export function ageRangeOf(ageGroup: string): string {
  return ageGroup.replace(/\s*ani\s*$/, '').replace('–', '-');
}

/** No `offers`: prices are not final yet. Add them here once site.courseFacts.monthlyPrice is a real number. */
export function courseJsonLd(input: CourseInput): object {
  return {
    '@context': CONTEXT,
    '@type': 'Course',
    name: input.name,
    ...(usable(input.description) && { description: input.description }),
    url: input.url,
    inLanguage: 'en',
    educationalLevel: input.educationalLevel,
    typicalAgeRange: input.typicalAgeRange,
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    provider: { '@type': 'EducationalOrganization', '@id': organizationId(input.organizationUrl), name: input.organizationName },
  };
}
