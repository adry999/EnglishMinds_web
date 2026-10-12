# E2E, Lighthouse și verificarea de staging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fluxurile principale se testează în browser real (Playwright, mobil + desktop), iar Lighthouse cere cel puțin 90 la toate cele 4 categorii, pe toate paginile, în CI. Pentru staging rămâne o listă de verificare scrisă, gata de rulat când există hosting.

**Architecture:** Playwright rulează contra `astro preview`, care servește `dist/`. `/api/lead` se simulează cu `page.route`, ca testele să nu depindă de MySQL. Testele bannerului injectează ID-uri de test în atributul `data-tracking`, rescriind HTML-ul în `page.route`. Cererile spre Google și Meta sunt interceptate și înregistrate, niciodată trimise. Lighthouse CI rulează pe `dist/` (`staticDistDir`), cu presetul mobil. Un job CI nou, `browser`, rulează ambele.

**Tech Stack:** `@playwright/test@1.63.0`, `@lhci/cli@0.15.1` (ambele pin exact, mai vechi de 2 săptămâni), Astro 7.3.8 static, GitHub Actions `ubuntu-latest`.

**Spec:** `docs/superpowers/specs/2026-10-09-site-englishminds-design.md` (§1 Lighthouse ≥ 90, §9 rândurile Playwright și Lighthouse, §10 staging, §14 etapa 7)

## Global Constraints

- Fără `Co-Authored-By` sau mențiuni Claude în commituri și PR-uri.
- Dependențe noi doar dev și pin exact: `@playwright/test@1.63.0`, `@lhci/cli@0.15.1`.
- Testele E2E stau în `tests/e2e/` (exclus deja din Vitest), cu fișiere `*.spec.ts`.
- Fără `../../`, fără `export *`, fără `catch {}` gol. `process.env` se citește doar în fișierele de config (`playwright.config.ts`, `lighthouserc.cjs`), adăugate la excepțiile ESLint.
- Niciun test nu face cereri reale spre `googletagmanager.com`, `facebook.net`, `wa.me` sau `/api`. Toate se interceptează.
- Biblioteca de cookies ascunde bannerul pentru boți (`navigator.webdriver`, plus regexul `bot|crawl|spider|slurp|teoma` pe user-agent). În testele bannerului, `navigator.webdriver` se forțează la `false` printr-un init script.
- Formularul așteaptă `MIN_ELAPSED_MS + 200` (3,2 s) înainte de trimitere. Testele așteaptă cererea, nu un timp fix.
- Lighthouse: minimum 0.9 la `performance`, `accessibility`, `best-practices` și `seo`, pe fiecare URL, cu presetul mobil implicit. Pragul nu se coboară. O pagină care nu trece se repară în cod.
- `npm run verify` rămâne verde și nu include E2E/Lighthouse: acestea sunt scripturi separate și un job CI separat.
- Commituri Conventional, în engleză, la imperativ.

## Review Focus

1. **Testele bannerului pot trece fals** dacă bannerul e ascuns pentru boți. Primul test cere ca bannerul să fie vizibil, înainte de orice altă aserțiune (Task 1).
2. **„Refuz nu încarcă taguri”** trebuie să verifice absența cererilor de rețea, nu doar absența tagurilor `<script>` (Task 1).
3. **Popup-ul WhatsApp** se deschide sincron la click. Testul ascultă evenimentul `popup` înainte de click și verifică URL-ul `wa.me` cu mesajul precompletat. Popup-ul nu se încarcă (`wa.me` e interceptat) (Task 2).
4. **Serverul căzut** (500 sau rețea întreruptă) trebuie să ducă tot pe WhatsApp, cu mesajul că rezervarea se finalizează acolo (spec §3 pasul 6) (Task 2).
5. **Lighthouse pe mobil** e cel mai probabil să cadă la performance (fonturi, imagini) sau la contrast. Raportul listează scorul fiecărei pagini (Task 3).

---

### Task 1: Playwright, configurare și testele bannerului de cookies

**Files:**
- Modify: `package.json`, `package-lock.json` (`@playwright/test` `1.63.0` în `devDependencies`; scriptul `"test:e2e": "playwright test"`)
- Create: `playwright.config.ts`
- Create: `tests/e2e/support/tracking.ts`
- Create: `tests/e2e/consent.spec.ts`
- Modify: `eslint.config.js` (`playwright.config.ts` la excepțiile `process.env`)
- Modify: `.gitignore` (`test-results/`, `playwright-report/`)

**Interfaces:**
- Produces:
  - `TEST_TRACKING`, `TAG_HOSTS`;
  - `useTestTracking(page): Promise<string[]>` (lista de URL-uri de tag cerute, care crește pe măsură ce sosesc cereri);
  - `showBannerToTests(page)`.
  
  Task 2 le folosește.

- [ ] **Step 1: Instalare**

```bash
npm install --save-dev --save-exact @playwright/test@1.63.0
npx playwright install chromium
```

În `package.json` adaugă scriptul `"test:e2e": "playwright test"`. În `.gitignore` adaugă `test-results/` și `playwright-report/`.

- [ ] **Step 2: Configurarea**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

Testele presupun un `dist/` construit (`npm run build`). Scrie asta într-un comentariu de o linie deasupra `webServer`.

În `eslint.config.js`, adaugă `'playwright.config.ts'` în lista `files` a blocului care oprește `no-restricted-properties`.

- [ ] **Step 3: Helperi**

`tests/e2e/support/tracking.ts`:

```ts
import type { Page } from '@playwright/test';

export const TEST_TRACKING = {
  ga4MeasurementId: 'G-TEST12345',
  metaPixelId: '123456789012345',
  googleAdsId: 'AW-1234567890',
  googleAdsLeadLabel: 'TestLabel_1',
};

export const TAG_HOSTS = /googletagmanager\.com|google-analytics\.com|googleadservices\.com|doubleclick\.net|facebook\.net|facebook\.com/;

/** The cookie library hides its banner from automated browsers; real visitors are not webdriver-driven. */
export async function showBannerToTests(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
  });
}

/**
 * Serves pages with valid test ids in <cookie-consent data-tracking> and records every tag request
 * instead of letting it reach Google or Meta. Returns the live list of requested tag URLs.
 */
export async function useTestTracking(page: Page): Promise<string[]> {
  const requested: string[] = [];
  await page.route(TAG_HOSTS, async (route) => {
    requested.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  await page.route(
    (url) => url.origin === 'http://localhost:4321' && (url.pathname.endsWith('/') || url.pathname.endsWith('.html')),
    async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        /data-tracking="[^"]*"/,
        `data-tracking="${JSON.stringify(TEST_TRACKING).replace(/"/g, '&quot;')}"`,
      );
      await route.fulfill({ response, body: html });
    },
  );
  return requested;
}
```

- [ ] **Step 4: Testele bannerului**

`tests/e2e/consent.spec.ts`. Fiecare test începe cu `showBannerToTests(page)` și `useTestTracking(page)`, apoi `page.goto('/')`.

Cazurile:
1. **Fără alegere:**
   - bannerul e vizibil (`#cc-main` conține butoanele „Accept toate”, „Refuz”, „Aleg eu”);
   - după `page.waitForLoadState('networkidle')`, lista de cereri spre taguri e goală;
   - `window.dataLayer[0]` e comanda `consent default` cu toate cele 4 semnale `denied`.
2. **Refuz:**
   - click pe „Refuz”, bannerul dispare, zero cereri spre taguri;
   - reîncărcarea paginii nu mai arată bannerul și tot nu face cereri spre taguri;
   - cookie-ul `em_consent` există.
3. **Accept toate:**
   - click pe „Accept toate”, apoi se așteaptă câte o cerere spre `googletagmanager.com/gtag/js?id=G-TEST12345` și spre `connect.facebook.net/en_US/fbevents.js`;
   - `dataLayer` conține `consent update` cu `analytics_storage: 'granted'` și `ad_storage: 'granted'`.
4. **Aleg eu, doar statistici:**
   - „Aleg eu” → bifează doar categoria „Statistici” → „Salvez alegerea”;
   - se cere gtag.js și nu se cere `fbevents.js`.
5. **Setări cookies din subsol:**
   - după „Accept toate”, butonul „Setări cookies” din footer deschide fereastra de preferințe;
   - „Refuz toate” reîncarcă pagina, iar după reîncărcare nu mai pleacă nicio cerere nouă spre taguri.
6. **Tastatura:**
   - cu Tab, focusul ajunge la butoanele bannerului;
   - Enter pe „Refuz” închide bannerul.

`dataLayer` conține obiecte `Arguments`. În `page.evaluate` convertește-le cu `Array.from(entry)` înainte de a le întoarce.

- [ ] **Step 5: Rulare**

```bash
npm run build
npm run test:e2e -- tests/e2e/consent.spec.ts
```

Expected: toate trec pe ambele proiecte (mobile și desktop). Dacă bannerul tot nu apare, verifică în `node_modules/vanilla-cookieconsent/dist/cookieconsent.esm.js` cum detectează boții și ajustează `showBannerToTests`. Nu dezactiva `hideFromBots` în codul site-ului.

- [ ] **Step 6: Verify + commit**

Run: `npm run verify`

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e eslint.config.js .gitignore
git commit -m "test(e2e): add Playwright and cover the cookie banner end to end"
```

---

### Task 2: E2E pentru formular și testul de nivel + lista de staging

**Files:**
- Create: `tests/e2e/support/lead-api.ts`
- Create: `tests/e2e/lead-form.spec.ts`
- Create: `tests/e2e/level-test.spec.ts`
- Create: `docs/operare/staging.md`

**Interfaces:**
- Consumes: `showBannerToTests`, `useTestTracking` (Task 1). The tests that don't concern the banner accept nothing and close the banner with „Refuz” only if it gets in the way; by default the banner stays hidden, since the browser is a webdriver.
- Produces:
  - `mockLeadApi(page, reply: { status: number; body?: unknown } | 'network-error'): Promise<{ requests: unknown[] }>`;
  - `blockWhatsApp(page)`.

- [ ] **Step 1: Helperi**

`tests/e2e/support/lead-api.ts`:

```ts
import type { BrowserContext, Page } from '@playwright/test';

type Reply = { status: number; body?: unknown } | 'network-error';

/** Answers POST /api/lead without a server and keeps every request body for assertions. */
export async function mockLeadApi(page: Page, reply: Reply): Promise<{ requests: unknown[] }> {
  const requests: unknown[] = [];
  await page.route('**/api/lead', async (route) => {
    requests.push(route.request().postDataJSON());
    if (reply === 'network-error') return route.abort('internetdisconnected');
    return route.fulfill({
      status: reply.status,
      contentType: 'application/json',
      body: JSON.stringify(reply.body ?? (reply.status === 201 ? { ok: true } : { ok: false, error: 'internal' })),
    });
  });
  return { requests };
}

/** The WhatsApp tab must open with the right URL but never load wa.me. */
export async function blockWhatsApp(context: BrowserContext): Promise<void> {
  await context.route(/wa\.me|api\.whatsapp\.com|web\.whatsapp\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>WhatsApp (test)</title>' }),
  );
}
```

- [ ] **Step 2: `tests/e2e/lead-form.spec.ts` (pagina principală, `source: 'home'`)**

Citește `src/features/lead-capture/ui/LeadForm.astro` și `lead-form.element.ts` ca să afli etichetele câmpurilor, mesajele și stările. Folosește locatori pe rol și etichetă (`getByLabel`, `getByRole`), nu clase CSS.

Cazurile:
1. **Câmpuri goale:**
   - trimiterea afișează erorile în română;
   - primul câmp invalid primește focus;
   - câmpurile au `aria-invalid="true"`;
   - nu pleacă nicio cerere spre `/api/lead`.
2. **Telefon invalid** (`12345`): eroare pe telefon, fără cerere.
3. **Succes (201):**
   - completezi nume, telefon `0722 123 456`, grupa și acordul;
   - asculți `context.waitForEvent('page')` (sau `page.waitForEvent('popup')`) înainte de click;
   - cererea are `source: 'home'`, `consent: true`, `policyVersion: '1'`, `website: ''` și `elapsedMs >= 3000`;
   - popup-ul are URL-ul `https://wa.me/40775630680?text=…`, cu numele părintelui în mesaj;
   - pagina arată starea finală de mulțumire.
4. **Server căzut (500) și rețea întreruptă:** popup-ul WhatsApp se deschide tot, iar pagina arată mesajul că rezervarea se finalizează pe WhatsApp.
5. **429:** apare alerta cu linkurile de contact și nu se deschide niciun popup.
6. **Pagina `/lectie-demo/`:** `?grupa=movers` preselectează grupa, iar cererea are `source: 'landing'`.

- [ ] **Step 3: `tests/e2e/level-test.spec.ts`**

Citește `src/features/level-test/ui/level-test.element.ts` și `views.ts` ca să afli pașii.

Cazurile:
1. **Test → diplomă → formular** (`/test-de-nivel/`):
   - alegi testul de nivel și răspunzi la toate întrebările. Prima variantă e suficientă; scorul nu contează;
   - apare rezultatul;
   - scrii numele copilului: apar butoanele diplomei, iar diploma conține numele (canvasul există și are `aria-label`);
   - formularul (ascuns până atunci) devine vizibil;
   - trimiterea, cu API simulat 201, produce o cerere cu `source: 'test'` și `testLevel` potrivit cu `/^(level|exam):[a-z0-9-]{1,24}$/`;
   - numele copilului NU apare nicăieri în corpul cererii.
2. **Întrebări audio fără `speechSynthesis`:** cu `addInitScript` care șterge `window.speechSynthesis`, întrebările audio arată textul și mesajul de rezervă (spec §8).

- [ ] **Step 4: Lista de verificare pentru staging**

`docs/operare/staging.md`, în română, ca listă de bifat, cu comanda sau locul de verificare la fiecare punct:
- **Rutare:** `/api/lead` răspunde pe același domeniu (`curl -i -X POST https://<staging>/api/lead` cu un corp invalid → 400 JSON).
- **IP-ul real al vizitatorului:**
  - în log, două cereri de pe telefoane diferite au amprente diferite;
  - a 6-a cerere într-o oră de pe același IP primește 429;
  - verifică dacă proxy-ul hostingului pune un singur hop în `X-Forwarded-For` (spec §13.1 și `docs/operare/server.md`).
- **Email:** o cerere reală ajunge la `MAIL_TO`; serverul SMTP pe 587 cere TLS.
- **Cron:**
  - `purge-expired-leads` rulează zilnic;
  - în log apare numărul de rânduri șterse.
- **Banner:**
  - Refuz → zero cereri spre Google/Meta în DevTools → Network;
  - Accept → Tag Assistant și Meta Pixel Helper văd tagurile;
  - un formular trimis → `generate_lead`, `conversion` și `Lead`.
- **Lighthouse:** rulează pe URL-ul de staging (mobil); pragul e 90 la toate.
- **Protecția cu parolă:** subdomeniul de staging cere parola și are `noindex` sau e blocat în `robots.txt`.
- **Paginile legale:** datele firmei sunt completate, fără `TODO`.

- [ ] **Step 5: Rulare + verify + commit**

```bash
npm run build
npm run test:e2e
npm run verify
```

Expected: toate E2E trec pe mobile și desktop, iar `verify` e verde.

```bash
git add tests/e2e docs/operare/staging.md
git commit -m "test(e2e): cover the booking form and the level test, add the staging checklist"
```

---

### Task 3: Lighthouse CI și jobul `browser` din CI

**Files:**
- Modify: `package.json`, `package-lock.json` (`@lhci/cli` `0.15.1` dev; scriptul `"lighthouse": "lhci autorun"`)
- Create: `lighthouserc.cjs`
- Modify: `.github/workflows/ci.yml` (jobul nou `browser`)
- Modify: `eslint.config.js` (`lighthouserc.cjs`, dacă e lintat și citește `process.env`)
- Modify: `.gitignore` (`.lighthouseci/`)
- Modify: orice fișier de site necesar ca toate paginile să treacă de 0.9 (vezi Step 4)

- [ ] **Step 1: Instalare și configurare**

```bash
npm install --save-dev --save-exact @lhci/cli@0.15.1
```

`lighthouserc.cjs`:

```js
/** Lighthouse CI on the built site (mobile preset). Every page must reach 0.9 in all four categories. */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/',
        'http://localhost/grupe/',
        'http://localhost/metoda-cambridge/',
        'http://localhost/test-de-nivel/',
        'http://localhost/lectie-demo/',
        'http://localhost/tabere/',
        'http://localhost/blog/',
        'http://localhost/confidentialitate/',
        'http://localhost/cookies/',
        'http://localhost/termeni/',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
```

`lhci` cu `staticDistDir` pornește propriul server pe un port aleator și înlocuiește `http://localhost` cu el. Dacă versiunea 0.15.1 cere alt format pentru `url`, verifică în `node_modules/@lhci/cli` și adaptează. Notează schimbarea în raport.

Script: `"lighthouse": "lhci autorun"`. În `.gitignore` adaugă `.lighthouseci/`.

- [ ] **Step 2: Jobul CI**

În `.github/workflows/ci.yml` adaugă un job nou, paralel cu `verify`:

```yaml
  browser:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npm run lighthouse
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: browser-reports
          path: |
            playwright-report/
            test-results/
            .lighthouseci/
          retention-days: 7
```

- [ ] **Step 3: Rulare locală**

```bash
npm run build
npm run lighthouse
```

Dacă Chrome nu e găsit local, setează `CHROME_PATH` spre Chromium-ul instalat de Playwright (`npx playwright install chromium` afișează calea; e sub `%LOCALAPPDATA%\ms-playwright`). Notează comanda în raport.

- [ ] **Step 4: Repararea paginilor sub 0.9**

Pentru fiecare pagină și categorie sub 0.9:
- citește auditurile care pică din raportul din `.lighthouseci/`;
- repară cauza în cod.

Reguli:
- **Fără coborârea pragului.** Fără excluderea paginii, fără `skipAudits`.
- **Imagini:** `<Image>`/`<Picture>` din `astro:assets`, cu `width`/`height`, `loading="lazy"` sub fold și `fetchpriority="high"` doar pe imaginea LCP.
- **Fonturi:** fișiere `@fontsource` deja locale. Dacă lipsesc, adaugă `font-display: swap`. Preload doar pentru greutatea folosită în hero.
- **Contrast:** respectă regulile de contrast ale proiectului (`docs/design/` și `tokens.css`):
  - text pe portocaliu ≥ 19px și ≥ 700, sau ≥ 24px;
  - `#b8461a` mic doar pe alb/cream/peach.
  
  Nu schimba culorile de brand. Schimbă combinația folosită.
- **Fără refactorizări în afara cauzei.**

Dacă o pagină nu poate trece fără o decizie de design (de exemplu fotografia hero e prea mare și nu există alta), raportează DONE_WITH_CONCERNS. Pune scorurile exacte și auditurile care pică.

Raportul listează scorurile finale pe pagină × categorie.

- [ ] **Step 5: Verify + commit**

```bash
npm run verify
npm run test:e2e
npm run lighthouse
```

```bash
git add package.json package-lock.json lighthouserc.cjs .github/workflows/ci.yml .gitignore eslint.config.js <fișierele reparate>
git commit -m "ci: run Playwright and Lighthouse on every push and fix pages below 90"
```

Dacă reparațiile sunt mai mult de câteva linii, fă-le într-un commit separat înainte, de forma `perf(<scope>): …` / `fix(a11y): …`.

---

## Decizii

1. **`/api/lead` simulat în E2E.** Testul real pe MySQL există deja (integrare în CI). E2E verifică ce vede părintele, iar serverul real se verifică pe staging.
2. **ID-uri de test injectate prin rescrierea HTML-ului** în `page.route`, nu printr-un build separat. Site-ul construit rămâne unul singur.
3. **`navigator.webdriver` forțat la `false`** doar în testele bannerului. `hideFromBots` rămâne activ pe site.
4. **Doar Chromium** (mobil Pixel 7 + desktop), ca CI-ul să rămână rapid. Alte browsere se verifică manual pe staging.
5. **Playwright 1.63.0, nu 1.64.0.** Versiunea 1.64.0 are doar 5 zile, sub pragul de 2 săptămâni.
6. **Staging-ul nu există încă.** Etapa produce lista de verificare (`docs/operare/staging.md`), iar verificarea efectivă se face când există hosting.
7. **Lighthouse rulează pe `dist/` local în CI**, nu pe staging. Același prag se reverifică pe staging conform listei.
