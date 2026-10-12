import { describe, expect, it } from 'vitest';
import { blogPostingJsonLd, faqJsonLd, organizationJsonLd, serializeJsonLd } from './json-ld';

const ORG = {
  name: 'English Minds Academy',
  url: 'https://englishminds.ro',
  telephone: '+40775630680',
  streetAddress: 'Str. Observatorului 90, et.2',
  addressLocality: 'Cluj-Napoca',
  sameAs: ['https://www.instagram.com/englishminds_academy/'],
};

describe('serializeJsonLd', () => {
  it('produces JSON that cannot close the script tag', () => {
    const out = serializeJsonLd({ headline: 'A </script><script>alert(1)</script> "B"' });
    expect(out).not.toContain('</script');
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ headline: 'A </script><script>alert(1)</script> "B"' });
  });
});

describe('organizationJsonLd', () => {
  it('describes a local educational organization in Cluj-Napoca', () => {
    expect(organizationJsonLd(ORG)).toEqual({
      '@context': 'https://schema.org',
      '@type': ['EducationalOrganization', 'LocalBusiness'],
      '@id': 'https://englishminds.ro/#organizatie',
      name: 'English Minds Academy',
      url: 'https://englishminds.ro/',
      telephone: '+40775630680',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Str. Observatorului 90, et.2',
        addressLocality: 'Cluj-Napoca',
        addressCountry: 'RO',
      },
      sameAs: ['https://www.instagram.com/englishminds_academy/'],
    });
  });
});

describe('faqJsonLd', () => {
  it('maps each entry to a Question with an accepted Answer', () => {
    expect(faqJsonLd([{ question: 'Q1?', answer: 'A1.' }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1.' } }],
    });
  });
});

describe('blogPostingJsonLd', () => {
  it('describes the article with an absolute url, image and the organization as author', () => {
    expect(
      blogPostingJsonLd({
        headline: 'Titlu',
        description: 'Descriere',
        url: 'https://englishminds.ro/blog/titlu/',
        image: 'https://englishminds.ro/_astro/cover.jpg',
        datePublished: new Date('2026-09-01T00:00:00Z'),
        organizationUrl: 'https://englishminds.ro',
        organizationName: 'English Minds Academy',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Titlu',
      description: 'Descriere',
      url: 'https://englishminds.ro/blog/titlu/',
      mainEntityOfPage: 'https://englishminds.ro/blog/titlu/',
      image: 'https://englishminds.ro/_astro/cover.jpg',
      datePublished: '2026-09-01T00:00:00.000Z',
      dateModified: '2026-09-01T00:00:00.000Z',
      inLanguage: 'ro-RO',
      author: { '@type': 'Organization', '@id': 'https://englishminds.ro/#organizatie', name: 'English Minds Academy' },
      publisher: { '@id': 'https://englishminds.ro/#organizatie', name: 'English Minds Academy' },
    });
  });

  it('uses the update date as dateModified when the article was edited', () => {
    const post = blogPostingJsonLd({
      headline: 'Titlu',
      description: 'Descriere',
      url: 'https://englishminds.ro/blog/titlu/',
      image: 'https://englishminds.ro/_astro/cover.jpg',
      datePublished: new Date('2026-09-01T00:00:00Z'),
      dateModified: new Date('2026-10-01T00:00:00Z'),
      organizationUrl: 'https://englishminds.ro',
      organizationName: 'English Minds Academy',
    });
    expect(post).toMatchObject({ dateModified: '2026-10-01T00:00:00.000Z' });
  });
});
