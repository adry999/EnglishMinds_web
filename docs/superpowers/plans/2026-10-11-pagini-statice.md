# Pagini statice (etapa 2) — Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paginile publice fără formular: Acasă, Grupe, Metoda Cambridge, Tabere, Blog (listă + articol) și 404, responsive, cu imagini optimizate și conținut luat din `site.ts`.

**Architecture:**
- Paginile din `src/pages/` doar asamblează.
- Secțiunile specifice unei pagini stau într-un strat nou, `src/sections/<pagină>/`, la același nivel cu `pages/` și `layouts/`.
- Piesele vizuale reutilizabile stau în `src/shared/ui/`: Photo, EmaPortrait, Star, Eyebrow, Badge, StickyContact.
- Blogul e un feature (`src/features/blog/`) cu o colecție de conținut Astro și un Web Component de filtrare.
- Formularul de contact și testul de nivel nu intră aici. Acasă primește un loc pregătit (`<slot />`) pentru formular și o invitație spre `/test-de-nivel/`.

**Tech Stack:** Astro 7.3.8 (`astro:assets` `<Picture>`, content collections), Web Components, CSS simplu, Vitest 5 + Container API + happy-dom.

**Spec:** `docs/superpowers/specs/2026-10-09-site-englishminds-design.md` (§4 structură, §5 pagini).
**Conținut extras din design:** `docs/design/continut-pagini.md` (texte exacte, culori și mărimi pe secțiuni). Fiecare task îl citează.
**Convenții:** `.claude/skills/project-conventions/SKILL.md`.

## Decizii luate în acest plan (de confirmat la review)

1. **Stratul `src/sections/`.** Spec-ul vrea pagini „subțiri”, dar nu spune unde stau secțiunile unei singure pagini. Regulă nouă: doar `pages/` și alte `sections/` importă din `sections/`. Secțiunile importă `features/*` (prin index), `shared/`, `core/` și `styles/`. Regula e aplicată de ESLint și dependency-cruiser (Task 2).
2. **Un singur header pentru toate paginile.** Linkurile-ancoră din headerul paginii Acasă și meniul hamburger (nedesenat) dispar.
3. **Grupe: o singură pagină cu toate cele 5 grupe una sub alta**, cu scurtături spre `#starters`, `#pre-a1` etc., nu taburi JavaScript.
   - Motive: fără JS, fiecare grupă are adresa ei, iar motoarele de căutare văd tot conținutul.
   - „Detalii curs” și oferta apar o singură dată, nu de cinci ori.
4. **Testul scurt de pe Acasă devine invitație** spre `/test-de-nivel/` (spec §5).
5. **„Rezervă lecția demo” pe Grupe duce la `/lectie-demo/?grupa=<slug>`**, nu direct pe WhatsApp, ca să se salveze contactul (spec §1). Pagina vine în etapa 4.
6. **Harta din secțiunea Contact devine un link „Deschide în Google Maps”**, nu o hartă încorporată, care ar seta cookie-uri de la terți.
7. **Textele mici pe portocaliu au minimum 19px și grosime ≥ 700**, ca să treacă WCAG AA. Degradeul hero rămâne portocaliu plin sub text.
8. **Blog: cele 4 articole din design devin ciorne** (`draft: true`), cu textul de prezentare ca rezumat.
   - Apar doar în `npm run dev`. În producție, lista arată mesajul „Primele articole apar în curând.”
   - Scrierea articolelor e în afara scopului (spec §11).
9. **Conținut fără valori reale primește `TODO` în `site.ts`:** tot ce era între paranteze pătrate în design (tabără, manual, prețuri). Build-ul de producție se oprește până se completează.
   - Cardul „Metodologie Cambridge” nu mai numește „Kid’s Box”.
   - Răspunsul FAQ despre manual folosește `courseFacts.textbook`.
10. **Nivelurile de pe Metoda vin din `site.levels`**, cele 5 grupe, plus „B1 Preliminary – următorul pas”.
    - Varianta din design („Pre A1 Starters 5–8”, „A1 Movers”) contrazicea paginile Acasă și Grupe.
11. **Butonul fix WhatsApp/„Lecție demo” (`StickyContact`) apare doar pe Acasă**, ca în design.
12. **Footerul pe Acasă nu mai repetă blocul „Rezervă lecția demo”** (prop nou `showCta`), pentru că secțiunea Contact e chiar deasupra.

## Global Constraints

- Toate constrângerile din `docs/superpowers/plans/2026-10-11-fundatie.md` (Global Constraints) rămân valabile.
- Alias nou: `@assets/*` → `./src/assets/*`. Fotografiile se copiază din `design/assets/` în `src/assets/photos/` (`design/` nu se editează). `karina.jpg` nu se folosește.
- Imagini doar prin `src/shared/ui/Photo.astro` (`<Picture>`, formate `['avif','webp']`, `sizes` obligatoriu). Doar imaginea principală din hero primește `eager` (`loading="eager"`, `fetchpriority="high"`).
- Pe fundal portocaliu (`--color-orange` sau degrade), orice text are fie ≥ 19px (`--text-button`) și grosime ≥ 700, fie ≥ 24px.
- Hero-urile portocalii folosesc `--gradient-hero` (portocaliu plin pe primele 55%).
- Linkurile interne se termină în `/` (sau `/#ancoră`). Linkurile spre pagini din etapele următoare (`/test-de-nivel/`, `/lectie-demo/`, `/confidentialitate/` …) sunt intenționate.
- Texte vizibile: copiate exact din `docs/design/continut-pagini.md`, cu excepțiile din „Decizii”. Diacritice ș ț cu virgulă. Apostrof tipografic `’`.
- Conținutul editabil (contact, niveluri, ofertă, valori, program, tabere) stă doar în `site.ts`. Textele de prezentare ale unei pagini stau în secțiunea ei.
- Breakpoint-uri: mobil implicit (360px), `768px`, `1100px`. Nicio pagină nu derulează orizontal la 360px.

## Review Focus

1. **Pagina Grupe cu ancore:**
   - linkul `/grupe/#movers` de pe Acasă trebuie să ajungă la secțiunea Movers;
   - headerul nu e fix, deci nu acoperă titlul;
   - cu `prefers-reduced-motion` nu există derulare animată;
   - verificat în Task 5 (id-uri = slug-uri, test).
2. **Blog fără articole publicate în producție:**
   - lista trebuie să arate mesajul gol, nu o pagină goală sau o eroare de build;
   - `getStaticPaths` cu zero articole nu trebuie să crape;
   - verificat în Task 9 (test pe model + build cu `NODE_ENV=production`).
3. **Filtrul de blog fără JavaScript:** toate articolele vizibile și fără butoane moarte. Cu JavaScript, filtrarea pe o categorie goală afișează un mesaj, nu un spațiu gol. Test happy-dom în Task 9.
4. **Imaginea Ema decupată:** procentele din design (`161%`, `-61%`, `-19.1%`) trebuie aplicate pe `<img>`, nu pe `<picture>`, altfel fața iese din cerc. Test în Task 3 pe clasele generate.
5. **Textul pe portocaliu:** cardurile de valori, cardul 02 de pe Metoda, „Ce include” de pe Tabere și „Sfatul Emei” sunt locurile unde designul avea 16–18px/600. Testul CSS din Task 3 verifică tokenul, iar fiecare task cere verificarea vizuală.

---

### Task 1: Conținut — extinderea `site.ts`, fotografii, alias `@assets`

**Files:**
- Modify: `tsconfig.json`, `src/shared/content/site.ts`, `src/shared/content/site.test.ts`
- Create: `src/assets/photos/{class,hands,group,boy-reading,teacher-ema,ema-reading}.jpg` (copii din `design/assets/`)
- Create: `src/shared/content/photos.ts`, `src/shared/content/photos.test.ts`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Produces, în `site.ts`:
  - `type PhotoKey = 'class' | 'hands' | 'group' | 'boyReading' | 'teacherEma' | 'emaReading'`;
  - `type LevelSlug = 'starters' | 'pre-a1' | 'movers' | 'flyers' | 'a2-key'`;
  - `Level` primește în plus `slug: LevelSlug`, `summary: string` (descrierea scurtă de pe Acasă) și `photo: PhotoKey`;
  - `type ValueCard = { title: string; text: string; tone: 'navy' | 'orange' | 'sun' }`;
  - `type CampSlot = { time: string; title: string; text: string }`;
  - `site.offer = { label, headline, detail }`, `site.values: readonly ValueCard[]`, `site.contact.mapsUrl`;
  - `site.camps` primește în plus `year`, `ageRange`, `day: readonly CampSlot[]` și `includes: readonly string[]`.
- Produces, în `photos.ts`: `photos: Readonly<Record<PhotoKey, ImageMetadata>>`.
- Produces, în `tokens.css`: `--color-ema-bg: #ef8a2a`, `--color-photo-bg: #f3e3c8`, `--color-card-edge: #f0dcc0` (alias pentru `--color-cream-border`) și `--gradient-hero`.

- [ ] **Step 1: Copiază fotografiile și adaugă aliasul**

```powershell
New-Item -ItemType Directory -Force src/assets/photos | Out-Null
foreach ($f in 'class','hands','group','boy-reading','teacher-ema','ema-reading') { Copy-Item "design/assets/$f.jpg" "src/assets/photos/$f.jpg" }
```

În `tsconfig.json`, la `compilerOptions.paths`, adaugă:

```json
"@assets/*": ["./src/assets/*"]
```

- [ ] **Step 2: Scrie testele care pică**

Adaugă în `src/shared/content/site.test.ts`, în același `describe`:

```ts
  it('gives every level a unique kebab-case slug, a short summary and a photo', () => {
    const slugs = site.levels.map((level) => level.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const level of site.levels) {
      expect(level.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(level.summary.length).toBeGreaterThan(20);
      expect(level.summary.length).toBeLessThan(level.description.length + 1);
    }
  });

  it('has the pre-sale offer and three value cards in brand tones', () => {
    expect(site.offer.headline).toBe('4 + 1 lună cadou');
    expect(site.values.map((value) => value.tone)).toEqual(['navy', 'orange', 'sun']);
  });

  it('links the address to Google Maps', () => {
    expect(site.contact.mapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  });

  it('describes a camp day with four slots and four included items', () => {
    expect(site.camps.day).toHaveLength(4);
    expect(site.camps.includes).toHaveLength(4);
  });

  it('takes the textbook FAQ answer from courseFacts', () => {
    const answer = site.faq.find((entry) => entry.question === 'După ce metodă predați?')?.answer;
    expect(answer).toContain(site.courseFacts.textbook);
  });
```

`src/shared/content/photos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { photos } from '@shared/content/photos';
import { site } from '@shared/content/site';

describe('photos', () => {
  it('resolves every photo used by a level', () => {
    for (const level of site.levels) {
      expect(photos[level.photo].width).toBeGreaterThan(0);
    }
  });

  it('includes Ema', () => {
    expect(photos.emaReading.width).toBeGreaterThan(0);
  });
});
```

Run: `npx vitest run src/shared/content`
Expected: FAIL. Câmpurile noi nu există, iar `photos.ts` nu există.

- [ ] **Step 3: Extinde `site.ts`**

Adaugă tipurile după `FaqEntry`:

```ts
export type PhotoKey = 'class' | 'hands' | 'group' | 'boyReading' | 'teacherEma' | 'emaReading';
export type LevelSlug = 'starters' | 'pre-a1' | 'movers' | 'flyers' | 'a2-key';

export type ValueCard = {
  readonly title: string;
  readonly text: string;
  readonly tone: 'navy' | 'orange' | 'sun';
};

export type CampSlot = {
  readonly time: string;
  readonly title: string;
  readonly text: string;
};
```

Extinde `Level`:

```ts
export type Level = {
  readonly slug: LevelSlug;
  readonly name: string;
  readonly ageGroup: AgeGroup;
  readonly summary: string;
  readonly description: string;
  readonly outcomes: readonly string[];
  readonly photo: PhotoKey;
};
```

Adaugă în fiecare obiect din `levels` câmpurile `slug`, `summary` și `photo`, în această ordine a nivelurilor. `description` și `outcomes` rămân neschimbate.

| name | slug | photo | summary |
|---|---|---|---|
| Starters | `starters` | `class` | `Primele cuvinte și propoziții, prin joc, cântece și povești.` |
| Pre A1 | `pre-a1` | `hands` | `Vocabular de bază, citit și scris simplu, primele dialoguri.` |
| Movers | `movers` | `group` | `Propoziții complete, povestit la trecut și conversații scurte.` |
| Flyers | `flyers` | `boyReading` | `Texte mai lungi, gramatică explicată simplu, pregătire pentru examen.` |
| A2 Key | `a2-key` | `teacherEma` | `Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge.` |

În `contact` adaugă:

```ts
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Str.%20Observatorului%2090%2C%20Cluj-Napoca',
```

Schimbă răspunsul FAQ „După ce metodă predați?”:

```ts
  {
    question: 'După ce metodă predați?',
    answer: `După metoda Cambridge, adaptată vârstei copiilor, cu manualul ${courseFacts.textbook}.`,
  },
```

Înlocuiește `camps` și adaugă `offer` și `values` în obiectul `site`:

```ts
  offer: {
    label: 'Ofertă pre-sale 2026',
    headline: '4 + 1 lună cadou',
    detail: 'Reducere pentru primii 20 înscriși',
  },
  values: [
    {
      title: 'Program structurat pe niveluri',
      text: 'Fiecare copil începe la nivelul lui, stabilit prin test și lecția demo.',
      tone: 'navy',
    },
    {
      title: 'Metodologie Cambridge',
      text: 'Manuale Cambridge, adaptate fiecărei grupe.',
      tone: 'orange',
    },
    {
      title: 'Rezultate vizibile după prima lună',
      text: 'Progres pas cu pas, pe care îl vezi și acasă.',
      tone: 'sun',
    },
  ] satisfies readonly ValueCard[],
  camps: {
    year: 'TODO: anul taberei',
    ageRange: 'TODO: vârstele copiilor',
    period: 'TODO: perioada taberei',
    schedule: 'TODO: programul zilnic',
    price: 'TODO: prețul pe săptămână',
    day: [
      { time: 'TODO: ora', title: 'Good morning!', text: 'Cântec de dimineață și jocul zilei.' },
      {
        time: 'TODO: ora',
        title: 'Proiectul săptămânii',
        text: 'Lucru în echipă pe o temă: călătorii, natură, meserii.',
      },
      { time: 'TODO: ora', title: 'Gustare și joacă', text: 'Pauză, tot în engleză.' },
      { time: 'TODO: ora', title: 'Show & tell', text: 'Fiecare copil prezintă ce a făcut azi.' },
    ] satisfies readonly CampSlot[],
    includes: [
      'TODO: Materiale și manuale',
      'TODO: Gustare',
      'TODO: Diplomă de participare',
      'TODO: Ieșire tematică',
    ],
  },
```

- [ ] **Step 4: Creează `photos.ts`**

`src/shared/content/photos.ts`:

```ts
import type { ImageMetadata } from 'astro';
import boyReading from '@assets/photos/boy-reading.jpg';
import classPhoto from '@assets/photos/class.jpg';
import emaReading from '@assets/photos/ema-reading.jpg';
import group from '@assets/photos/group.jpg';
import hands from '@assets/photos/hands.jpg';
import teacherEma from '@assets/photos/teacher-ema.jpg';
import type { PhotoKey } from './site';

export const photos: Readonly<Record<PhotoKey, ImageMetadata>> = {
  class: classPhoto,
  hands,
  group,
  boyReading,
  teacherEma,
  emaReading,
};
```

`site.ts` nu importă imagini, pentru că e citit și de `astro.config.ts`.

- [ ] **Step 5: Tokens noi**

În `src/styles/tokens.css`, în `:root`, adaugă după `--gradient-brand`:

```css
  --gradient-hero: linear-gradient(115deg, var(--color-orange) 0 55%, var(--color-orange-light) 100%);
  --color-ema-bg: #ef8a2a;
  --color-photo-bg: #f3e3c8;
  --color-card-edge: var(--color-cream-border);
```

- [ ] **Step 6: Rulează și verifică**

Run: `npx vitest run src/shared/content`
Expected: PASS

Run: `npm run verify`
Expected: verde. Avertismentul TODO listează acum și `camps.year`, `camps.ageRange`, `camps.day[0].time` … `camps.includes[3]`.

- [ ] **Step 7: Commit**

```powershell
git add tsconfig.json src/assets src/shared/content src/styles/tokens.css
git commit -m "feat(content): add level slugs, summaries, photos, offer, values and camp details"
```

---

### Task 2: Stratul `src/sections/` — granițe

**Files:**
- Modify: `eslint.config.js`, `.dependency-cruiser.cjs`, `tests/boundaries/eslint.test.ts`, `tests/boundaries/dependency-cruiser.test.ts`
- Create: `tests/boundaries/fixture/src/sections/home/ok-section.ts`, `tests/boundaries/fixture/src/sections/home/bad-deep-section.ts`, `tests/boundaries/fixture/src/shared/bad-to-section.ts`
- Modify: `.claude/skills/project-conventions/SKILL.md`

**Interfaces:**
- Produces: regula „doar `pages/` și `sections/` importă din `sections/`”. Secțiunile au aceleași drepturi de import ca paginile.

- [ ] **Step 1: Scrie testele care pică**

În fixture, creează:

| Fișier | Conținut |
|---|---|
| `src/sections/home/ok-section.ts` | `import { beta } from '../../features/beta/index';`<br>`export const okSection = beta;` |
| `src/sections/home/bad-deep-section.ts` | `import { pure } from '../../features/beta/model/pure';`<br>`export const h = pure;` |
| `src/shared/bad-to-section.ts` | `import { okSection } from '../sections/home/ok-section';`<br>`export const i = okSection;` |

În `tests/boundaries/dependency-cruiser.test.ts`, adaugă la lista așteptată:

```ts
        'pages-use-feature-index src/sections/home/bad-deep-section.ts',
        'shared-core-are-leaves src/shared/bad-to-section.ts',
        'sections-only-from-app src/shared/bad-to-section.ts',
```

Adaugă în `tests/boundaries/eslint.test.ts`:

```ts
  it('rejects deep feature imports from a section', async () => {
    expect(await ruleIds(astroImport('@features/faq/ui/Faq.astro'), 'src/sections/home/Hero.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('allows a section to import a feature index and shared UI', async () => {
    expect(await ruleIds(astroImport('@features/faq'), 'src/sections/home/Hero.astro')).toEqual([]);
    expect(await ruleIds(astroImport('@shared/ui/Photo.astro'), 'src/sections/home/Hero.astro')).toEqual([]);
  });

  it('rejects shared UI importing a section', async () => {
    expect(await ruleIds(astroImport('../../sections/home/Hero.astro'), 'src/shared/ui/X.astro')).toContain(
      'no-restricted-imports',
    );
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/shared/ui/X.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('rejects a feature importing a section', async () => {
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/features/blog/ui/A.astro')).toContain(
      'no-restricted-imports',
    );
  });
```

Run: `npx vitest run tests/boundaries`
Expected: FAIL. Regulile și aliasul `@sections` nu există încă.

- [ ] **Step 2: Alias și reguli**

În `tsconfig.json`, la `paths`, adaugă:

```json
"@sections/*": ["./src/sections/*"],
"@layouts/*": ["./src/layouts/*"]
```

`@layouts/*` permite paginilor din subfoldere (`src/pages/blog/[id].astro`) să importe layout-ul fără `../../`. Toate paginile noi îl folosesc: `import BaseLayout from '@layouts/BaseLayout.astro';`. Regulile ESLint existente nu restricționează `@layouts/*` pentru `pages/`; în blocul `src/shared/**`, `src/core/**` adaugă și `{ group: ['@layouts/*'], message: 'shared/ și core/ nu depind de layout-uri.' }`, iar în blocurile `src/features/**` și `src/features/*/*` la fel.

În `.dependency-cruiser.cjs`:
- în `pages-use-feature-index`, `from.path` devine `'^src/(pages|layouts|sections)/'`;
- în `feature-not-to-app`, `to.path` devine `'^src/(pages|layouts|sections)/'`;
- în `shared-core-are-leaves`, `to.path` devine `'^src/(features|pages|layouts|sections)/'`;
- adaugă regula:

```js
    {
      name: 'sections-only-from-app',
      comment: 'Doar paginile și alte secțiuni importă din sections/.',
      severity: 'error',
      from: { pathNot: '^src/(pages|sections)/' },
      to: { path: '^src/sections/' },
    },
```

În `eslint.config.js`:
- blocul `files: ['src/pages/**', 'src/layouts/**']` devine `files: ['src/pages/**', 'src/layouts/**', 'src/sections/**']`;
- în blocul `src/shared/**`, `src/core/**`, adaugă `{ group: ['@sections/*'], message: 'shared/ și core/ nu depind de secțiuni.' }`, iar regex-ul devine `'^\\.{1,2}/(.*/)?(features|pages|layouts|sections)/'`;
- în blocurile `src/features/**` și `src/features/*/*`, adaugă `{ group: ['@sections/*'], message: 'Un feature nu depinde de secțiunile paginilor.' }`.

Run: `npx vitest run tests/boundaries`
Expected: PASS

- [ ] **Step 3: Documentează convenția**

În `.claude/skills/project-conventions/SKILL.md`:
- adaugă în tabelul „Unde stă codul” rândul `| Secțiune a unei singure pagini | `src/sections/<pagină>/` (`.astro` + `.css`) |`;
- adaugă în „Granițe” linia `- `sections/` → `features/*` (prin `index.ts`), `shared/`, `core/`, `styles/`. Doar `pages/` și alte `sections/` importă din `sections/`.`;
- adaugă în `@features/`, `@shared/`, `@core/` aliasurile `@sections/` și `@assets/`;
- adaugă în „Decision log” rândul `| 2026-10-11 | Strat `src/sections/` pentru secțiunile unei pagini | Pagini subțiri fără a umfla `shared/ui` cu piese folosite o singură dată |`.

- [ ] **Step 4: Verifică și commit**

Run: `npm run verify`
Expected: verde

```powershell
git add tsconfig.json eslint.config.js .dependency-cruiser.cjs tests/boundaries .claude/skills/project-conventions/SKILL.md
git commit -m "build: add sections layer with enforced import boundaries"
```

---

### Task 3: Piese UI comune — Photo, EmaPortrait, Star, Eyebrow, Badge, StickyContact, Footer `showCta`

**Files:**
- Create în `src/shared/ui/`: `Photo.astro`, `EmaPortrait.astro`, `EmaPortrait.css`, `Star.astro`, `Star.css`, `Eyebrow.astro`, `Eyebrow.css`, `Badge.astro`, `Badge.css`, `StickyContact.astro`, `StickyContact.css`
- Modify: `src/shared/ui/Footer.astro`
- Test: `src/shared/ui/visuals.test.ts`, `src/shared/ui/Footer.test.ts`

**Interfaces:**
- Consumes: `photos`, `PhotoKey` (Task 1).
- Produces:
  - `<Photo photo: PhotoKey | ImageMetadata, alt: string, sizes: string, widths?: number[], class?: string, eager?: boolean>`;
  - `<EmaPortrait size: 'sm' | 'md' | 'lg', alt?: string, eager?: boolean>`;
  - `<Star tone?: 'sun' | 'orange', size?: number>`;
  - `<Eyebrow tone?: 'accent' | 'sun' | 'white'>` cu slot;
  - `<Badge tone?: 'white' | 'orange'>` cu slot;
  - `<StickyContact />`;
  - `<Footer showCta?: boolean>`, implicit `true`.

- [ ] **Step 1: Scrie testul care pică**

`src/shared/ui/visuals.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Badge from './Badge.astro';
import EmaPortrait from './EmaPortrait.astro';
import Eyebrow from './Eyebrow.astro';
import Photo from './Photo.astro';
import { photos } from '@shared/content/photos';
import Star from './Star.astro';
import StickyContact from './StickyContact.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0], options = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

describe('shared visuals', () => {
  it('renders a lazy responsive picture with avif and webp', async () => {
    const html = await render(Photo, { props: { photo: 'class', alt: 'Copii la curs', sizes: '100vw' } });
    expect(html).toContain('<picture');
    expect(html).toContain('type="image/avif"');
    expect(html).toContain('type="image/webp"');
    expect(html).toContain('alt="Copii la curs"');
    expect(html).toContain('loading="lazy"');
  });

  it('accepts an imported image instead of a photo key (blog covers)', async () => {
    const html = await render(Photo, { props: { photo: photos.hands, alt: '', sizes: '100vw' } });
    expect(html).toContain('<picture');
  });

  it('loads the hero photo eagerly with high priority', async () => {
    const html = await render(Photo, { props: { photo: 'class', alt: '', sizes: '100vw', eager: true } });
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
  });

  it('puts the Ema crop class on the img inside the circle', async () => {
    const html = await render(EmaPortrait, { props: { size: 'lg' } });
    expect(html).toContain('class="ema-portrait ema-portrait--lg"');
    expect(html).toMatch(/<img[^>]*class="ema-portrait__img"/);
    expect(html).toContain('alt="Ema, mascota English Minds Academy"');
  });

  it('hides decorative stars from assistive technology', async () => {
    expect(await render(Star, { props: { tone: 'orange', size: 30 } })).toMatch(
      /<span class="star star--orange" style="--star-size: ?30px;?" aria-hidden="true">/,
    );
  });

  it('renders eyebrow and badge text with their tones', async () => {
    expect(await render(Eyebrow, { props: { tone: 'sun' }, slots: { default: 'Detalii curs' } })).toContain(
      '<p class="eyebrow eyebrow--sun">Detalii curs</p>',
    );
    expect(await render(Badge, { props: { tone: 'orange' }, slots: { default: 'Vara 2026' } })).toContain(
      '<p class="badge badge--orange">Vara 2026</p>',
    );
  });

  it('offers WhatsApp and the demo lesson in the sticky contact', async () => {
    const html = await render(StickyContact);
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('href="/lectie-demo/"');
    expect(html).toContain('aria-label="Contact rapid"');
  });
});
```

Adaugă în `src/shared/ui/Footer.test.ts`:

```ts
  it('can hide the call to action block', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, { props: { showCta: false } });
    expect(html).not.toContain('site-footer__cta');
    expect(html).toContain('href="/confidentialitate/"');
  });
```

Run: `npx vitest run src/shared/ui`
Expected: FAIL (componentele nu există). Dacă `Photo` nu poate fi randat în Container (de exemplu o eroare despre serviciul de imagini), oprește-te și raportează BLOCKED cu eroarea exactă.

- [ ] **Step 2: Photo și EmaPortrait**

`src/shared/ui/Photo.astro`:

```astro
---
import type { ImageMetadata } from 'astro';
import { Picture } from 'astro:assets';
import { photos } from '@shared/content/photos';
import type { PhotoKey } from '@shared/content/site';

interface Props {
  photo: PhotoKey | ImageMetadata;
  alt: string;
  sizes: string;
  widths?: number[];
  class?: string;
  eager?: boolean;
}

const { photo, alt, sizes, widths = [360, 640, 960, 1280], class: className, eager = false } = Astro.props;
const image = typeof photo === 'string' ? photos[photo] : photo;
const usableWidths = [...widths.filter((width) => width < image.width), image.width];
---
<Picture
  src={image}
  alt={alt}
  formats={['avif', 'webp']}
  widths={usableWidths}
  sizes={sizes}
  class={className}
  loading={eager ? 'eager' : 'lazy'}
  fetchpriority={eager ? 'high' : 'auto'}
/>
```

`src/shared/ui/EmaPortrait.astro`:

```astro
---
import Photo from './Photo.astro';
import { photos } from '@shared/content/photos';
import './EmaPortrait.css';

interface Props {
  size: 'sm' | 'md' | 'lg';
  alt?: string;
  eager?: boolean;
}

const SIZES = {
  sm: '194px',
  md: '403px',
  lg: '(min-width: 1100px) 805px, 403px',
} as const;

const { size, alt = 'Ema, mascota English Minds Academy', eager = false } = Astro.props;
---
<div class={`ema-portrait ema-portrait--${size}`}>
  <Photo photo="emaReading" alt={alt} sizes={SIZES[size]} eager={eager} class="ema-portrait__img" />
</div>
```

`src/shared/ui/EmaPortrait.css` (decupajul din design: imaginea are 161% din lățimea cercului și e mutată −61% stânga, −19.1% sus):

```css
.ema-portrait {
  --ema-size: 120px;
  --ema-ring: 6px;
  flex-shrink: 0;
  width: var(--ema-size);
  aspect-ratio: 1;
  overflow: hidden;
  border: var(--ema-ring) solid var(--color-sun);
  border-radius: 50%;
  background: var(--color-ema-bg);
}

.ema-portrait picture {
  display: block;
}

.ema-portrait__img {
  display: block;
  width: 161%;
  max-width: none;
  height: auto;
  margin-top: -19.1%;
  margin-left: -61%;
}

.ema-portrait--sm {
  --ema-size: 60px;
  --ema-ring: 4px;
}

.ema-portrait--md,
.ema-portrait--lg {
  --ema-size: 250px;
  --ema-ring: 8px;
  box-shadow: 0 16px 30px rgb(150 50 0 / 0.3);
}

@media (min-width: 768px) {
  .ema-portrait--sm {
    --ema-size: 120px;
    --ema-ring: 6px;
  }
}

@media (min-width: 1100px) {
  .ema-portrait--lg {
    --ema-size: 500px;
    --ema-ring: 12px;
    box-shadow: 0 24px 50px rgb(150 50 0 / 0.3);
  }
}
```

- [ ] **Step 3: Star, Eyebrow, Badge**

`src/shared/ui/Star.astro`:

```astro
---
import './Star.css';

interface Props {
  tone?: 'sun' | 'orange';
  size?: number;
}

const { tone = 'sun', size = 28 } = Astro.props;
---
<span class={`star star--${tone}`} style={`--star-size: ${size}px`} aria-hidden="true"></span>
```

`src/shared/ui/Star.css`:

```css
.star {
  display: inline-block;
  flex-shrink: 0;
  width: var(--star-size);
  height: var(--star-size);
  clip-path: polygon(50% 0, 64.5% 24.9%, 93.3% 25%, 79% 50%, 93.3% 75%, 64.5% 75.1%, 50% 100%, 35.5% 75.1%, 6.7% 75%, 21% 50%, 6.7% 25%, 35.5% 24.9%);
}

.star--sun {
  background: var(--color-sun);
}

.star--orange {
  background: var(--color-orange);
}
```

`src/shared/ui/Eyebrow.astro`:

```astro
---
import './Eyebrow.css';

interface Props {
  tone?: 'accent' | 'sun' | 'white';
}

const { tone = 'accent' } = Astro.props;
---
<p class={`eyebrow eyebrow--${tone}`}><slot /></p>
```

`src/shared/ui/Eyebrow.css`:

```css
.eyebrow {
  margin: 0;
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 1.375rem;
  line-height: 1.1;
  text-transform: uppercase;
}

.eyebrow--accent {
  color: var(--color-text-accent);
}

.eyebrow--sun {
  color: var(--color-sun);
}

.eyebrow--white {
  color: var(--color-white);
}
```

`src/shared/ui/Badge.astro`:

```astro
---
import './Badge.css';

interface Props {
  tone?: 'white' | 'orange';
}

const { tone = 'white' } = Astro.props;
---
<p class={`badge badge--${tone}`}><slot /></p>
```

`src/shared/ui/Badge.css`:

```css
.badge {
  display: inline-block;
  margin: 0;
  padding: 6px 14px;
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.2;
  text-transform: uppercase;
  transform: rotate(-2deg);
}

.badge--white {
  background: var(--color-white);
  color: var(--color-text-accent);
}

.badge--orange {
  background: var(--color-orange);
  color: var(--color-white);
  font-size: 1.375rem;
}
```

- [ ] **Step 4: StickyContact și Footer `showCta`**

`src/shared/ui/StickyContact.astro`:

```astro
---
import { site } from '@shared/content/site';
import './StickyContact.css';
---
<nav class="sticky-contact" aria-label="Contact rapid">
  <a class="sticky-contact__whatsapp" href={site.contact.whatsappUrl}>
    <span class="sticky-contact__long">Scrie-ne pe WhatsApp</span>
    <span class="sticky-contact__short">WhatsApp</span>
  </a>
  <a class="sticky-contact__demo" href="/lectie-demo/">Lecție demo</a>
</nav>
```

`src/shared/ui/StickyContact.css`:

```css
.sticky-contact {
  position: fixed;
  right: 12px;
  bottom: 12px;
  left: 12px;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-white);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.2);
}

.sticky-contact a {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 8px;
  border-radius: var(--radius-pill);
  font-weight: 900;
  font-size: var(--text-button);
  text-decoration: none;
}

.sticky-contact__whatsapp {
  background: var(--color-whatsapp);
  color: var(--color-navy);
}

.sticky-contact__demo {
  background: var(--color-orange);
  color: var(--color-white);
}

.sticky-contact__long {
  display: none;
}

body:has(.sticky-contact) {
  padding-bottom: 84px;
}

@media (min-width: 768px) {
  .sticky-contact {
    right: 28px;
    bottom: 28px;
    left: auto;
    display: block;
    padding: 0;
    background: none;
    box-shadow: none;
  }

  .sticky-contact__whatsapp {
    padding: 14px 22px;
    box-shadow: 0 10px 24px rgb(0 0 0 / 0.2);
  }

  .sticky-contact__long {
    display: inline;
  }

  .sticky-contact__short,
  .sticky-contact__demo {
    display: none !important;
  }

  body:has(.sticky-contact) {
    padding-bottom: 0;
  }
}
```

În `src/shared/ui/Footer.astro`:
- adaugă `interface Props { showCta?: boolean }` și `const { showCta = true } = Astro.props;`;
- învelește `<div class="site-footer__cta">…</div>` în `{showCta && (…)}`.

- [ ] **Step 5: Rulează și verifică**

Run: `npx vitest run src/shared/ui`
Expected: PASS (testele vechi și cele 8 noi). Dacă `style` iese fără spațiu sau `;` (`--star-size:30px`), regex-ul îl acceptă deja.

Run: `npm run verify`
Expected: verde

- [ ] **Step 6: Commit**

```powershell
git add src/shared/ui
git commit -m "feat(shared-ui): add photo, Ema portrait, star, eyebrow, badge and sticky contact"
```

---

### Task 4: Pagina Acasă

**Files:**
- Create în `src/sections/home/`: `HomeHero.astro`, `HomeHero.css`, `OfferStrip.astro`, `OfferStrip.css`, `LevelsOverview.astro`, `LevelsOverview.css`, `ValueCards.astro`, `ValueCards.css`, `TestTeaser.astro`, `TestTeaser.css`, `HomeContact.astro`, `HomeContact.css`, `home.test.ts`
- Modify: `src/features/faq/ui/Faq.astro`, `src/features/faq/ui/faq.css`, `src/features/faq/ui/Faq.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site.levels` (`slug`, `summary`), `site.offer`, `site.values`, `site.contact`, `site.faq`; piesele din Task 3; `Faq` din `@features/faq`.
- Produces:
  - `<Faq items, heading?, id?, eyebrow?>` cu slot implicit sub titlu;
  - `<HomeContact>` cu slot implicit pentru formularul din etapa 4;
  - `<OfferStrip />`, reutilizat pe Grupe.

Sursa textelor și a mărimilor: `docs/design/continut-pagini.md`, secțiunea „1. Homepage”. Textele de mai jos sunt exacte. Mărimile CSS sunt cele din document; pe mobil se folosesc valorile „Mobile”.

- [ ] **Step 1: Scrie testele care pică**

`src/sections/home/home.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import HomeContact from './HomeContact.astro';
import HomeHero from './HomeHero.astro';
import LevelsOverview from './LevelsOverview.astro';
import OfferStrip from './OfferStrip.astro';
import TestTeaser from './TestTeaser.astro';
import ValueCards from './ValueCards.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0], options = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

describe('home sections', () => {
  it('hero has the single h1, the test link and the contact anchor', async () => {
    const html = await render(HomeHero);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('Engleză de la 5 ani, după metoda');
    expect(html).toContain('href="/test-de-nivel/"');
    expect(html).toContain('href="#contact"');
    expect(html).toContain('Hei, eu sunt Ema!');
    expect(html).toContain('loading="eager"');
  });

  it('offer strip shows label, headline and detail', async () => {
    const html = await render(OfferStrip);
    expect(html).toContain('Ofertă pre-sale 2026');
    expect(html).toContain('4 + 1 lună cadou');
    expect(html).toContain('Reducere pentru primii 20 înscriși');
  });

  it('links every level card to its anchor on the groups page', async () => {
    const html = await render(LevelsOverview);
    for (const slug of ['starters', 'pre-a1', 'movers', 'flyers', 'a2-key']) {
      expect(html).toContain(`href="/grupe/#${slug}"`);
    }
    expect(html).toContain('id="cursuri"');
  });

  it('renders the three value cards in order', async () => {
    const html = await render(ValueCards);
    const order = ['Program structurat pe niveluri', 'Metodologie Cambridge', 'Rezultate vizibile după prima lună'];
    const positions = order.map((title) => html.indexOf(title));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('teaser sends parents to the full level test', async () => {
    const html = await render(TestTeaser);
    expect(html).toContain('id="test"');
    expect(html).toContain('href="/test-de-nivel/"');
    expect(html).toContain('Descoperă nivelul potrivit copilului tău');
  });

  it('contact section has phone, WhatsApp, maps link and a slot for the form', async () => {
    const html = await render(HomeContact, { slots: { default: '<form id="viitor"></form>' } });
    expect(html).toContain('id="contact"');
    expect(html).toContain('href="tel:+40775630680"');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=');
    expect(html).toContain('<form id="viitor"></form>');
  });
});
```

Adaugă în `src/features/faq/ui/Faq.test.ts`:

```ts
  it('renders an optional eyebrow and intro content under the heading', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Faq, {
      props: { items, heading: 'Ce ne întreabă părinții', eyebrow: 'Întrebări frecvente' },
      slots: { default: '<p>Sună-ne</p>' },
    });
    expect(html).toContain('Întrebări frecvente');
    expect(html).toContain('Ce ne întreabă părinții');
    expect(html).toContain('<p>Sună-ne</p>');
  });
```

Run: `npx vitest run src/sections/home src/features/faq`
Expected: FAIL

- [ ] **Step 2: Extinde FAQ**

`src/features/faq/ui/Faq.astro`, partea de frontmatter și secțiunea (lista `<faq-list>` și scriptul rămân neschimbate):

```astro
---
import type { FaqEntry } from '@shared/content/site';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import './faq.css';

interface Props {
  items: readonly FaqEntry[];
  heading?: string;
  id?: string;
  eyebrow?: string;
}

const { items, heading = 'Întrebări frecvente', id = 'faq', eyebrow } = Astro.props;
---
<section class="faq" id={id} aria-labelledby={`${id}-heading`}>
  <div class="faq__intro">
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 id={`${id}-heading`} class="faq__heading">{heading}</h2>
    <slot />
  </div>
  <!-- <faq-list> … neschimbat -->
</section>
```

În `faq.css`:
- `.faq` devine grilă: pe mobil o coloană, iar la `min-width: 960px` `grid-template-columns: 380px 1fr; gap: 56px; align-items: start;`;
- `.faq__intro` primește `display: flex; flex-direction: column; gap: 12px;`;
- `.faq__intro p` primește `margin: 0; font-size: 1.125rem;`;
- `.faq__intro a` primește `color: var(--color-text-accent); font-weight: 900;`.

`faq-list` rămâne a doua coloană.

- [ ] **Step 3: Secțiunile Acasă**

`src/sections/home/HomeHero.astro`:

```astro
---
import Badge from '@shared/ui/Badge.astro';
import EmaPortrait from '@shared/ui/EmaPortrait.astro';
import './HomeHero.css';
---
<section class="home-hero">
  <div class="home-hero__inner">
    <div class="home-hero__text">
      <Badge>Start înscrieri pentru noul an școlar</Badge>
      <h1 class="home-hero__title">
        Engleză de la 5 ani, după metoda{' '}<span class="home-hero__accent">Cambridge</span>.
      </h1>
      <p class="home-hero__lead">
        Grupe pe vârste, de la 5 la 14 ani, în Cluj-Napoca. Copiii învață pas cu pas, într-un mod adaptat vârstei lor.
      </p>
      <div class="home-hero__actions">
        <a class="home-hero__primary" href="/test-de-nivel/">Descoperă nivelul copilului</a>
        <a class="home-hero__secondary" href="#contact">Lecție demo gratuită</a>
      </div>
    </div>
    <div class="home-hero__ema">
      <EmaPortrait size="lg" eager />
      <p class="home-hero__bubble">
        Hei, eu sunt Ema!
        <span class="home-hero__bubble-sub">Hai să învățăm împreună.</span>
      </p>
    </div>
  </div>
</section>
```

`HomeHero.css` urmează „Section A” din `continut-pagini.md`, cu aceste reguli:
- fundal `var(--gradient-hero)`, text alb;
- elipsa galbenă decorativă se face cu `::after` pe `.home-hero` (`height: 260px; left/right: -10%; bottom: -140px; border-radius: 50%; background: var(--color-sun)`), cu `overflow: hidden` pe secțiune;
- pe mobil ordinea e insignă, titlu, Ema, butoane: folosește `display: grid` cu `order` și ascunde `.home-hero__lead` sub 768px;
- titlul are `clamp(2.5rem, 7vw, 4.875rem)`, line-height `0.98`;
- lead-ul are 1.375rem/700 și max-width 500px;
- butonul principal e galben cu text bleumarin și umbra `0 6px 0 var(--color-sun-shadow)`; cel secundar are contur alb de 3px; ambele au `--text-button`, iar pe mobil sunt pe toată lățimea;
- `.home-hero__accent` e bleumarin;
- de la 1100px, grila e `1.1fr 1fr`;
- bula are fundal alb, text bleumarin și `rotate(-4deg)`, iar sub-textul e `--color-text-accent` 15px/700, ascuns pe mobil.

`src/sections/home/OfferStrip.astro`:

```astro
---
import { site } from '@shared/content/site';
import './OfferStrip.css';
---
<section class="offer-strip" aria-label="Ofertă">
  <p class="offer-strip__label">{site.offer.label}</p>
  <p class="offer-strip__headline">{site.offer.headline}</p>
  <p class="offer-strip__detail">{site.offer.detail}</p>
</section>
```

`OfferStrip.css` urmează „Section B”:
- fundal galben, centrat;
- eticheta e Barlow Condensed 1.75rem `--color-text-accent`, titlul 1.5rem/900, detaliul 1.125rem/700;
- pe mobil cele trei rânduri sunt unul sub altul; de la 768px sunt pe un rând, cu `gap: 28px` și punct bleumarin de 10px între ele (`::before` pe headline și detail).

`src/sections/home/LevelsOverview.astro`:

```astro
---
import { site } from '@shared/content/site';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import './LevelsOverview.css';
---
<section class="levels-overview" id="cursuri" aria-labelledby="cursuri-heading">
  <div class="levels-overview__head">
    <div>
      <Eyebrow>Grupele de vârstă</Eyebrow>
      <h2 id="cursuri-heading">și structura cursurilor</h2>
    </div>
    <p>{site.courseFacts.duration}, într-o investiție în viitorul lui.</p>
  </div>
  <ul class="levels-overview__list">
    {site.levels.map((level) => (
      <li class="level-card">
        <p class="level-card__age">{level.ageGroup}</p>
        <h3 class="level-card__name">{level.name}</h3>
        <p class="level-card__summary">{level.summary}</p>
        <a class="level-card__link" href={`/grupe/#${level.slug}`}>
          Detalii grupă <span aria-hidden="true">→</span>
          <span class="visually-hidden"> {level.name}</span>
        </a>
      </li>
    ))}
  </ul>
</section>
```

Adaugă în `src/styles/base.css` utilitarul (dacă nu există):

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

`LevelsOverview.css` urmează „Section C”:
- cardurile sunt albe, cu radius 24 și umbra `0 2px 0 var(--color-card-edge)`;
- pe mobil sunt o listă; de la 768px grila e `repeat(2, 1fr)`, iar de la 1100px `repeat(5, 1fr)`;
- `h2` are `clamp(2rem, 5vw, 3.5rem)`;
- vârsta e o pastilă `--color-peach` cu `--color-text-accent`;
- linkul e `--color-text-accent` 1rem/900, cu `margin-top: auto`.

`src/sections/home/ValueCards.astro`:

```astro
---
import { site } from '@shared/content/site';
import Star from '@shared/ui/Star.astro';
import './ValueCards.css';
---
<section class="value-cards" aria-label="De ce English Minds">
  <ul>
    {site.values.map((value) => (
      <li class={`value-card value-card--${value.tone}`}>
        <Star tone={value.tone === 'sun' ? 'orange' : 'sun'} size={44} />
        <h3>{value.title}</h3>
        <p>{value.text}</p>
      </li>
    ))}
  </ul>
</section>
```

`ValueCards.css` urmează „Section D”:
- tonul `navy` e bleumarin cu text alb, `orange` e portocaliu cu text alb, `sun` e galben cu text bleumarin;
- titlul are 1.75rem/900;
- **textul are `var(--text-button)` și grosime 700** (constrângerea de contrast pe portocaliu);
- pe mobil cardurile sunt unul sub altul, iar de la 960px pe 3 coloane.

`src/sections/home/TestTeaser.astro`:

```astro
---
import EmaPortrait from '@shared/ui/EmaPortrait.astro';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import './TestTeaser.css';
---
<section class="test-teaser" id="test" aria-labelledby="test-heading">
  <div class="test-teaser__inner">
    <Eyebrow tone="white">Test de nivel · 3 minute</Eyebrow>
    <h2 id="test-heading">Descoperă nivelul potrivit copilului tău</h2>
    <div class="test-teaser__ema">
      <EmaPortrait size="sm" alt="Ema" />
      <p class="test-teaser__bubble">Hai să vedem ce știi deja!</p>
    </div>
    <a class="test-teaser__cta" href="/test-de-nivel/">Începe testul</a>
    <p class="test-teaser__note">Testul complet, cu audio și diplomă la final.</p>
  </div>
</section>
```

`TestTeaser.css` urmează „Section E”:
- fundal `--gradient-hero`, text alb;
- `h2` are `clamp(1.875rem, 5vw, 3.25rem)`;
- bula e albă, cu text bleumarin 1.0625rem/800 și radius `20px 20px 20px 4px`;
- CTA-ul e galben cu text bleumarin, `--text-button` și umbra `0 5px 0 var(--color-sun-shadow)`;
- nota are `--text-button`/700.

`src/sections/home/HomeContact.astro`:

```astro
---
import { site } from '@shared/content/site';
import Logo from '@shared/ui/Logo.astro';
import WhatsAppButton from '@shared/ui/WhatsAppButton.astro';
import './HomeContact.css';

const { contact } = site;
---
<section class="home-contact" id="contact" aria-labelledby="contact-heading">
  <div class="home-contact__inner">
    <div class="home-contact__main">
      <h2 id="contact-heading">Rezervă lecția{' '}<span class="home-contact__highlight">demo gratuită</span></h2>
      <p>Lasă-ne un număr de telefon și te sunăm să stabilim ziua și ora.</p>
      <slot />
      <div class="home-contact__actions">
        <WhatsAppButton />
      </div>
    </div>
    <div class="home-contact__card">
      <p class="home-contact__label">Adresă</p>
      <p class="home-contact__value">{`${contact.street}, ${contact.city}`}</p>
      <a class="home-contact__maps" href={contact.mapsUrl}>Deschide în Google Maps</a>
      <p class="home-contact__label">Telefon</p>
      <a class="home-contact__phone" href={`tel:${contact.phoneE164}`}>{contact.phoneDisplay}</a>
      <p class="home-contact__label">Instagram</p>
      <a class="home-contact__value" href={contact.instagramUrl}>{contact.instagramHandle}</a>
    </div>
  </div>
  <div class="home-contact__bottom">
    <Logo />
    <p>Cursuri de engleză pentru copii după metoda Cambridge · Cluj-Napoca</p>
  </div>
</section>
```

`HomeContact.css` urmează „Section G”:
- fundal bleumarin, text alb;
- `.home-contact__highlight` e galben;
- cardul e crem, cu text bleumarin;
- etichetele sunt `--color-text-accent` 0.875rem/800 uppercase, `letter-spacing: .06em`;
- telefonul are 1.625rem/900;
- linkul Maps e `--color-text-accent` subliniat;
- de la 960px grila e `1.1fr 1fr`;
- bara de jos are border-top `rgb(255 255 255 / .18)`;
- `:focus-visible` e galben în toată secțiunea.

- [ ] **Step 4: Pagina**

`src/pages/index.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { Faq } from '@features/faq';
import HomeContact from '@sections/home/HomeContact.astro';
import HomeHero from '@sections/home/HomeHero.astro';
import LevelsOverview from '@sections/home/LevelsOverview.astro';
import OfferStrip from '@sections/home/OfferStrip.astro';
import TestTeaser from '@sections/home/TestTeaser.astro';
import ValueCards from '@sections/home/ValueCards.astro';
import { site } from '@shared/content/site';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';
import StickyContact from '@shared/ui/StickyContact.astro';
---
<BaseLayout
  title={site.name}
  description="Cursuri de engleză după metoda Cambridge pentru copii de 5–14 ani, în Cluj-Napoca. Lecție demo gratuită."
>
  <Header active="acasa" />
  <main id="continut">
    <HomeHero />
    <OfferStrip />
    <LevelsOverview />
    <ValueCards />
    <TestTeaser />
    <Faq items={site.faq} heading="Ce ne întreabă părinții" eyebrow="Întrebări frecvente">
      <p>Nu găsești răspunsul? Sună-ne la <a href={`tel:${site.contact.phoneE164}`}>{site.contact.phoneDisplay}</a>.</p>
    </Faq>
    <HomeContact />
  </main>
  <Footer showCta={false} />
  <StickyContact />
</BaseLayout>
```

- [ ] **Step 5: Rulează și verifică**

Run: `npx vitest run src/sections/home src/features/faq`
Expected: PASS

Run: `npm run verify`
Expected: verde

Run: `npm run build; Select-String -Path dist/index.html -Pattern '<h1' | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `1`

Verificare vizuală (`npm run preview`) la 360, 768 și 1280px:
- nu apare derulare orizontală;
- fața Emei e centrată în cerc;
- bara fixă nu acoperă footerul pe mobil.

- [ ] **Step 6: Commit**

```powershell
git add src/sections/home src/features/faq src/pages/index.astro src/styles/base.css
git commit -m "feat(home): build the home page from design sections"
```

---

### Task 5: Pagina Grupe

**Files:**
- Create în `src/sections/grupe/`: `GrupeHero.astro`, `GrupeHero.css`, `CourseDetails.astro`, `CourseDetails.css`, `LevelSection.astro`, `LevelSection.css`, `TestBand.astro`, `TestBand.css`, `grupe.test.ts`
- Create: `src/pages/grupe.astro` (cu `build.format: 'directory'` generează `/grupe/`)

**Interfaces:**
- Consumes: `site.levels`, `site.courseFacts`, `site.offer`, `Photo`, `Star`, `Eyebrow`.
- Produces: `<LevelSection level: Level>` cu `id={level.slug}`. Ținta ancorelor e de pe Acasă (Task 4). `<TestBand />` e reutilizat pe Metoda.

Sursa: `docs/design/continut-pagini.md`, „2. /grupe/” (pagina desktop, dar fără taburi: grupele sunt una sub alta).

- [ ] **Step 1: Scrie testele care pică**

`src/sections/grupe/grupe.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import CourseDetails from './CourseDetails.astro';
import GrupeHero from './GrupeHero.astro';
import LevelSection from './LevelSection.astro';
import TestBand from './TestBand.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0], options = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(component, options);
}

describe('groups page sections', () => {
  it('hero has the h1 and a shortcut to every level anchor', async () => {
    const html = await render(GrupeHero);
    expect(html).toContain('Ce va învăța copilul tău la cursurile noastre de limbă engleză');
    for (const level of site.levels) expect(html).toContain(`href="#${level.slug}"`);
  });

  it('course details list every fact once, with the offer', async () => {
    const html = await render(CourseDetails);
    for (const label of ['Durată', 'Zile', 'Mărimea grupei', 'Manual', 'Preț']) expect(html).toContain(label);
    expect(html).toContain(site.courseFacts.duration);
    expect(html).toContain(site.offer.headline);
  });

  it('level section is anchored by slug and books the demo for that group', async () => {
    const level = site.levels[2];
    const html = await render(LevelSection, { props: { level } });
    expect(html).toContain(`id="${level.slug}"`);
    expect(html).toContain(`Nivelul ${level.name} · ${level.ageGroup}`);
    expect(html).toContain(level.description);
    for (const outcome of level.outcomes) expect(html).toContain(outcome);
    expect(html).toContain(`href="/lectie-demo/?grupa=${level.slug}"`);
  });

  it('test band links to the level test', async () => {
    expect(await render(TestBand)).toContain('href="/test-de-nivel/"');
  });
});
```

Run: `npx vitest run src/sections/grupe`
Expected: FAIL

- [ ] **Step 2: Secțiunile**

`src/sections/grupe/GrupeHero.astro`:

```astro
---
import { site } from '@shared/content/site';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import './GrupeHero.css';
---
<section class="grupe-hero">
  <Eyebrow>Grupele de vârstă</Eyebrow>
  <h1>Ce va învăța copilul tău la cursurile noastre de limbă engleză</h1>
  <p class="grupe-hero__lead">Cinci grupe, de la 5 la 14 ani. Alege grupa după vârstă sau fă testul de nivel.</p>
  <nav class="grupe-hero__nav" aria-label="Grupe">
    <ul>
      {site.levels.map((level) => (
        <li>
          <a href={`#${level.slug}`}>
            <span class="grupe-hero__name">{level.name}</span>
            <span class="grupe-hero__age">{level.ageGroup}</span>
          </a>
        </li>
      ))}
    </ul>
  </nav>
</section>
```

`src/sections/grupe/CourseDetails.astro`:

```astro
---
import { site } from '@shared/content/site';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import './CourseDetails.css';

const { courseFacts, offer } = site;
const FACTS = [
  { label: 'Durată', value: courseFacts.duration },
  { label: 'Zile', value: courseFacts.days },
  { label: 'Mărimea grupei', value: courseFacts.groupSize },
  { label: 'Manual', value: courseFacts.textbook },
  { label: 'Preț', value: courseFacts.monthlyPrice },
];
---
<section class="course-details" aria-labelledby="detalii-heading">
  <Eyebrow tone="sun">Detalii curs</Eyebrow>
  <h2 id="detalii-heading" class="visually-hidden">Detalii curs</h2>
  <dl>
    {FACTS.map((fact) => (
      <div class="course-details__row">
        <dt>{fact.label}</dt>
        <dd>{fact.value}</dd>
      </div>
    ))}
  </dl>
  <div class="course-details__offer">
    <p class="course-details__offer-label">{offer.label}</p>
    <p class="course-details__offer-headline">{offer.headline}</p>
  </div>
</section>
```

`src/sections/grupe/LevelSection.astro`:

```astro
---
import type { Level } from '@shared/content/site';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import Photo from '@shared/ui/Photo.astro';
import Star from '@shared/ui/Star.astro';
import './LevelSection.css';

interface Props {
  level: Level;
}

const { level } = Astro.props;
---
<section class="level-section" id={level.slug} aria-labelledby={`${level.slug}-heading`}>
  <div class="level-section__intro">
    <Eyebrow>{`Nivelul ${level.name} · ${level.ageGroup}`}</Eyebrow>
    <h2 id={`${level.slug}-heading`}>{level.name}</h2>
    <p class="level-section__description">{level.description}</p>
    <div class="level-section__actions">
      <a class="level-section__primary" href={`/lectie-demo/?grupa=${level.slug}`}>Rezervă lecția demo gratuită</a>
      <a class="level-section__secondary" href="/test-de-nivel/">Nu știi nivelul? Fă testul</a>
    </div>
  </div>
  <div class="level-section__photo">
    <Photo photo={level.photo} alt="Copii la cursurile English Minds" sizes="(min-width: 1100px) 480px, 100vw" />
  </div>
  <div class="level-section__outcomes">
    <h3>La finalul anului, copilul:</h3>
    <ul>
      {level.outcomes.map((outcome) => (
        <li><Star size={30} /> <span>{outcome}</span></li>
      ))}
    </ul>
  </div>
</section>
```

`src/sections/grupe/TestBand.astro`:

```astro
---
import './TestBand.css';
---
<section class="test-band" aria-labelledby="test-band-heading">
  <h2 id="test-band-heading">Nu știi la ce nivel e copilul?</h2>
  <a class="test-band__cta" href="/test-de-nivel/">Fă testul de nivel</a>
</section>
```

CSS (urmează „2. /grupe/” din `continut-pagini.md`):
- **`GrupeHero.css`:**
  - fundal crem;
  - `h1` are `clamp(2rem, 6vw, 4rem)`/1;
  - navigația e un rând de pastile albe derulabil pe mobil (aceeași tehnică de padding ca în header, ca să nu taie conturul de focus), cu numele 1.0625rem/900 și vârsta 0.8125rem/700 `--color-text-accent`.
- **`CourseDetails.css`:**
  - card bleumarin, radius 32, padding 36;
  - rândurile au `border-top: 1px solid rgb(255 255 255 / .18)` și `display: flex; justify-content: space-between`;
  - `dt` are 1rem/700, `dd` 1.0625rem/900 aliniat dreapta;
  - caseta de ofertă e galbenă, cu eticheta `--color-orange-shadow` Barlow 1.125rem și titlul 1.375rem/900 bleumarin;
  - `max-width: var(--container)` centrat.
- **`LevelSection.css`:**
  - pe mobil ordinea e intro, foto (4/3), rezultate; de la 1100px grila e `1.2fr 1fr` (intro + foto), iar rezultatele pe toată lățimea dedesubt, într-un card alb cu 2 coloane;
  - fotografia are radius 36, `border: 10px solid var(--color-sun)` (6px pe mobil), `aspect-ratio: 4/5` (4/3 pe mobil), `object-fit: cover` pe `img`, fundal `--color-photo-bg`;
  - butonul principal e portocaliu cu text alb, `--text-button`/900 și umbra `0 5px 0 var(--color-orange-shadow)`; cel secundar are contur bleumarin de 3px;
  - adaugă `scroll-margin-top: 16px` pe `.level-section`.
- **`TestBand.css`:** bandă galbenă cu titlu 1.875rem/900 și CTA bleumarin cu text alb.

- [ ] **Step 3: Pagina**

`src/pages/grupe.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import CourseDetails from '@sections/grupe/CourseDetails.astro';
import GrupeHero from '@sections/grupe/GrupeHero.astro';
import LevelSection from '@sections/grupe/LevelSection.astro';
import TestBand from '@sections/grupe/TestBand.astro';
import { site } from '@shared/content/site';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';
---
<BaseLayout
  title="Grupe"
  description="Cinci grupe de engleză pe vârste, de la 5 la 14 ani: Starters, Pre A1, Movers, Flyers și A2 Key. Ce învață copilul la fiecare nivel."
>
  <Header active="grupe" />
  <main id="continut">
    <GrupeHero />
    <CourseDetails />
    {site.levels.map((level) => <LevelSection level={level} />)}
    <TestBand />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 4: Rulează, verifică, commit**

Run: `npx vitest run src/sections/grupe`
Expected: PASS

Run: `npm run verify; Test-Path dist/grupe/index.html`
Expected: verde; `True`

Verificare vizuală: `http://localhost:4321/grupe/#movers` sare la secțiunea Movers, cu titlul vizibil.

```powershell
git add src/sections/grupe src/pages/grupe.astro
git commit -m "feat(grupe): add groups page with one anchored section per level"
```

---

### Task 6: Pagina Metoda Cambridge

**Files:**
- Create în `src/sections/metoda/`: `MetodaHero.astro`, `MetodaHero.css`, `ThreeThings.astro`, `ThreeThings.css`, `LevelPath.astro`, `LevelPath.css`, `ParentBenefits.astro`, `ParentBenefits.css`, `metoda.test.ts`
- Create: `src/pages/metoda-cambridge.astro`

**Interfaces:**
- Consumes: `site.levels`, `Photo`, `Badge`, `Eyebrow`, `Star`.

Sursa: `docs/design/continut-pagini.md`, „3. /metoda-cambridge/”.

- [ ] **Step 1: Scrie testele care pică**

`src/sections/metoda/metoda.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import LevelPath from './LevelPath.astro';
import MetodaHero from './MetodaHero.astro';
import ParentBenefits from './ParentBenefits.astro';
import ThreeThings from './ThreeThings.astro';

async function render(component: Parameters<AstroContainer['renderToString']>[0]) {
  const container = await AstroContainer.create();
  return container.renderToString(component);
}

describe('method page sections', () => {
  it('hero asks the question in the h1', async () => {
    const html = await render(MetodaHero);
    expect(html).toContain('<h1');
    expect(html).toContain('De ce predăm după această metodă?');
    expect(html).toContain('Metoda Cambridge, pe înțelesul părinților');
  });

  it('lists the three things in order', async () => {
    const html = await render(ThreeThings);
    const titles = ['Engleza se vorbește din prima lecție', 'Niveluri recunoscute internațional', 'Adaptată vârstei'];
    const positions = titles.map((title) => html.indexOf(title));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('builds the level path from site.levels plus B1 Preliminary', async () => {
    const html = await render(LevelPath);
    for (const level of site.levels) {
      expect(html).toContain(level.name);
      expect(html).toContain(level.ageGroup);
    }
    expect(html).toContain('B1 Preliminary');
    expect(html).toContain('Examenele Cambridge sunt opționale.');
  });

  it('parent benefits end with a link to the level test', async () => {
    const html = await render(ParentBenefits);
    expect(html).toContain('Un nivel clar de pornire, stabilit la lecția demo');
    expect(html).toContain('href="/test-de-nivel/"');
  });
});
```

Run: `npx vitest run src/sections/metoda`
Expected: FAIL

- [ ] **Step 2: Secțiunile**

`MetodaHero.astro`:

```astro
---
import Badge from '@shared/ui/Badge.astro';
import Photo from '@shared/ui/Photo.astro';
import './MetodaHero.css';
---
<section class="metoda-hero">
  <div class="metoda-hero__inner">
    <div class="metoda-hero__text">
      <Badge>Metoda Cambridge, pe înțelesul părinților</Badge>
      <h1>De ce predăm după această metodă?</h1>
      <p>Pentru că le dă copiilor un drum clar: știi mereu la ce nivel sunt, ce urmează și cum arată progresul.</p>
    </div>
    <div class="metoda-hero__photo">
      <Photo photo="teacherEma" alt="Profesoară cu manuale Cambridge" sizes="(min-width: 768px) 420px, 80vw" eager />
    </div>
  </div>
</section>
```

`ThreeThings.astro`:

```astro
---
import './ThreeThings.css';

const ITEMS = [
  {
    number: '01',
    tone: 'navy',
    title: 'Engleza se vorbește din prima lecție',
    text: 'Copiii folosesc limba în jocuri, dialoguri și proiecte, nu doar memorează reguli.',
  },
  {
    number: '02',
    tone: 'orange',
    title: 'Niveluri recunoscute internațional',
    text: 'Fiecare nivel corespunde Cadrului European Comun de Referință (Pre A1, A1, A2, B1).',
  },
  {
    number: '03',
    tone: 'sun',
    title: 'Adaptată vârstei',
    text: 'Manuale și activități gândite separat pentru preșcolari, școlari și adolescenți.',
  },
] as const;
---
<section class="three-things" aria-labelledby="three-things-heading">
  <h2 id="three-things-heading">Trei lucruri care contează</h2>
  <ul>
    {ITEMS.map((item) => (
      <li class={`three-things__card three-things__card--${item.tone}`}>
        <span class="three-things__number" aria-hidden="true">{item.number}</span>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </li>
    ))}
  </ul>
</section>
```

`LevelPath.astro`:

```astro
---
import { site } from '@shared/content/site';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import Star from '@shared/ui/Star.astro';
import './LevelPath.css';
---
<section class="level-path" aria-labelledby="level-path-heading">
  <Eyebrow>Drumul prin niveluri</Eyebrow>
  <h2 id="level-path-heading">De la primele cuvinte la primul examen</h2>
  <ol class="level-path__steps">
    {site.levels.map((level, index) => (
      <li class="level-path__step" style={`--step: ${index + 1}`}>
        <span class="level-path__bar" aria-hidden="true"></span>
        <span class="level-path__name">{level.name}</span>
        <span class="level-path__age">{level.ageGroup}</span>
      </li>
    ))}
    <li class="level-path__step level-path__step--next" style={`--step: ${site.levels.length + 1}`}>
      <span class="level-path__bar" aria-hidden="true"><Star size={44} /></span>
      <span class="level-path__name">B1 Preliminary</span>
      <span class="level-path__age">următorul pas</span>
    </li>
  </ol>
  <p class="level-path__note">
    Examenele Cambridge sunt opționale. La final, copilul primește o diplomă recunoscută internațional, care arată exact ce știe.
  </p>
</section>
```

`ParentBenefits.astro`:

```astro
---
import Photo from '@shared/ui/Photo.astro';
import Star from '@shared/ui/Star.astro';
import './ParentBenefits.css';

const BENEFITS = [
  'Un nivel clar de pornire, stabilit la lecția demo',
  'Progres pas cu pas, cu rezultate vizibile după prima lună',
  'Un obiectiv concret: următorul nivel sau o diplomă Cambridge',
];
---
<section class="parent-benefits" aria-labelledby="parent-benefits-heading">
  <div class="parent-benefits__photo">
    <Photo photo="class" alt="Lecție la English Minds" sizes="(min-width: 768px) 560px, 100vw" />
  </div>
  <div class="parent-benefits__text">
    <h2 id="parent-benefits-heading">Ce primești tu, ca părinte</h2>
    <ul>
      {BENEFITS.map((benefit) => <li><Star size={28} /> <span>{benefit}</span></li>)}
    </ul>
    <a class="parent-benefits__cta" href="/test-de-nivel/">Află nivelul copilului</a>
  </div>
</section>
```

CSS (urmează „3. /metoda-cambridge/”):
- **`MetodaHero.css`:**
  - fundal `--gradient-hero`, text alb, `h1` `clamp(2.5rem, 6vw, 4.5rem)`, paragraf `clamp(1.1875rem, 2vw, 1.3125rem)`/700;
  - fotografia e un cerc `min(420px, 80vw)` cu `border: 12px solid var(--color-sun)` și `object-fit: cover; object-position: 50% 25%` pe `img`;
  - grila e `repeat(auto-fit, minmax(min(320px, 100%), 1fr))`.
- **`ThreeThings.css`:**
  - carduri radius 28, padding 32; numărul e Barlow 2.75rem (galben pe bleumarin, crem pe portocaliu, `--color-text-accent` pe galben);
  - **textul are `--text-button`/700**;
  - grila e `repeat(auto-fit, minmax(min(280px, 100%), 1fr))`.
- **`LevelPath.css`:**
  - `.level-path__steps` e `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); align-items: end`;
  - bara are `height: calc(40px + var(--step) * 40px)` și radius `20px 20px 0 0`; culorile în ordine sunt `--color-peach`, `--color-sun`, `--color-orange-light`, `--color-orange`, `--color-rust`, iar ultimul pas `--color-navy` (aplicate prin `:nth-child`);
  - pe mobil (o coloană), barele devin orizontale: `height: 24px; width: calc(var(--step) * 16%)`;
  - numele are 1.375rem/900, vârsta 0.9375rem/700 `--color-text-accent`.
- **`ParentBenefits.css`:** fotografie 4/3 cu radius 32; CTA portocaliu cu text alb, `--text-button` și umbra `0 5px 0 var(--color-orange-shadow)`.

- [ ] **Step 3: Pagina**

`src/pages/metoda-cambridge.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import LevelPath from '@sections/metoda/LevelPath.astro';
import MetodaHero from '@sections/metoda/MetodaHero.astro';
import ParentBenefits from '@sections/metoda/ParentBenefits.astro';
import ThreeThings from '@sections/metoda/ThreeThings.astro';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';
---
<BaseLayout
  title="Metoda Cambridge"
  description="De ce predăm după metoda Cambridge: niveluri recunoscute internațional, engleză vorbită din prima lecție și progres pe care îl vezi."
>
  <Header active="metoda" />
  <main id="continut">
    <MetodaHero />
    <ThreeThings />
    <LevelPath />
    <ParentBenefits />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 4: Rulează, verifică, commit**

Run: `npx vitest run src/sections/metoda; npm run verify; Test-Path dist/metoda-cambridge/index.html`
Expected: PASS, verde, `True`

```powershell
git add src/sections/metoda src/pages/metoda-cambridge.astro
git commit -m "feat(metoda): add Cambridge method page"
```

---

### Task 7: Pagina Tabere

**Files:**
- Create în `src/sections/tabere/`: `TabereHero.astro`, `TabereHero.css`, `CampSummary.astro`, `CampSummary.css`, `CampDay.astro`, `CampDay.css`, `CampIncludes.astro`, `CampIncludes.css`, `tabere.test.ts`
- Create: `src/pages/tabere.astro`

**Interfaces:**
- Consumes: `site.camps` (Task 1), `site.contact`, `Photo`, `Badge`.

Sursa: „4. /tabere/”. Nota „Programul și activitățile sunt un exemplu…” nu se publică.

- [ ] **Step 1: Scrie testele care pică**

`src/sections/tabere/tabere.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { site } from '@shared/content/site';
import CampDay from './CampDay.astro';
import CampIncludes from './CampIncludes.astro';
import CampSummary from './CampSummary.astro';
import TabereHero from './TabereHero.astro';

const CAMP_WHATSAPP = `${site.contact.whatsappUrl}?text=${encodeURIComponent('Bună ziua! Aș dori detalii despre tabăra de vară.')}`;

async function render(component: Parameters<AstroContainer['renderToString']>[0]) {
  const container = await AstroContainer.create();
  return container.renderToString(component);
}

describe('camp page sections', () => {
  it('hero shows year and ages from site.camps and asks to be notified on WhatsApp', async () => {
    const html = await render(TabereHero);
    expect(html).toContain('O vară întreagă în engleză, cu Ema');
    expect(html).toContain(`Vara ${site.camps.year} · ${site.camps.ageRange}`);
    expect(html).toContain(`href="${CAMP_WHATSAPP.replaceAll('&', '&amp;')}"`);
  });

  it('summary shows period, schedule, location and price', async () => {
    const html = await render(CampSummary);
    for (const value of [site.camps.period, site.camps.schedule, site.contact.street, site.camps.price]) {
      expect(html).toContain(value);
    }
  });

  it('day lists every slot with time, title and text', async () => {
    const html = await render(CampDay);
    for (const slot of site.camps.day) {
      expect(html).toContain(slot.title);
      expect(html).toContain(slot.text);
    }
    expect(html).not.toContain('Se completează cu programul real');
  });

  it('includes list and the limited spots card', async () => {
    const html = await render(CampIncludes);
    for (const item of site.camps.includes) expect(html).toContain(item);
    expect(html).toContain('Locurile sunt limitate');
  });
});
```

Run: `npx vitest run src/sections/tabere`
Expected: FAIL

- [ ] **Step 2: Secțiunile**

`TabereHero.astro`:

```astro
---
import { site } from '@shared/content/site';
import Badge from '@shared/ui/Badge.astro';
import Photo from '@shared/ui/Photo.astro';
import './TabereHero.css';

const notifyUrl = `${site.contact.whatsappUrl}?text=${encodeURIComponent('Bună ziua! Aș dori detalii despre tabăra de vară.')}`;
---
<section class="tabere-hero">
  <div class="tabere-hero__inner">
    <div class="tabere-hero__text">
      <Badge tone="orange">{`Vara ${site.camps.year} · ${site.camps.ageRange}`}</Badge>
      <h1>O vară întreagă în engleză, cu Ema</h1>
      <p>Jocuri, proiecte și ieșiri, toate în engleză. Copiii nu pierd ritmul peste vară și se întorc la școală mai încrezători.</p>
      <a class="tabere-hero__cta" href={notifyUrl}>Anunță-mă când încep înscrierile</a>
    </div>
    <div class="tabere-hero__photo">
      <Photo photo="group" alt="Copii bucuroși la English Minds" sizes="(min-width: 768px) 440px, 80vw" eager />
    </div>
  </div>
</section>
```

`CampSummary.astro`:

```astro
---
import { site } from '@shared/content/site';
import './CampSummary.css';

const ITEMS = [
  { label: 'Perioada', value: site.camps.period },
  { label: 'Program', value: site.camps.schedule },
  { label: 'Locație', value: site.contact.street },
  { label: 'Preț', value: site.camps.price },
];
---
<section class="camp-summary" aria-labelledby="camp-summary-heading">
  <h2 id="camp-summary-heading">Pe scurt</h2>
  <dl>
    {ITEMS.map((item) => (
      <div class="camp-summary__card">
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>
    ))}
  </dl>
</section>
```

`CampDay.astro`:

```astro
---
import { site } from '@shared/content/site';
import './CampDay.css';
---
<section class="camp-day" aria-labelledby="camp-day-heading">
  <h2 id="camp-day-heading">O zi în tabără</h2>
  <ol>
    {site.camps.day.map((slot) => (
      <li class="camp-day__slot">
        <span class="camp-day__time">{slot.time}</span>
        <div>
          <h3>{slot.title}</h3>
          <p>{slot.text}</p>
        </div>
      </li>
    ))}
  </ol>
</section>
```

`CampIncludes.astro`:

```astro
---
import { site } from '@shared/content/site';
import './CampIncludes.css';

const notifyUrl = `${site.contact.whatsappUrl}?text=${encodeURIComponent('Bună ziua! Aș dori detalii despre tabăra de vară.')}`;
---
<section class="camp-includes">
  <div class="camp-includes__card camp-includes__card--orange">
    <h2>Ce include</h2>
    <ul>
      {site.camps.includes.map((item) => <li>{item}</li>)}
    </ul>
  </div>
  <div class="camp-includes__card camp-includes__card--navy">
    <h2>Locurile sunt limitate</h2>
    <p>Scrie-ne pe WhatsApp și te anunțăm primul când se deschid înscrierile.</p>
    <a class="camp-includes__cta" href={notifyUrl}>Scrie-ne pe WhatsApp</a>
  </div>
</section>
```

CSS (urmează „4. /tabere/”):
- **Hero:**
  - fundal galben, text bleumarin, `h1` `clamp(2.75rem, 6.5vw, 5rem)`/.98;
  - CTA bleumarin cu text alb;
  - fotografia e un cerc `min(440px, 80vw)` cu `border: 12px solid var(--color-white)` și `object-position: 50% 60%`.
- **Rezumat:** carduri albe, radius 24; eticheta 0.875rem/800 uppercase `--color-text-accent`, valoarea 1.375rem/900; grila e `repeat(auto-fit, minmax(min(220px, 100%), 1fr))`.
- **Ziua:** rânduri `grid-template-columns: 120px 1fr` (pe mobil `80px 1fr`), cu `border-top: 2px solid #f0e4d2`; ora e Barlow 1.75rem `--color-text-accent`.
- **Ce include:**
  - **cardul portocaliu are lista la `--text-button`/700**;
  - cardul bleumarin are CTA verde cu text bleumarin (constrângerea WhatsApp);
  - grila e `repeat(auto-fit, minmax(min(320px, 100%), 1fr))`.

- [ ] **Step 3: Pagina**

`src/pages/tabere.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import CampDay from '@sections/tabere/CampDay.astro';
import CampIncludes from '@sections/tabere/CampIncludes.astro';
import CampSummary from '@sections/tabere/CampSummary.astro';
import TabereHero from '@sections/tabere/TabereHero.astro';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';
---
<BaseLayout
  title="Tabere de vară"
  description="Tabără de vară în engleză la English Minds Academy, Cluj-Napoca: jocuri, proiecte și ieșiri, toate în engleză."
>
  <Header active="tabere" />
  <main id="continut">
    <TabereHero />
    <CampSummary />
    <CampDay />
    <CampIncludes />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 4: Rulează, verifică, commit**

Run: `npx vitest run src/sections/tabere; npm run verify; Test-Path dist/tabere/index.html`
Expected: PASS, verde, `True`

```powershell
git add src/sections/tabere src/pages/tabere.astro
git commit -m "feat(tabere): add summer camp page"
```

---

### Task 8: Blog — model și colecția de conținut

**Files:**
- Create: `src/features/blog/model/categories.ts`, `src/features/blog/model/reading-minutes.ts`, `src/features/blog/model/format-post-date.ts`, `src/features/blog/model/sort-newest-first.ts`
- Test: `src/features/blog/model/blog-model.test.ts`
- Create: `src/content.config.ts`, `src/features/blog/data/posts.ts`
- Create: `src/content/blog/5-obiceiuri-de-10-minute.md`, `src/content/blog/starters-movers-flyers.md`, `src/content/blog/copilul-nu-vrea-sa-vorbeasca.md`, `src/content/blog/engleza-la-scoala.md`

**Interfaces:**
- Produces:
  - `BLOG_CATEGORIES`, `type BlogCategoryId`, `BLOG_CATEGORY_IDS`, `categoryLabel(id): string`;
  - `readingMinutes(text: string): number`;
  - `formatPostDate(date: Date): string`;
  - `sortNewestFirst<T extends { data: { publishedAt: Date } }>(posts: readonly T[]): T[]`;
  - `getPublishedPosts(): Promise<BlogPost[]>`, `type BlogPost = CollectionEntry<'blog'>`.

- [ ] **Step 1: Scrie testele care pică**

`src/features/blog/model/blog-model.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BLOG_CATEGORY_IDS, categoryLabel } from './categories';
import { formatPostDate } from './format-post-date';
import { readingMinutes } from './reading-minutes';
import { sortNewestFirst } from './sort-newest-first';

describe('blog model', () => {
  it('labels every category in Romanian', () => {
    expect(BLOG_CATEGORY_IDS).toEqual(['acasa', 'metoda-cambridge', 'motivatie', 'scoala']);
    expect(categoryLabel('scoala')).toBe('Școală');
    expect(categoryLabel('metoda-cambridge')).toBe('Metoda Cambridge');
  });

  it('counts reading minutes at 200 words per minute, at least one', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('cuvânt '.repeat(200))).toBe(1);
    expect(readingMinutes('cuvânt '.repeat(201))).toBe(2);
    expect(readingMinutes('  un\n\ndoi   trei  ')).toBe(1);
  });

  it('formats dates the Romanian way', () => {
    expect(formatPostDate(new Date('2026-09-01T12:00:00Z'))).toBe('1 septembrie 2026');
  });

  it('sorts posts newest first without mutating the input', () => {
    const posts = [
      { id: 'a', data: { publishedAt: new Date('2026-01-01') } },
      { id: 'b', data: { publishedAt: new Date('2026-03-01') } },
    ];
    expect(sortNewestFirst(posts).map((post) => post.id)).toEqual(['b', 'a']);
    expect(posts.map((post) => post.id)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});
```

Run: `npx vitest run src/features/blog`
Expected: FAIL

- [ ] **Step 2: Modelul**

`categories.ts`:

```ts
export const BLOG_CATEGORIES = [
  { id: 'acasa', label: 'Acasă' },
  { id: 'metoda-cambridge', label: 'Metoda Cambridge' },
  { id: 'motivatie', label: 'Motivație' },
  { id: 'scoala', label: 'Școală' },
] as const;

export type BlogCategoryId = (typeof BLOG_CATEGORIES)[number]['id'];

export const BLOG_CATEGORY_IDS = BLOG_CATEGORIES.map((category) => category.id) as [
  BlogCategoryId,
  ...BlogCategoryId[],
];

export function categoryLabel(id: BlogCategoryId): string {
  return BLOG_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
```

`reading-minutes.ts`:

```ts
const WORDS_PER_MINUTE = 200;

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
```

`format-post-date.ts`:

```ts
const formatter = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Bucharest',
});

export function formatPostDate(date: Date): string {
  return formatter.format(date);
}
```

`sort-newest-first.ts`:

```ts
export function sortNewestFirst<T extends { data: { publishedAt: Date } }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
```

Run: `npx vitest run src/features/blog`
Expected: PASS (5 teste)

- [ ] **Step 3: Colecția și accesul la date**

`src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { BLOG_CATEGORY_IDS } from './features/blog/model/categories';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(BLOG_CATEGORY_IDS),
      cover: image(),
      coverAlt: z.string(),
      publishedAt: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
```

`src/features/blog/data/posts.ts`:

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import { sortNewestFirst } from '../model/sort-newest-first';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return sortNewestFirst(posts);
}
```

- [ ] **Step 4: Cele 4 ciorne**

Fiecare fișier are forma de mai jos, cu valorile din tabel. Titlul și descrierea sunt exacte din „5. /blog/”. Corpul e descrierea, urmată de paragraful indicat.

```markdown
---
title: "<titlu>"
description: "<descriere>"
category: <categorie>
cover: ../../assets/photos/<foto>.jpg
coverAlt: ""
publishedAt: <dată>
draft: true
---

<descriere>

Articol de exemplu din design. Textul complet urmează.
```

| Fișier | titlu | categorie | foto | dată |
|---|---|---|---|---|
| `5-obiceiuri-de-10-minute.md` | 5 obiceiuri de 10 minute care îl ajută pe copil cu engleza | `acasa` | `boy-reading` | `2026-09-04` |
| `starters-movers-flyers.md` | Starters, Movers, Flyers: ce înseamnă fiecare nivel | `metoda-cambridge` | `teacher-ema` | `2026-09-03` |
| `copilul-nu-vrea-sa-vorbeasca.md` | Copilul meu nu vrea să vorbească în engleză. E normal? | `motivatie` | `hands` | `2026-09-02` |
| `engleza-la-scoala.md` | Cum îl ajută engleza pe copilul tău la școală și în viață | `scoala` | `class` | `2026-09-01` |

Descrierea primului articol conține ghilimele românești („ce e asta?”). În YAML, păstrează-le în interiorul ghilimelelor duble; nu sunt `"` ASCII, deci nu trebuie escapate.

- [ ] **Step 5: Verifică și commit**

Run: `npm run verify`
Expected: verde. `astro check` cunoaște colecția `blog`.

```powershell
git add src/features/blog src/content.config.ts src/content/blog
git commit -m "feat(blog): add blog model, content collection and draft posts"
```

---

### Task 9: Blog — listă cu filtru, pagină de articol

**Files:**
- Create în `src/features/blog/ui/`: `BlogList.astro`, `BlogList.css`, `BlogCard.astro`, `blog-filter.element.ts`, `blog-filter.element.test.ts`, `EmaTip.astro`, `EmaTip.css`, `PostArticle.astro`, `PostArticle.css`
- Create: `src/features/blog/index.ts`
- Create: `src/pages/blog.astro` (generează `/blog/`), `src/pages/blog/[id].astro`

**Interfaces:**
- Consumes: modelul și `getPublishedPosts` (Task 8), `Photo`, `EmaPortrait`, `Eyebrow`.
- Produces:
  - `@features/blog` exportă `BlogList` (`posts: BlogPost[]`), `PostArticle` (`post: BlogPost`), `EmaTip`, `getPublishedPosts` și tipul `BlogPost`;
  - `class BlogFilter extends HTMLElement`, `defineBlogFilter()` (eticheta `blog-filter`).

Pagina de articol nu are design. Folosește aceleași elemente vizuale: eticheta de categorie, titlul mare, fotografia cu radius 32, textul de maxim 70ch și banda „Sfatul Emei”.

- [ ] **Step 1: Scrie testele care pică pentru filtru**

`src/features/blog/ui/blog-filter.element.test.ts`:

```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { defineBlogFilter } from './blog-filter.element';

const MARKUP = `
  <blog-filter>
    <div class="blog-filter__pills">
      <button type="button" data-category="" aria-pressed="true">Toate</button>
      <button type="button" data-category="acasa" aria-pressed="false">Acasă</button>
      <button type="button" data-category="scoala" aria-pressed="false">Școală</button>
      <button type="button" data-category="motivatie" aria-pressed="false">Motivație</button>
    </div>
    <p class="blog-filter__status" aria-live="polite"></p>
    <ul class="blog-filter__list">
      <li data-category="acasa">A1</li>
      <li data-category="scoala">S1</li>
      <li data-category="acasa">A2</li>
    </ul>
  </blog-filter>`;

const items = () => [...document.querySelectorAll<HTMLElement>('.blog-filter__list > li')];
const pill = (category: string) => document.querySelector<HTMLButtonElement>(`[data-category="${category}"]`)!;
const status = () => document.querySelector('.blog-filter__status')!.textContent;

describe('<blog-filter>', () => {
  beforeEach(() => {
    defineBlogFilter();
    const holder = document.createElement('div');
    holder.innerHTML = MARKUP;
    document.body.replaceChildren(...holder.childNodes);
  });

  it('marks itself enhanced and features the first post', () => {
    expect(document.querySelector('blog-filter')!.hasAttribute('data-enhanced')).toBe(true);
    expect(items().map((item) => item.hasAttribute('data-featured'))).toEqual([true, false, false]);
  });

  it('filters by category and features the first visible post', () => {
    pill('scoala').click();
    expect(items().map((item) => item.hidden)).toEqual([true, false, true]);
    expect(items()[1].hasAttribute('data-featured')).toBe(true);
    expect(pill('scoala').getAttribute('aria-pressed')).toBe('true');
    expect(pill('').getAttribute('aria-pressed')).toBe('false');
    expect(status()).toBe('1 articol');
  });

  it('shows everything again with "Toate"', () => {
    pill('acasa').click();
    pill('').click();
    expect(items().every((item) => !item.hidden)).toBe(true);
    expect(status()).toBe('3 articole');
  });

  it('explains an empty category instead of leaving a gap', () => {
    pill('motivatie').click();
    expect(items().every((item) => item.hidden)).toBe(true);
    expect(status()).toBe('Niciun articol în această categorie încă.');
  });

  it('does not enhance twice when reconnected', () => {
    const element = document.querySelector('blog-filter')!;
    element.remove();
    document.body.append(element);
    pill('scoala').click();
    expect(items().filter((item) => !item.hidden)).toHaveLength(1);
  });
});
```

Run: `npx vitest run src/features/blog/ui`
Expected: FAIL

- [ ] **Step 2: Elementul de filtrare**

`src/features/blog/ui/blog-filter.element.ts`:

```ts
export class BlogFilter extends HTMLElement {
  connectedCallback(): void {
    if (this.dataset.enhanced === 'true') return;
    if (this.items().length === 0 && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      return;
    }
    this.dataset.enhanced = 'true';
    for (const pill of this.pills()) {
      pill.addEventListener('click', () => this.select(pill.dataset.category ?? ''));
    }
    this.select('', { announce: false });
  }

  private pills(): HTMLButtonElement[] {
    return [...this.querySelectorAll<HTMLButtonElement>('.blog-filter__pills [data-category]')];
  }

  private items(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('.blog-filter__list > [data-category]')];
  }

  private select(category: string, { announce = true } = {}): void {
    for (const pill of this.pills()) {
      pill.setAttribute('aria-pressed', String((pill.dataset.category ?? '') === category));
    }
    let visible = 0;
    for (const item of this.items()) {
      const show = category === '' || item.dataset.category === category;
      item.hidden = !show;
      item.toggleAttribute('data-featured', show && visible === 0);
      if (show) visible += 1;
    }
    const status = this.querySelector('.blog-filter__status');
    if (status && announce) status.textContent = describeCount(visible);
    if (status && !announce) status.textContent = '';
  }
}

function describeCount(count: number): string {
  if (count === 0) return 'Niciun articol în această categorie încă.';
  return count === 1 ? '1 articol' : `${count} articole`;
}

export function defineBlogFilter(): void {
  if (!customElements.get('blog-filter')) customElements.define('blog-filter', BlogFilter);
}
```

Testul „shows everything again with Toate” așteaptă `3 articole` după un click. Primul apel la `select` (la conectare) nu anunță nimic. Run: `npx vitest run src/features/blog/ui`. Expected: PASS (5 teste).

- [ ] **Step 3: Componentele**

`BlogCard.astro`:

```astro
---
import Photo from '@shared/ui/Photo.astro';
import type { BlogPost } from '../data/posts';
import { categoryLabel } from '../model/categories';
import { readingMinutes } from '../model/reading-minutes';

interface Props {
  post: BlogPost;
}

const { post } = Astro.props;
const href = `/blog/${post.id}/`;
---
<li class="blog-card" data-category={post.data.category}>
  <a href={href} class="blog-card__link">
    <div class="blog-card__image">
      <Photo photo={post.data.cover} alt={post.data.coverAlt} sizes="(min-width: 1100px) 560px, 100vw" />
    </div>
    <div class="blog-card__body">
      <p class="blog-card__meta">
        <span class="blog-card__chip">{categoryLabel(post.data.category)}</span>
        <span>{readingMinutes(post.body ?? '')} min de citit</span>
      </p>
      <h2 class="blog-card__title">{post.data.title}</h2>
      <p class="blog-card__excerpt">{post.data.description}</p>
    </div>
  </a>
</li>
```


`BlogList.astro`:

```astro
---
import type { BlogPost } from '../data/posts';
import { BLOG_CATEGORIES } from '../model/categories';
import BlogCard from './BlogCard.astro';
import './BlogList.css';

interface Props {
  posts: BlogPost[];
}

const { posts } = Astro.props;
---
{posts.length === 0 ? (
  <p class="blog-list__empty">Primele articole apar în curând.</p>
) : (
  <blog-filter>
    <div class="blog-filter__pills" role="group" aria-label="Filtrează după categorie">
      <button type="button" data-category="" aria-pressed="true">Toate</button>
      {BLOG_CATEGORIES.map((category) => (
        <button type="button" data-category={category.id} aria-pressed="false">{category.label}</button>
      ))}
    </div>
    <p class="blog-filter__status" aria-live="polite"></p>
    <ul class="blog-filter__list">
      {posts.map((post) => <BlogCard post={post} />)}
    </ul>
  </blog-filter>
)}

<script>
  import { defineBlogFilter } from './blog-filter.element';
  defineBlogFilter();
</script>
```

`BlogList.css`:
- `blog-filter:not([data-enhanced]) .blog-filter__pills { display: none; }`: fără JS nu există butoane moarte;
- pastilele au contur bleumarin de 2px, `min-height: 44px` și 1rem/800; `[aria-pressed="true"]` are fundal bleumarin și text alb;
- `.blog-filter__status` e text mic, iar mesajul pentru zero articole e vizibil ca text normal;
- lista e `repeat(auto-fill, minmax(min(300px, 100%), 1fr))`, gap 18;
- `.blog-card[data-featured]` are `grid-column: 1 / -1`, iar de la 768px `.blog-card__link` devine `grid-template-columns: 1fr 1fr` și titlul `clamp(1.75rem, 3.4vw, 2.5rem)`;
- cardurile sunt albe, cu radius 26, imaginea `aspect-ratio: 16/10` și `object-fit: cover`;
- eticheta e `--color-peach` cu `--color-text-accent` (galben pe cardul `[data-featured]`).

Aceste stiluri sunt globale (importul CSS din Astro), deci se aplică și cardurilor randate de `BlogCard.astro`.

`EmaTip.astro`:

```astro
---
import EmaPortrait from '@shared/ui/EmaPortrait.astro';
import './EmaTip.css';
---
<aside class="ema-tip" aria-labelledby="ema-tip-heading">
  <EmaPortrait size="sm" alt="Ema" />
  <div class="ema-tip__text">
    <h2 id="ema-tip-heading">Sfatul Emei</h2>
    <p>Nu știi de unde să începi? Fă testul de nivel și îți spunem ce se potrivește copilului tău.</p>
  </div>
  <a class="ema-tip__cta" href="/test-de-nivel/">Fă testul</a>
</aside>
```

`EmaTip.css`:
- bandă portocalie, radius 32, padding 32, `display: flex; flex-wrap: wrap; gap: 24px; align-items: center`;
- **textul are `--text-button`/700**, titlul 1.5rem/900;
- CTA galben cu text bleumarin și umbra `0 5px 0 var(--color-sun-shadow)`.

`PostArticle.astro`:

```astro
---
import { render } from 'astro:content';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import Photo from '@shared/ui/Photo.astro';
import type { BlogPost } from '../data/posts';
import { categoryLabel } from '../model/categories';
import { formatPostDate } from '../model/format-post-date';
import { readingMinutes } from '../model/reading-minutes';
import EmaTip from './EmaTip.astro';
import './PostArticle.css';

interface Props {
  post: BlogPost;
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<article class="post">
  <header class="post__header">
    <Eyebrow>{categoryLabel(post.data.category)}</Eyebrow>
    <h1>{post.data.title}</h1>
    <p class="post__meta">
      <time datetime={post.data.publishedAt.toISOString()}>{formatPostDate(post.data.publishedAt)}</time>
      {' · '}{readingMinutes(post.body ?? '')} min de citit
    </p>
  </header>
  <div class="post__cover">
    <Photo photo={post.data.cover} alt={post.data.coverAlt} sizes="(min-width: 960px) 900px, 100vw" eager />
  </div>
  <div class="post__body">
    <Content />
  </div>
  <EmaTip />
  <a class="post__back" href="/blog/">← Toate articolele</a>
</article>
```

`PostArticle.css`:
- `max-width: 900px` centrat, cu padding `var(--gutter)`;
- `h1` are `clamp(2.25rem, 5vw, 3.5rem)`;
- `.post__body` are `max-width: 70ch`, text 1.125rem/1.6, iar `h2`/`h3` din articol 1.75rem/1.375rem;
- linkurile din articol sunt `--color-text-accent` subliniate;
- coperta are radius 32 și `aspect-ratio: 16/9`.

`src/features/blog/index.ts`:

```ts
export { default as BlogList } from './ui/BlogList.astro';
export { default as EmaTip } from './ui/EmaTip.astro';
export { default as PostArticle } from './ui/PostArticle.astro';
export { getPublishedPosts } from './data/posts';
export type { BlogPost } from './data/posts';
```

- [ ] **Step 4: Paginile**

Lista principală stă în `src/pages/blog.astro`; cu `build.format: 'directory'` generează `/blog/`.

`src/pages/blog.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { BlogList, EmaTip, getPublishedPosts } from '@features/blog';
import Eyebrow from '@shared/ui/Eyebrow.astro';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';

const posts = await getPublishedPosts();
---
<BaseLayout
  title="Blog"
  description="Sfaturi scurte pentru părinți: cum îți ajuți copilul cu engleza acasă, fără teme în plus."
>
  <Header active="blog" />
  <main id="continut" class="container blog-page">
    <Eyebrow>Blog</Eyebrow>
    <h1>Sfaturi pentru părinți</h1>
    <p class="blog-page__lead">Idei scurte despre cum îți ajuți copilul cu engleza acasă, fără teme în plus.</p>
    <BlogList posts={posts} />
    <EmaTip />
  </main>
  <Footer />
</BaseLayout>

<style>
  .blog-page {
    display: flex;
    flex-direction: column;
    gap: 40px;
    padding-block: 64px 96px;
  }

  .blog-page h1 {
    font-size: clamp(2.5rem, 6vw, 4.25rem);
  }

  .blog-page__lead {
    max-width: 600px;
    margin: 0;
    font-size: 1.1875rem;
  }
</style>
```

`src/pages/blog/[id].astro` (layout-ul prin aliasul `@layouts/*` din Task 2):

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { getPublishedPosts, PostArticle, type BlogPost } from '@features/blog';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

interface Props {
  post: BlogPost;
}

const { post } = Astro.props;
---
<BaseLayout title={post.data.title} description={post.data.description}>
  <Header active="blog" />
  <main id="continut">
    <PostArticle post={post} />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 5: Rulează și verifică ambele moduri**

Run: `npx vitest run src/features/blog`
Expected: PASS

Run: `npm run verify`
Expected: verde. `astro build` rulează în modul producție, deci ciornele sunt excluse.

Run: `Select-String -Path dist/blog/index.html -Pattern 'Primele articole apar în curând.' -SimpleMatch; Test-Path dist/blog/starters-movers-flyers`
Expected: o potrivire; `False`

Run: `npm run dev`, apoi deschide `http://localhost:4321/blog/`.
Expected: 4 articole, primul mare; filtrul pe „Școală” lasă unul; fiecare card deschide pagina articolului.

- [ ] **Step 6: Commit**

```powershell
git add src/features/blog src/pages/blog.astro src/pages/blog
git commit -m "feat(blog): add filterable post list and post page"
```

---

### Task 10: Pagina 404 și verificarea finală a tuturor paginilor

**Files:**
- Create: `src/pages/404.astro`
- Test: `tests/pages/pages.test.ts`
- Modify: `package.json` (script `test:dist`), `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `npm run test:dist`, care verifică HTML-ul generat în `dist/` după build.

- [ ] **Step 1: Pagina 404**

`src/pages/404.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import EmaPortrait from '@shared/ui/EmaPortrait.astro';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';
---
<BaseLayout title="Pagina nu există" description="Pagina căutată nu există pe site-ul English Minds Academy.">
  <Header />
  <main id="continut" class="container not-found">
    <EmaPortrait size="md" alt="Ema" />
    <h1>Ups, pagina asta nu există.</h1>
    <p>Poate a fost mutată. Te ajutăm să ajungi unde voiai.</p>
    <div class="not-found__actions">
      <a class="not-found__primary" href="/">Mergi la pagina principală</a>
      <a class="not-found__secondary" href="/test-de-nivel/">Fă testul de nivel</a>
    </div>
  </main>
  <Footer />
</BaseLayout>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding-block: 64px 96px;
    text-align: center;
  }

  .not-found h1 {
    font-size: clamp(2rem, 5vw, 3.25rem);
  }

  .not-found p {
    margin: 0;
    font-size: 1.1875rem;
  }

  .not-found__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .not-found__actions a {
    padding: 14px 26px;
    border-radius: var(--radius-pill);
    font-weight: 900;
    font-size: var(--text-button);
    text-decoration: none;
  }

  .not-found__primary {
    background: var(--color-orange);
    color: var(--color-white);
    box-shadow: 0 5px 0 var(--color-orange-shadow);
  }

  .not-found__secondary {
    border: 3px solid var(--color-navy);
    color: var(--color-navy);
  }
</style>
```

- [ ] **Step 2: Testul pe HTML-ul generat**

`tests/pages/pages.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dist = resolve(import.meta.dirname, '../../dist');
const PAGES = ['index.html', 'grupe/index.html', 'metoda-cambridge/index.html', 'tabere/index.html', 'blog/index.html', '404.html'];

const read = (page: string) => readFileSync(join(dist, page), 'utf8');

describe.runIf(existsSync(dist))('built pages', () => {
  it.each(PAGES)('%s exists with lang="ro", one h1, a title and a description', (page) => {
    const html = read(page);
    expect(html).toContain('<html lang="ro"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain('id="continut"');
  });

  it.each(PAGES)('%s has alt text on every image', (page) => {
    for (const img of read(page).match(/<img[^>]*>/g) ?? []) expect(img).toMatch(/\salt="/);
  });

  it('home links every level to its anchor on the groups page, and each anchor exists', () => {
    const home = read('index.html');
    const grupe = read('grupe/index.html');
    for (const slug of ['starters', 'pre-a1', 'movers', 'flyers', 'a2-key']) {
      expect(home).toContain(`href="/grupe/#${slug}"`);
      expect(grupe).toContain(`id="${slug}"`);
    }
  });

  it('ships optimized images, not the original jpgs', () => {
    expect(read('index.html')).toMatch(/type="image\/avif"/);
    expect(read('index.html')).not.toMatch(/src="[^"]*ema-reading\.jpg"/);
  });
});
```

În `vitest.config.ts`, la `test.exclude`, adaugă `'tests/pages/**'`: testul rulează separat, după build.

În `package.json`, la `scripts`:

```json
"test:dist": "vitest run --dir tests/pages --exclude \"\"",
```

și `verify` devine:

```json
"verify": "npm run lint && npm run check && npm run test && npm run deps && npm run build && npm run test:dist && npm run build:server"
```

Dacă `--exclude ""` nu anulează excluderea din config în Vitest 5, folosește un fișier separat `vitest.dist.config.ts`: `getViteConfig({ test: { include: ['tests/pages/**/*.test.ts'] } })`, iar scriptul devine `vitest run --config vitest.dist.config.ts`. Raportează ce variantă ai ales.

În `.github/workflows/ci.yml`, după `npm run build`, adaugă pasul `- run: npm run test:dist`.

- [ ] **Step 3: Rulează și verifică**

Run: `npm run verify`
Expected: verde, inclusiv `test:dist` (6 × 2 + 2 teste).

Verificare vizuală, cu `npm run preview`, pe fiecare pagină la 360, 768 și 1280px:
- nu apare derulare orizontală;
- conturul de focus e vizibil la Tab;
- textele pe portocaliu sunt mari și groase;
- `/nu-exista/` afișează pagina 404.

- [ ] **Step 4: Commit**

```powershell
git add src/pages/404.astro tests/pages vitest.config.ts package.json .github/workflows/ci.yml
git commit -m "feat(pages): add 404 page and checks on the built HTML"
```

---

## După acest plan

1. **Etapa 3:** testul de nivel la `/test-de-nivel/`, cu diploma. Invitația de pe Acasă și linkurile „Fă testul” duc deja acolo.
2. **Etapa 4:** formularul și lecția demo.
   - Încep cu cerințele notate în planul fundației (limita de mărime a cererii, IP-ul clientului, `getSetCookie`, `.env.example`).
   - Formularul de pe Acasă intră în `<slot />`-ul din `HomeContact`.
   - Se creează pagina `/lectie-demo/`, care citește `?grupa=<slug>`.
3. **Înainte de lansare:**
   - completarea câmpurilor `TODO` din `site.ts`: curs, tabere, firmă;
   - articole reale de blog: `draft: false` și text complet.
