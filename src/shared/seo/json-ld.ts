export type OrganizationInput = {
  readonly name: string;
  readonly url: string;
  readonly telephone: string;
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly sameAs: readonly string[];
  readonly email?: string;
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

const hasTodo = (value: string): boolean => value.includes('TODO');
const isPublishable = (value: string | undefined): value is string => value !== undefined && value !== '' && !hasTodo(value);

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
    ...(isPublishable(input.email) && { email: input.email }),
    ...(isPublishable(input.image) && { image: input.image, logo: input.image }),
    areaServed: input.addressLocality,
    sameAs: [...input.sameAs],
  };
}

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

export function ageRangeOf(ageGroup: string): string {
  return ageGroup.replace(/\s*ani\s*$/, '').replace('–', '-');
}

export function courseJsonLd(input: CourseInput): object {
  return {
    '@context': CONTEXT,
    '@type': 'Course',
    name: input.name,
    ...(isPublishable(input.description) && { description: input.description }),
    url: input.url,
    inLanguage: 'en',
    educationalLevel: input.educationalLevel,
    typicalAgeRange: input.typicalAgeRange,
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    provider: { '@type': 'EducationalOrganization', '@id': organizationId(input.organizationUrl), name: input.organizationName },
  };
}
