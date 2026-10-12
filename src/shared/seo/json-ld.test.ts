import { describe, expect, it } from 'vitest';
import { ageRangeOf, blogPostingJsonLd, breadcrumbJsonLd, courseJsonLd, faqJsonLd, organizationJsonLd, serializeJsonLd } from './json-ld';

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
  it('keeps the base path of a site served from a sub-folder', () => {
    const out = organizationJsonLd({ ...ORG, url: 'https://adry999.github.io/EnglishMinds_web/' });
    expect(out).toMatchObject({ '@id': 'https://adry999.github.io/EnglishMinds_web/#organizatie', url: 'https://adry999.github.io/EnglishMinds_web/' });
  });

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
      areaServed: 'Cluj-Napoca',
      sameAs: ['https://www.instagram.com/englishminds_academy/'],
    });
  });
});

describe('organizationJsonLd, optional fields', () => {
  it('adds email, logo, image and the served area when given', () => {
    const out = organizationJsonLd({ ...ORG, email: 'salut@englishminds.ro', image: 'https://englishminds.ro/_astro/og.jpg' });
    expect(out).toMatchObject({
      email: 'salut@englishminds.ro',
      image: 'https://englishminds.ro/_astro/og.jpg',
      logo: 'https://englishminds.ro/_astro/og.jpg',
      areaServed: 'Cluj-Napoca',
    });
  });

  it('leaves out TODO placeholders and missing values, never emitting them', () => {
    const out = organizationJsonLd({ ...ORG, email: 'TODO: adresa de email de contact' });
    expect(out).not.toHaveProperty('email');
    expect(out).not.toHaveProperty('image');
    expect(out).not.toHaveProperty('logo');
    expect(JSON.stringify(out)).not.toContain('TODO');
  });

  it('never sets priceRange', () => {
    expect(organizationJsonLd(ORG)).not.toHaveProperty('priceRange');
  });
});

describe('faqJsonLd, TODO guard', () => {
  it('skips entries whose question or answer still holds a TODO', () => {
    const out = faqJsonLd([
      { question: 'Q1?', answer: 'A1.' },
      { question: 'Q2?', answer: 'După metoda Cambridge, cu manualul TODO: manualul Cambridge folosit.' },
      { question: 'TODO: Q3?', answer: 'A3.' },
    ]);
    expect(out).toMatchObject({ mainEntity: [{ name: 'Q1?' }] });
    expect(JSON.stringify(out)).not.toContain('TODO');
  });

  it('returns null when nothing is left, so no empty FAQPage is published', () => {
    expect(faqJsonLd([{ question: 'Q?', answer: 'TODO' }])).toBeNull();
    expect(faqJsonLd([])).toBeNull();
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers the trail from 1 with absolute urls', () => {
    expect(
      breadcrumbJsonLd([
        { name: 'Acasă', url: 'https://englishminds.ro/' },
        { name: 'Blog', url: 'https://englishminds.ro/blog/' },
        { name: 'Un articol', url: 'https://englishminds.ro/blog/un-articol/' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Acasă', item: 'https://englishminds.ro/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://englishminds.ro/blog/' },
        { '@type': 'ListItem', position: 3, name: 'Un articol', item: 'https://englishminds.ro/blog/un-articol/' },
      ],
    });
  });
});

describe('ageRangeOf', () => {
  it('turns the display age group into a schema.org range', () => {
    expect(ageRangeOf('5–6 ani')).toBe('5-6');
    expect(ageRangeOf('13–14 ani')).toBe('13-14');
  });
});

describe('courseJsonLd', () => {
  const input = {
    name: 'Engleză pentru copii, nivel Starters',
    description: 'Primele cuvinte și propoziții.',
    url: 'https://englishminds.ro/grupe/#starters',
    organizationUrl: 'https://englishminds.ro',
    organizationName: 'English Minds Academy',
    educationalLevel: 'Starters',
    typicalAgeRange: '5-6',
  };

  it('describes the course with the organization as provider and a student audience', () => {
    expect(courseJsonLd(input)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Engleză pentru copii, nivel Starters',
      description: 'Primele cuvinte și propoziții.',
      url: 'https://englishminds.ro/grupe/#starters',
      inLanguage: 'en',
      educationalLevel: 'Starters',
      typicalAgeRange: '5-6',
      audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      provider: { '@type': 'EducationalOrganization', '@id': 'https://englishminds.ro/#organizatie', name: 'English Minds Academy' },
    });
  });

  it('emits no offers and no TODO text', () => {
    const out = courseJsonLd({ ...input, description: 'Ce învață. TODO: de completat' });
    expect(out).not.toHaveProperty('offers');
    expect(out).not.toHaveProperty('description');
    expect(JSON.stringify(out)).not.toContain('TODO');
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
