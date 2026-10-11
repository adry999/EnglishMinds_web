# SEO, politici, sitemap, JSON-LD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fiecare pagină are canonical, Open Graph și date structurate. Site-ul are `sitemap.xml` și `robots.txt`. Paginile `/confidentialitate/`, `/cookies/` și `/termeni/` există, cu ciorne pentru jurist.

**Architecture:** URL-ul public stă în `site.ts` (`site.url`) și alimentează `site` din `astro.config.ts`. Funcțiile pure care construiesc meta-urile și JSON-LD-ul stau în `src/shared/seo/`. `BaseLayout` primește props noi (`image`, `noindex`, `type`, `jsonLd`) și randează tot din `<head>`. `sitemap.xml` și `robots.txt` sunt endpointuri Astro proprii, fără dependență nouă. Textele legale sunt o colecție de conținut `legal`. Le randează o secțiune comună, care adaugă datele firmei din `site.company` și tabelul de cookie-uri exportat de feature-ul `consent`.

**Tech Stack:** Astro 7.3.8 static (`trailingSlash: 'always'`), content collections, `astro:assets` `getImage`, Vitest 5 (Container API + teste pe `dist/`).

**Spec:** `docs/superpowers/specs/2026-10-09-site-englishminds-design.md` (§1 Lighthouse SEO ≥ 90, §4 `content/legal`, `BaseLayout` cu SEO/OG/JSON-LD, §5 paginile legale, §6 Documente, §14 etapa 6)

## Global Constraints

- Fără `Co-Authored-By` sau mențiuni Claude în commituri și PR-uri.
- Nicio dependență nouă.
- Aliasuri `@features/`, `@shared/`, `@core/`, `@sections/`, `@layouts/`, `@assets/`; fără `../../`, fără `export *`, fără `catch {}` gol.
- Paginile, layout-urile și secțiunile intră într-un feature doar prin `index.ts`. `shared/` nu importă din `features/`.
- `site.ts` e singura sursă pentru contact, adresă și date firmă. Câmpurile `TODO` rămân `TODO`, iar build-ul de producție eșuează pe ele.
- URL public: `https://englishminds.ro` (domeniul din codul QR al flyerului). Toate URL-urile absolute se construiesc din `site.url`.
- `trailingSlash: 'always'`: canonical și sitemap folosesc URL-uri cu `/` final. Excepție: fișierele `sitemap.xml` și `robots.txt`.
- `404` are `noindex` și nu apare în sitemap.
- JSON-LD-ul se serializează sigur: `<` devine `<`, ca un text să nu poată închide `<script>`.
- Textele legale sunt ciorne în română, marcate vizibil „Document în curs de verificare juridică”. Nu inventează date de firmă: le iau din `site.company`.
- Contrast: text mic `#b8461a` doar pe alb/cream/peach. Focus navy pe fundal alb/cream.
- Commituri Conventional, în engleză, la imperativ. `npm run verify` verde la final de task.

## Review Focus

1. **Canonical relativ sau fără `/` final** strică indexarea. Testul din `dist/` cere canonical absolut, egal cu `site.url` + ruta cu `/` final, pe toate paginile (Task 1).
2. **JSON-LD invalid sau injectabil:** un titlu de articol cu `</script>` sau ghilimele trebuie să rămână JSON valid. Teste: unit pe `serializeJsonLd` (Task 2) și `JSON.parse` pe fiecare bloc din `dist/` (Task 2).
3. **Articole `draft` în sitemap:** sitemap-ul folosește aceeași sursă ca blogul (`getPublishedPosts`). Testul pe `dist/` cere ca toate articolele publicate să apară, iar 404 să lipsească (Task 3).
4. **Linkuri moarte:** footerul, bannerul de cookies și bifa formularului trimit la paginile legale. Un test pe `dist/` verifică că fiecare `href` intern din fiecare pagină există ca fișier în `dist/` (Task 4).
5. **Imaginea OG:** trebuie să fie un URL absolut către un fișier generat de build, de cel puțin 1200×630. Testul pe `dist/` verifică URL-ul absolut și că fișierul există (Task 1).

---

### Task 1: Meta SEO în `BaseLayout` (canonical, Open Graph, robots)

**Files:**
- Modify: `src/shared/content/site.ts` (cheie nouă `url`)
- Modify: `astro.config.ts` (`site: site.url`)
- Create: `src/shared/seo/page-meta.ts`
- Test: `src/shared/seo/page-meta.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/404.astro` (`noindex`)
- Modify: `tests/pages/pages.test.ts`

**Interfaces:**
- Produces:
  - `site.url: 'https://englishminds.ro'`;
  - `canonicalUrl(pathname: string, base: string): string`;
  - `fullTitle(title: string, siteName: string): string`;
  - `BaseLayout` props `{ title; description; image?: ImageMetadata; imageAlt?: string; type?: 'website' | 'article'; noindex?: boolean; jsonLd?: readonly object[] }`. `jsonLd` e doar declarat aici; Task 2 îl randează.

- [ ] **Step 1: URL-ul public**

În `src/shared/content/site.ts`, în obiectul `site`, după `name`:

```ts
  url: 'https://englishminds.ro',
```

În `astro.config.ts`, în `defineConfig`, adaugă `site: site.url,` (importul `site` există deja).

- [ ] **Step 2: Testele pentru funcțiile pure (eșuează)**

`src/shared/seo/page-meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canonicalUrl, fullTitle } from './page-meta';

describe('canonicalUrl', () => {
  it('joins the base and the path with a trailing slash', () => {
    expect(canonicalUrl('/grupe/', 'https://englishminds.ro')).toBe('https://englishminds.ro/grupe/');
    expect(canonicalUrl('/grupe', 'https://englishminds.ro')).toBe('https://englishminds.ro/grupe/');
    expect(canonicalUrl('/', 'https://englishminds.ro/')).toBe('https://englishminds.ro/');
  });

  it('keeps file routes without a trailing slash', () => {
    expect(canonicalUrl('/404.html', 'https://englishminds.ro')).toBe('https://englishminds.ro/404.html');
  });

  it('drops query and hash', () => {
    expect(canonicalUrl('/blog/?categorie=sfaturi#x', 'https://englishminds.ro')).toBe('https://englishminds.ro/blog/');
  });
});

describe('fullTitle', () => {
  it('appends the site name except on the home title', () => {
    expect(fullTitle('Grupe', 'English Minds Academy')).toBe('Grupe · English Minds Academy');
    expect(fullTitle('English Minds Academy', 'English Minds Academy')).toBe('English Minds Academy');
  });
});
```

Run: `npx vitest run src/shared/seo` → FAIL.

- [ ] **Step 3: Implementează**

`src/shared/seo/page-meta.ts`:

```ts
export function canonicalUrl(pathname: string, base: string): string {
  const path = pathname.split(/[?#]/)[0] ?? '/';
  const withSlash = /\.[a-z0-9]+$/i.test(path) || path.endsWith('/') ? path : `${path}/`;
  return new URL(withSlash, base).href;
}

export function fullTitle(title: string, siteName: string): string {
  return title === siteName ? title : `${title} · ${siteName}`;
}
```

Run: `npx vitest run src/shared/seo` → PASS.

- [ ] **Step 4: `BaseLayout`**

Înlocuiește frontmatter-ul și `<head>`-ul din `src/layouts/BaseLayout.astro`. Păstrează importurile de fonturi și stiluri, ordinea `<meta charset>` → `<ConsentDefaults />` → restul, și `<body>` neschimbat.

```astro
---
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
// ...importurile de fonturi/stiluri existente rămân...
import { ConsentDefaults, CookieConsent } from '@features/consent';
import { UtmCapture } from '@features/lead-capture';
import { photos } from '@shared/content/photos';
import { site } from '@shared/content/site';
import { canonicalUrl, fullTitle } from '@shared/seo/page-meta';

interface Props {
  title: string;
  description: string;
  image?: ImageMetadata;
  imageAlt?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: readonly object[];
}

const {
  title,
  description,
  image = photos.class,
  imageAlt = 'Copii la o lecție de engleză la English Minds Academy',
  type = 'website',
  noindex = false,
} = Astro.props;
const pageTitle = fullTitle(title, site.name);
const canonical = canonicalUrl(Astro.url.pathname, site.url);
const ogImage = await getImage({ src: image, width: 1200, height: 630, fit: 'cover', format: 'jpg' });
const ogImageUrl = new URL(ogImage.src, site.url).href;
---
<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <ConsentDefaults />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex" />}
    <meta property="og:type" content={type} />
    <meta property="og:locale" content="ro_RO" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content={imageAlt} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
```

Dacă `getImage` cu `fit: 'cover'` nu e acceptat de serviciul de imagini din Astro 7.3.8, verifică opțiunile în `node_modules/astro/dist/assets/types.d.ts`. Folosește echivalentul care produce exact 1200×630 și notează schimbarea în raport.

`src/pages/404.astro`: adaugă `noindex` pe `<BaseLayout>`. Pe `src/pages/blog/[id].astro` adaugă `type="article"`, `image={post.data.cover}` și `imageAlt={post.data.coverAlt}`.

- [ ] **Step 5: Teste pe `dist/` (eșuează înainte de build)**

În `tests/pages/pages.test.ts`, în `describe('built pages')`:

```ts
  const ROUTE: Record<string, string> = {
    'index.html': '/',
    'grupe/index.html': '/grupe/',
    'metoda-cambridge/index.html': '/metoda-cambridge/',
    'tabere/index.html': '/tabere/',
    'test-de-nivel/index.html': '/test-de-nivel/',
    'lectie-demo/index.html': '/lectie-demo/',
    'blog/index.html': '/blog/',
  };

  it.each(Object.entries(ROUTE))('%s has an absolute canonical and Open Graph tags', (page, route) => {
    const html = read(page);
    const url = `https://englishminds.ro${route}`;
    expect(html).toContain(`<link rel="canonical" href="${url}"`);
    expect(html).toContain(`<meta property="og:url" content="${url}"`);
    expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);
    expect(html).toMatch(/<meta property="og:description" content="[^"]+"/);
    expect(html).not.toContain('name="robots"');
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? '';
    expect(image).toMatch(/^https:\/\/englishminds\.ro\/_astro\/.+\.jpg$/);
    expect(existsSync(join(dist, image.replace('https://englishminds.ro/', '')))).toBe(true);
  });

  it('keeps the 404 page out of search results', () => {
    expect(read('404.html')).toContain('<meta name="robots" content="noindex"');
  });
```

Run: `npm run build && npm run test:dist` → PASS.

- [ ] **Step 6: Verify + commit**

Run: `npm run verify`

```bash
git add src/shared/content/site.ts astro.config.ts src/shared/seo src/layouts/BaseLayout.astro src/pages/404.astro "src/pages/blog/[id].astro" tests/pages/pages.test.ts
git commit -m "feat(seo): add canonical, Open Graph and robots meta to every page"
```

---

### Task 2: Date structurate JSON-LD

**Files:**
- Create: `src/shared/seo/json-ld.ts`
- Test: `src/shared/seo/json-ld.test.ts`
- Modify: `src/layouts/BaseLayout.astro` (randează `jsonLd`)
- Modify: `src/pages/index.astro` (organizație + FAQ)
- Modify: `src/pages/blog/[id].astro` (BlogPosting)
- Modify: `tests/pages/pages.test.ts`

**Interfaces:**
- Consumes:
  - `site` (`name`, `url`, `contact`, `faq`);
  - `canonicalUrl` (Task 1);
  - prop-ul `jsonLd` din `BaseLayout` (Task 1).
- Produces:
  - `serializeJsonLd(data: object): string`;
  - `organizationJsonLd(input: OrganizationInput): object`;
  - `faqJsonLd(entries: readonly { question: string; answer: string }[]): object`;
  - `blogPostingJsonLd(input: BlogPostingInput): object`.

- [ ] **Step 1: Testele (eșuează)**

`src/shared/seo/json-ld.test.ts`:

```ts
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
      inLanguage: 'ro-RO',
      author: { '@id': 'https://englishminds.ro/#organizatie' },
      publisher: { '@id': 'https://englishminds.ro/#organizatie', name: 'English Minds Academy' },
    });
  });
});
```

Run: `npx vitest run src/shared/seo` → FAIL.

- [ ] **Step 2: Implementează**

`src/shared/seo/json-ld.ts`:

```ts
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
```

Run: `npx vitest run src/shared/seo` → PASS.

- [ ] **Step 3: Randare**

`BaseLayout.astro`:
- Destructurează și `jsonLd = []`.
- Înainte de `</head>`:

```astro
    {jsonLd.map((data) => <script type="application/ld+json" is:inline set:html={serializeJsonLd(data)} />)}
```

(import `serializeJsonLd` din `@shared/seo/json-ld`).

`src/pages/index.astro`: transmite pe `<BaseLayout>` prop-ul de mai jos. Valorile vin din `site.contact`, deja importat sau de importat din `@shared/content/site`. `site.faq` e deja în `site`.

```astro
jsonLd={[
  organizationJsonLd({
    name: site.name,
    url: site.url,
    telephone: site.contact.phoneE164,
    streetAddress: site.contact.street,
    addressLocality: site.contact.city,
    sameAs: [site.contact.instagramUrl],
  }),
  faqJsonLd(site.faq),
]}
```

`src/pages/blog/[id].astro`: în frontmatter, construiește URL-ul absolut al copertei, cu aceleași opțiuni ca imaginea OG:

```ts
const cover = await getImage({ src: post.data.cover, width: 1200, height: 630, fit: 'cover', format: 'jpg' });
```

apoi transmite:

```astro
jsonLd={[
  blogPostingJsonLd({
    headline: post.data.title,
    description: post.data.description,
    url: canonicalUrl(Astro.url.pathname, site.url),
    image: new URL(cover.src, site.url).href,
    datePublished: post.data.publishedAt,
    organizationUrl: site.url,
    organizationName: site.name,
  }),
]}
```

- [ ] **Step 4: Teste pe `dist/`**

În `tests/pages/pages.test.ts`:

```ts
  const jsonLdBlocks = (html: string): unknown[] =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1] ?? ''));

  it('home describes the organization and the FAQ', () => {
    const types = jsonLdBlocks(read('index.html')).map((block) => (block as { '@type': unknown })['@type']);
    expect(types).toContainEqual(['EducationalOrganization', 'LocalBusiness']);
    expect(types).toContain('FAQPage');
  });

  it('every published article has a valid BlogPosting', () => {
    const posts = readdirSync(join(dist, 'blog')).filter((entry) => statSync(join(dist, 'blog', entry)).isDirectory());
    expect(posts.length).toBeGreaterThan(0);
    for (const slug of posts) {
      const [block] = jsonLdBlocks(read(`blog/${slug}/index.html`)) as { '@type': string; url: string; image: string }[];
      expect(block?.['@type']).toBe('BlogPosting');
      expect(block?.url).toBe(`https://englishminds.ro/blog/${slug}/`);
      expect(block?.image).toMatch(/^https:\/\/englishminds\.ro\/_astro\/.+\.jpg$/);
    }
  });
```

Run: `npm run build && npm run test:dist` → PASS.

- [ ] **Step 5: Verify + commit**

Run: `npm run verify`

```bash
git add src/shared/seo src/layouts/BaseLayout.astro src/pages/index.astro "src/pages/blog/[id].astro" tests/pages/pages.test.ts
git commit -m "feat(seo): describe the academy, the FAQ and blog posts with JSON-LD"
```

---

### Task 3: `sitemap.xml` și `robots.txt`

**Files:**
- Create: `src/shared/seo/sitemap.ts`
- Test: `src/shared/seo/sitemap.test.ts`
- Create: `src/pages/sitemap.xml.ts`
- Create: `src/pages/robots.txt.ts`
- Modify: `tests/pages/pages.test.ts`

**Interfaces:**
- Consumes: `site.url`; `getPublishedPosts` from `@features/blog` (same source as the blog).
- Produces:
  - `SitemapEntry = { readonly path: string; readonly lastmod?: Date }`;
  - `renderSitemap(entries, base): string`;
  - `renderRobots(base): string`;
  - `STATIC_ROUTES`.

- [ ] **Step 1: Testele (eșuează)**

`src/shared/seo/sitemap.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, renderRobots, renderSitemap } from './sitemap';

describe('renderSitemap', () => {
  it('lists absolute urls with trailing slashes and optional lastmod', () => {
    const xml = renderSitemap(
      [{ path: '/' }, { path: '/blog/a&b/', lastmod: new Date('2026-09-01T10:00:00Z') }],
      'https://englishminds.ro',
    );
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(xml).toContain('<url><loc>https://englishminds.ro/</loc></url>');
    expect(xml).toContain('<url><loc>https://englishminds.ro/blog/a&amp;b/</loc><lastmod>2026-09-01</lastmod></url>');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });
});

describe('renderRobots', () => {
  it('allows everything and points to the sitemap', () => {
    expect(renderRobots('https://englishminds.ro')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://englishminds.ro/sitemap.xml\n',
    );
  });
});

describe('STATIC_ROUTES', () => {
  it('covers every indexable page and never the 404', () => {
    expect(STATIC_ROUTES).toEqual([
      '/',
      '/grupe/',
      '/metoda-cambridge/',
      '/test-de-nivel/',
      '/lectie-demo/',
      '/tabere/',
      '/blog/',
      '/confidentialitate/',
      '/cookies/',
      '/termeni/',
    ]);
  });
});
```

Run: `npx vitest run src/shared/seo` → FAIL.

- [ ] **Step 2: Implementează**

`src/shared/seo/sitemap.ts`:

```ts
import { canonicalUrl } from './page-meta';

export type SitemapEntry = {
  readonly path: string;
  readonly lastmod?: Date;
};

/** Every indexable page that is not generated from content. Keep in sync with src/pages. */
export const STATIC_ROUTES = [
  '/',
  '/grupe/',
  '/metoda-cambridge/',
  '/test-de-nivel/',
  '/lectie-demo/',
  '/tabere/',
  '/blog/',
  '/confidentialitate/',
  '/cookies/',
  '/termeni/',
] as const;

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function renderSitemap(entries: readonly SitemapEntry[], base: string): string {
  const urls = entries.map((entry) => {
    const loc = `<loc>${escapeXml(canonicalUrl(entry.path, base))}</loc>`;
    const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>` : '';
    return `<url>${loc}${lastmod}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function renderRobots(base: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', base).href}\n`;
}
```

`src/pages/sitemap.xml.ts`:

```ts
import type { APIRoute } from 'astro';
import { getPublishedPosts } from '@features/blog';
import { site } from '@shared/content/site';
import { STATIC_ROUTES, renderSitemap } from '@shared/seo/sitemap';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const entries = [
    ...STATIC_ROUTES.map((path) => ({ path })),
    ...posts.map((post) => ({ path: `/blog/${post.id}/`, lastmod: post.data.publishedAt })),
  ];
  return new Response(renderSitemap(entries, site.url), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
```

`src/pages/robots.txt.ts`:

```ts
import type { APIRoute } from 'astro';
import { site } from '@shared/content/site';
import { renderRobots } from '@shared/seo/sitemap';

export const GET: APIRoute = () =>
  new Response(renderRobots(site.url), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

Dacă `getPublishedPosts` include ciornele în `DEV`, e corect: build-ul rulează în producție (`import.meta.env.DEV` e `false`).

- [ ] **Step 3: Teste pe `dist/`**

În `tests/pages/pages.test.ts`:

```ts
  it('the sitemap lists every built page except the 404, and every published article', () => {
    const xml = read('sitemap.xml');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const built = readdirSync(dist, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('index.html'))
      .map((file) => `https://englishminds.ro/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}`);
    expect([...locs].sort()).toEqual([...built].sort());
    expect(xml).not.toContain('404');
  });

  it('robots.txt points to the sitemap', () => {
    expect(read('robots.txt')).toContain('Sitemap: https://englishminds.ro/sitemap.xml');
  });
```

Testul pică până există paginile legale din Task 4: `STATIC_ROUTES` le conține, dar ele nu sunt încă construite. Marchează-l `it.todo` în acest task și activează-l în Task 4. Notează asta în raport.

Run: `npm run build && npm run test:dist` → PASS (cu testul de sitemap ca `todo`).

- [ ] **Step 4: Verify + commit**

Run: `npm run verify`

```bash
git add src/shared/seo src/pages/sitemap.xml.ts src/pages/robots.txt.ts tests/pages/pages.test.ts
git commit -m "feat(seo): publish sitemap.xml and robots.txt"
```

---

### Task 4: Paginile legale

**Files:**
- Modify: `src/content.config.ts` (colecția `legal`)
- Create: `src/content/legal/confidentialitate.md`, `src/content/legal/cookies.md`, `src/content/legal/termeni.md`
- Create: `src/features/consent/model/cookie-inventory.ts` + export în `src/features/consent/index.ts`
- Test: `src/features/consent/model/cookie-inventory.test.ts`
- Create: `src/sections/legal/LegalDocument.astro`, `src/sections/legal/legal.css`
- Test: `src/sections/legal/legal.test.ts`
- Create: `src/pages/confidentialitate.astro`, `src/pages/cookies.astro`, `src/pages/termeni.astro`
- Modify: `tests/pages/pages.test.ts` (paginile noi în `PAGES`/`ROUTE`, testul de sitemap activat, verificatorul de linkuri)
- Create: `docs/operare/registru-prelucrare.md`

**Interfaces:**
- Consumes:
  - `site.company` (`legalName`, `cui`, `registeredOffice`), `site.contact`, `site.name`;
  - `POLICY_VERSION` din `@shared/contracts/policy`;
  - `COOKIE_REVISION` din `src/features/consent/ui/consent-config.ts`, prin export nou în `index.ts`;
  - `BaseLayout`, `Header`, `Footer`.
- Produces:
  - `COOKIE_INVENTORY: readonly CookieInfo[]`, cu `CookieInfo = { category: 'necessary' | 'analytics' | 'marketing'; service: string; names: string; duration: string; purpose: string }`;
  - `LegalDocument.astro` with props `{ entry: CollectionEntry<'legal'>; showCookies?: boolean }`.

- [ ] **Step 1: Inventarul de cookie-uri (test → implementare)**

`src/features/consent/model/cookie-inventory.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COOKIE_INVENTORY } from './cookie-inventory';

describe('COOKIE_INVENTORY', () => {
  it('lists the consent cookie and every cookie the banner clears on withdrawal', () => {
    const names = COOKIE_INVENTORY.map((c) => c.names).join(' ');
    for (const name of ['em_consent', '_ga', '_gid', '_fbp', '_fbc', '_gcl']) expect(names).toContain(name);
  });

  it('only uses the three banner categories and fills every column', () => {
    for (const cookie of COOKIE_INVENTORY) {
      expect(['necessary', 'analytics', 'marketing']).toContain(cookie.category);
      for (const value of Object.values(cookie)) expect(value.trim()).not.toBe('');
    }
  });
});
```

`src/features/consent/model/cookie-inventory.ts`. Valorile sunt cele din `docs/operare/taguri.md`; păstrează-le identice.

```ts
export type CookieInfo = {
  readonly category: 'necessary' | 'analytics' | 'marketing';
  readonly service: string;
  readonly names: string;
  readonly duration: string;
  readonly purpose: string;
};

export const COOKIE_INVENTORY: readonly CookieInfo[] = [
  { category: 'necessary', service: 'English Minds Academy', names: 'em_consent', duration: '182 de zile', purpose: 'Ține minte alegerea ta despre cookie-uri.' },
  { category: 'analytics', service: 'Google Analytics 4', names: '_ga, _ga_*', duration: '2 ani', purpose: 'Numără vizitele și paginile citite.' },
  { category: 'analytics', service: 'Google Analytics 4', names: '_gid', duration: '24 de ore', purpose: 'Deosebește vizitatorii în aceeași zi.' },
  { category: 'marketing', service: 'Meta Pixel', names: '_fbp, _fbc', duration: '90 de zile', purpose: 'Arată ce reclame Meta aduc rezervări.' },
  { category: 'marketing', service: 'Google Ads', names: '_gcl_*', duration: '90 de zile', purpose: 'Arată ce reclame Google aduc rezervări.' },
];
```

În `src/features/consent/index.ts` adaugă:

```ts
export { COOKIE_INVENTORY, type CookieInfo } from './model/cookie-inventory';
export { COOKIE_REVISION } from './ui/consent-config';
```

Dacă `docs/operare/taguri.md` are altă durată pentru `_gid`, aliniază `taguri.md` la 24 de ore și notează schimbarea.

Run: `npx vitest run src/features/consent` → PASS.

- [ ] **Step 2: Colecția `legal`**

În `src/content.config.ts`:

```ts
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = { blog, legal };
```

- [ ] **Step 3: Textele (ciorne pentru jurist)**

Trei fișiere Markdown, în română, scrise simplu, pentru un părinte. Frontmatter-ul: `title`, `description` (o frază, ~150 de caractere) și `updatedAt: 2026-10-12`. Datele firmei nu se scriu în Markdown, fiindcă secțiunea le adaugă din `site.company`. Nu inventa date: fără CUI, fără nume de firmă, fără adresă de email.

`confidentialitate.md` („Politica de confidențialitate”) acoperă, câte un `##` fiecare:
- **Cine suntem:** trimite la blocul „Operator” afișat deasupra.
- **Ce date colectăm prin formular:**
  - numele părintelui, telefonul, grupa de vârstă a copilului;
  - pagina de pe care a venit cererea și, dacă există, nivelul recomandat de test;
  - parametrii UTM ai campaniei;
  - momentul acordului și versiunea politicii.
- **Ce nu colectăm:**
  - numele copilului (diploma se face doar în browser);
  - răspunsurile la test;
  - IP-ul în clar (doar o amprentă, pentru limitarea abuzurilor, ștearsă după 24 de ore);
  - user-agent-ul.
- **De ce:**
  - să te contactăm pentru lecția demo;
  - temei: consimțământul tău, art. 6 alin. (1) lit. a GDPR.
- **Cât timp:** 12 luni, apoi ștergere automată.
- **Cine le primește:**
  - furnizorul de găzduire, în UE;
  - emailul academiei;
  - WhatsApp (Meta), doar dacă alegi să trimiți mesajul. Atunci se aplică și politica WhatsApp.
- **Statistici și reclame:** doar cu acordul din bannerul de cookies; fără nume sau telefon. Link spre `/cookies/`.
- **Drepturile tale:**
  - acces, rectificare, ștergere, restricționare, portabilitate;
  - retragerea acordului oricând, fără efect asupra prelucrării de dinainte;
  - plângere la ANSPDCP (www.dataprotection.ro).
- **Cum ne contactezi:** telefonul afișat în blocul „Operator”.
- **Versiunea politicii:** secțiunea o afișează automat.

`cookies.md` („Politica de cookies”) acoperă:
- ce sunt cookie-urile;
- cele trei categorii (necesare / statistici / marketing) și ce face fiecare;
- tabelul, pe care îl afișează automat secțiunea;
- cum îți schimbi alegerea: butonul „Setări cookies” din subsolul paginii;
- ce se întâmplă la retragere: ștergem cookie-urile categoriei și reîncărcăm pagina;
- cookie-urile terților: Google și Meta, cu linkuri spre politicile lor.

`termeni.md` („Termeni și condiții”) acoperă:
- cine operează site-ul (blocul „Operator”);
- informațiile de pe site (prețuri, program, tabere) sunt orientative; oferta finală se confirmă direct;
- lecția demo e gratuită și nu obligă la înscriere;
- testul de nivel și diploma sunt orientative, nu certificări Cambridge;
- conținutul (texte, fotografii, logo) aparține English Minds Academy;
- răspunderea pentru linkurile externe;
- legea aplicabilă: legea română;
- litigiile: soluționare amiabilă, apoi instanțele competente;
- protecția consumatorului: ANPC (anpc.ro);
- modificări ale termenilor, cu data actualizării.

Plățile online nu fac parte din site (spec §11), deci nu se menționează.

- [ ] **Step 4: Secțiunea `LegalDocument`**

`src/sections/legal/LegalDocument.astro`:
- Props `{ entry: CollectionEntry<'legal'>; showCookies?: boolean; showPolicyVersion?: boolean }`.
- Randează în `<article class="legal">`, în ordine:
  - `<h1>` cu `entry.data.title`;
  - nota „Document în curs de verificare juridică.” într-un `<p class="legal__draft" role="note">`;
  - data actualizării în format `12 octombrie 2026` (`toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })`), în `<time datetime>`;
  - blocul „Operator” (`<dl>`): denumire (`site.company.legalName`), CUI, sediu social, telefon (`site.contact.phoneDisplay`, cu link `tel:`), adresa academiei (`site.contact.street`, `site.contact.city`);
  - corpul Markdown (`render(entry)` → `<Content />`);
  - dacă `showCookies`, un `<table>` cu caption „Cookie-urile folosite”, coloanele Categorie / Serviciu / Cookie-uri / Durată / Scop, din `COOKIE_INVENTORY`. Categoriile se afișează ca „Necesare”, „Statistici”, „Marketing”. Sub tabel apare versiunea politicii de cookies (`COOKIE_REVISION`);
  - dacă `showPolicyVersion`, „Versiunea politicii: {POLICY_VERSION}”.
- Importă `COOKIE_INVENTORY` și `COOKIE_REVISION` din `@features/consent`.

`src/sections/legal/legal.css`:
- lățime de lectură ~70ch, centrată, cu `--gutter` lateral;
- tabelul cu scroll orizontal propriu într-un wrapper `overflow-x: auto`, nu pe pagină;
- linkurile: `--color-text-accent` pe fundal alb;
- nota de ciornă pe `--color-peach`, cu text navy.

Respectă contrastul din Global Constraints.

`src/sections/legal/legal.test.ts`, cu Container API, după modelul `src/sections/lectie-demo/lectie-demo.test.ts`:
- **Operator, ciornă, dată:** randat cu o intrare `legal` falsă, are blocul Operator cu valorile din `site.company`, nota de ciornă și `<time datetime="2026-10-12`.
- **Cu `showCookies`:** apare tabelul cu toate numele din `COOKIE_INVENTORY`.
- **Fără `showCookies`:** nu apare niciun `<table>`.

Dacă intrările de colecție nu se pot construi ușor în test, folosește `getEntry('legal', 'cookies')` sub Container. Notează abordarea în raport.

- [ ] **Step 5: Paginile**

Trei pagini subțiri, de exemplu `src/pages/cookies.astro`:

```astro
---
import { getEntry } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import LegalDocument from '@sections/legal/LegalDocument.astro';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';

const entry = await getEntry('legal', 'cookies');
if (!entry) throw new Error('Lipsește src/content/legal/cookies.md');
---
<BaseLayout title={entry.data.title} description={entry.data.description}>
  <Header />
  <main id="continut">
    <LegalDocument entry={entry} showCookies />
  </main>
  <Footer />
</BaseLayout>
```

`confidentialitate.astro` (cu `showPolicyVersion`) și `termeni.astro` urmează același model.

- [ ] **Step 6: Teste pe `dist/`**

În `tests/pages/pages.test.ts`:
- Adaugă `confidentialitate/index.html`, `cookies/index.html` și `termeni/index.html` în `PAGES` și în `ROUTE` (Task 1).
- Înlocuiește `it.todo` din Task 3 cu testul real de sitemap.
- Adaugă verificatorul de linkuri:

```ts
  it('every internal link on every page points to a built file', () => {
    const htmlFiles = readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.html'));
    const missing: string[] = [];
    for (const file of htmlFiles) {
      for (const [, href] of read(file).matchAll(/<a[^>]*\shref="(\/[^"#?]*)/g)) {
        const target = href?.endsWith('/') ? join(dist, href, 'index.html') : join(dist, href ?? '');
        if (!existsSync(target)) missing.push(`${file} → ${href}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the cookie policy shows the cookie table', () => {
    const html = read('cookies/index.html');
    for (const name of ['em_consent', '_ga', '_fbp', '_fbc', '_gcl_']) expect(html).toContain(name);
  });
```

Run: `npm run build && npm run test:dist` → PASS. Dacă verificatorul găsește linkuri moarte existente înainte de etapa asta, raportează-le cu lista exactă (NEEDS_CONTEXT). Nu le exclude din test.

- [ ] **Step 7: Registrul de prelucrare**

`docs/operare/registru-prelucrare.md`, în română, ca tabel sau listă de câmpuri conform art. 30 GDPR, pentru o singură activitate („Cereri pentru lecția demo”):
- operator: trimite la `site.ts` → `company`, cu mențiunea „de completat”;
- scop, categorii de persoane (părinți), categorii de date (lista din politică), destinatari (hosting UE, email, WhatsApp la alegerea persoanei), transferuri (niciunul de către academie; WhatsApp/Meta după politica proprie);
- termen de ștergere (12 luni, job zilnic);
- măsuri de securitate:
  - HTTPS;
  - credențiale doar în variabile de mediu;
  - interogări parametrizate;
  - IP doar ca hash cu salt, șters după 24 de ore;
  - limită de 5 cereri pe oră;
  - log fără date personale;
- trimiteri spre `docs/operare/date-personale.md` și `docs/operare/taguri.md`.

Marchează documentul „de verificat de jurist”.

- [ ] **Step 8: Verify + commit**

Run: `npm run verify`

```bash
git add src/content.config.ts src/content/legal src/features/consent src/sections/legal src/pages/confidentialitate.astro src/pages/cookies.astro src/pages/termeni.astro tests/pages/pages.test.ts docs/operare/registru-prelucrare.md docs/operare/taguri.md
git commit -m "feat(legal): add the privacy, cookie and terms pages with the processing register"
```

---

## Decizii

1. **Domeniul `https://englishminds.ro`.** Este singurul domeniu din materialele clientului (codul QR al flyerului). Stă într-un singur loc (`site.url`), deci schimbarea costă o linie.
2. **Sitemap propriu, fără `@astrojs/sitemap`.** Sunt 10 rute plus articolele, iar o dependență în plus nu se justifică. Lista statică e testată pe `dist/` contra paginilor construite, deci nu poate rămâne în urmă fără să cadă testul.
3. **JSON-LD:** `EducationalOrganization` + `LocalBusiness` și `FAQPage` pe pagina principală, `BlogPosting` pe articole. Fără `Course` sau `Event` pentru tabere până nu există date reale (sunt `TODO`).
4. **Imaginea OG implicită** e fotografia `class.jpg`, decupată la 1200×630. Articolele își folosesc coperta.
5. **Datele firmei se afișează din `site.company`**, nu din Markdown. Câmpurile sunt `TODO`, deci build-ul de producție eșuează până le dă clientul: paginile legale nu pot ieși fără ele.
6. **Inventarul de cookie-uri trăiește în feature-ul `consent`** (`COOKIE_INVENTORY`). Pagina de cookies îl afișează, iar `taguri.md` îl descrie pentru operator.
7. **Pagina „Termeni” nu pomenește plăți online**, fiindcă sunt în afara scopului (spec §11).
