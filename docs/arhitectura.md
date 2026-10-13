# Arhitectura site-ului

Pentru dezvoltatori. Instrucțiunile pentru cine administrează site-ul sunt în [`operare/`](operare/README.md).

## Scopul

Site public pentru English Minds Academy (Cluj-Napoca), pentru părinții copiilor de 5–14 ani. Rostul lui este să aducă rezervări la lecția demo gratuită și să permită măsurarea campaniilor plătite (Meta, Google).

Cerințe care contează la orice modificare:

- din reclamă, un părinte de pe telefon ajunge la rezervare în cel mult 2 ecrane, iar contactul se salvează chiar dacă nu mai trimite mesajul pe WhatsApp;
- fiecare contact păstrează sursa (pagina și UTM); evenimentul „Lead” ajunge la Meta și Google doar cu acord;
- GDPR: date în UE, consimțământ dovedibil, ștergere automată, minimizare;
- Lighthouse cel puțin 90 la toate cele patru categorii, pe mobil, pe toate paginile;
- logica, conținutul, componentele interactive și serverul nu depind de Astro; se pot muta în alt framework schimbând doar rutele și layout-urile.

## Stack

| Rol | Alegere |
|---|---|
| Site | Astro, output static |
| Componente interactive | Web Components (custom elements, light DOM), TypeScript |
| Stiluri | CSS simplu: `src/styles/tokens.css` și un `.css` per componentă. Fără Tailwind, fără CSS-in-JS |
| Server | Node + TypeScript, handler pe standardul `Request → Response` |
| Validare | Valibot; aceeași schemă în browser și pe server |
| Bază de date | MySQL/MariaDB de la hosting, accesat doar prin `LeadRepository` |
| Notificări | email (nodemailer, SMTP-ul domeniului) și, opțional, Telegram |
| Consimțământ | vanilla-cookieconsent v3 și Google Consent Mode v2 |
| Hosting | cPanel cu Node.js (Passenger), MySQL, email, SSL |
| Teste | Vitest, Playwright, Lighthouse CI |

## Cum circulă un contact

```
Browser
  ├── pagini HTML statice (Astro) din public_html/
  │     ├── <level-test>      scor și diplomă calculate local
  │     ├── <lead-form>       validare cu schema comună
  │     └── <cookie-consent>  după acord: Meta Pixel, gtag
  └── POST /api/lead ──► aplicația Node (Passenger)
                           ├── validează (aceeași schemă)
                           ├── verifică limitele de trimitere (MySQL)
                           ├── salvează (LeadRepository)
                           └── anunță prin email și Telegram, fără să blocheze răspunsul
      apoi browserul deschide WhatsApp cu mesajul precompletat
```

1. Părintele completează numele, telefonul, grupa de vârstă și bifează acordul.
2. `<lead-form>` validează local, apoi trimite prin `lead.client.ts`.
3. Serverul revalidează, aplică limitele, salvează contactul și răspunde `201`. Notificările pleacă după răspuns; ce nu a ajuns la niciun canal e reluat de jobul `notify-pending-leads`.
4. Formularul emite `lead.submitted`; modulul `consent` îl transformă în „Lead” pentru Pixel și GA, doar dacă există acord.
5. Se deschide WhatsApp. Dacă fereastra e blocată, părintele vede numărul și un buton de apel.
6. Dacă serverul nu răspunde (rețea sau 5xx), părintele ajunge totuși pe WhatsApp și vede că rezervarea se finalizează acolo.

Fără JavaScript, formularul arată un mesaj de rezervă cu WhatsApp și telefon.

## Structura proiectului

```
src/
├── pages/        rute Astro subțiri, doar asamblează
├── layouts/      BaseLayout: <head>, SEO, Open Graph, JSON-LD, <cookie-consent>
├── sections/     secțiunile unei singure pagini (home, grupe, metoda, tabere, lectie-demo, legal)
├── features/     blog, consent, faq, lead-capture, level-test
├── shared/
│   ├── content/    site.ts (sursa unică a conținutului), photos.ts
│   ├── contracts/  lead.schema.ts, domain-events.ts, policy.ts
│   ├── seo/        meta, JSON-LD, sitemap, site-env
│   ├── lib/        with-base.ts și alte utilitare
│   └── ui/         componente comune (.astro + .css), site-menu, sticky-contact
├── core/         infrastructură fără domeniu: analytics, build, ui
├── styles/       tokens.css, base.css
├── assets/       fotografiile
└── content/      blog/*.md, legal/*.md
server/           handler, config, leads/, jobs/, db/migrations/
tests/            e2e (Playwright), pages, boundaries, deploy, preview, staging, support
```

Un feature are `index.ts` (singura intrare permisă din afară) și, după nevoie, `model/`, `ui/`, `api/`, `data/`. Logica pură stă în `model/`: fără DOM, Astro sau rețea. Testele stau lângă cod, cu sufixul `.test.ts`.

### Granițe de import

Verificate de dependency-cruiser (`npm run deps`) pentru `.ts` și de ESLint (`no-restricted-imports`) pentru `.astro`, pe care dependency-cruiser nu le citește. O regulă nouă se adaugă în ambele locuri. `tests/boundaries/` conține câte un test pe regulă.

- `pages/` și `layouts/` intră într-un feature doar prin `index.ts`; pot folosi `sections/`, `shared/`, `core/`, `styles/`.
- `sections/` folosesc `features/*` (prin `index.ts`), `shared/`, `core/`, `styles/`. Doar `pages/` și alte `sections/` le importă; nu importă layout-uri.
- Un feature nu importă alt feature și nu depinde de pagini sau layout-uri.
- `shared/` și `core/` nu depind de features sau pagini.
- `server/` importă din `src/` doar `shared/contracts/`; `src/` nu importă din `server/`.
- Fără `../../`. Aliasuri: `@features/`, `@shared/`, `@core/`, `@sections/`, `@layouts/`, `@assets/`. Un singur `../` e permis în interiorul aceluiași feature.
- Fără barrel-uri în subfoldere și fără `export *`.

Feature-urile comunică prin `CustomEvent`-uri definite în `shared/contracts/domain-events.ts`. Evenimentele nu conțin nume sau telefon.

| Eveniment | Emis de | Ascultat de | Conținut |
|---|---|---|---|
| `lead.submitted` | lead-capture | consent | sursa, grupa de vârstă |
| `level-test.completed` | level-test | lead-capture (completează formularul) | mod, nivel, scor, total |
| `consent.changed` | consent | lead-capture (păstrează UTM-urile doar cu acord) | categoriile acceptate |
| `lead-form.requested` | level-test | lead-capture | fără conținut |

## Web Components

Tot ce e interactiv este un custom element în light DOM, scris în TypeScript și montat peste HTML-ul randat de Astro (îmbunătățire progresivă). Fișierul se numește `<nume>.element.ts` și exportă o funcție `define…()` care înregistrează elementul o singură dată (`customElements.get(...)` înainte de `define`). Markup-ul vine din componenta `.astro` a featureului, stilurile din `.css`-ul alăturat. Testele rulează în happy-dom (`// @vitest-environment happy-dom`).

## Conținut

Textele, prețurile, programul, datele firmei și ID-urile de măsurare sunt în `src/shared/content/site.ts`, singura sursă. Câmpurile necompletate au valori care încep cu `TODO`. Integrarea `require-complete-content` (`src/core/build/`) caută aceste marcaje la fiecare build: cu `SITE_ENV=production` build-ul eșuează, în rest doar avertizează. Cum se editează conținutul: [`operare/continut.md`](operare/continut.md).

## Medii și linkuri interne

`SITE_ENV` stabilește comportamentul build-ului (`src/shared/seo/site-env.ts`):

| Valoare | Indexare | Formular |
|---|---|---|
| `production` | da | trimite la server |
| `staging` | `noindex` și `robots.txt` care interzice tot | trimite la server |
| `preview` | la fel ca staging | dezactivat: arată starea de mulțumire fără apel la server |
| oricare alta sau lipsă (dezvoltare, CI) | da | trimite la server |

Previzualizarea pentru client (`preview`) se publică sub un subfolder al GitHub Pages, prin `SITE_BASE` și `SITE_URL`. De aceea orice link intern sau asset trebuie să treacă prin `withBase()` din `@shared/lib/with-base`, nu să fie scris cu `/` la început. `prefix-base-plugin` face același lucru în Markdown.

## Serverul

- `server/entry.node.ts` este singurul fișier dependent de runtime. `handle-request.ts` rutează `/api/lead` și `/api/health` și lucrează doar cu `Request` și `Response`.
- Doar `server/config/environment.ts` citește `process.env`. Validează la pornire; la o valoare greșită procesul se oprește fără să afișeze variabile.
- `leads/submit-lead.ts` orchestrează: filtru de roboți, validare, limite, salvare, notificare. Accesul la bază trece prin porturile din `leads/ports.ts`, cu implementări MySQL și fake-uri în teste.
- Joburile `jobs/purge-expired-leads` și `jobs/notify-pending-leads` rulează din cron. `npm run build:server` produce în `dist-server/` trei pachete: `app.cjs` și cele două joburi.
- Migrațiile SQL sunt în `server/db/migrations/` și pot fi rulate de mai multe ori.

Variabilele de mediu și cron-ul: [`operare/server.md`](operare/server.md).

### Contractul `POST /api/lead`

Corpul JSON: `parentName`, `phone`, `childAgeGroup`, `source` (`home`, `landing` sau `test`), `testLevel`, `consent`, `policyVersion`, `utm`, `website` (honeypot) și `elapsedMs`.

| Status | Când | Corp |
|---|---|---|
| 201 | salvat | `{ "ok": true }` |
| 400 | validare eșuată sau lipsă acord | `{ "ok": false, "error": "validation", "fields": [...] }` |
| 429 | limită depășită | `{ "ok": false, "error": "rate_limited" }` |
| 500 | eroare internă | `{ "ok": false, "error": "internal" }`, detaliile doar în log |

- Un honeypot completat sau un `elapsedMs` sub 3000 primește `201` fără salvare, ca robotul să nu primească semnal.
- Limitele: 5 trimiteri pe oră pentru aceeași amprentă IP (SHA-256 cu sare, IP-ul nu se stochează) și un plafon pe oră pentru tot site-ul. Dacă adresa vizitatorului nu poate fi stabilită, se aplică doar plafonul general.
- Dacă notificarea eșuează după salvare, răspunsul rămâne `201`; erorile se scriu în log fără date personale.
- Cât se păstrează și cum se șterg datele: [`operare/date-personale.md`](operare/date-personale.md).

### Erori în interfață

`lead.client.ts` întoarce un rezultat tipat: `ok`, `validation`, `rate_limited`, `network` sau `server`. Interfața afișează mesaje în română pentru fiecare caz și nu arată niciodată textul brut de la server. `catch {}` gol nu este permis.

## Capcane cunoscute

- **`cookie-consent.css`:** selectorii `#cc-main#cc-main` dublează intenționat id-ul. Stilurile bibliotecii se încarcă după ale noastre și, cu un singur id, ar reseta fontul și culorile. Pe telefon biblioteca forțează coloana cu `!important`, deci doar `!important` poate pune cele două alegeri alăturate.
- **Revizia cookie-urilor:** `COOKIE_REVISION` (`consent-config.ts`) crește când se schimbă politica de cookie-uri; toți vizitatorii sunt întrebați din nou. Nu e legată de `POLICY_VERSION` (acordul din formular).
- **Poziția bannerului:** `<cookie-consent>` se montează la începutul lui `<body>`, ca tastatura să ajungă la banner imediat după linkul „Sari la conținut”.
- **`Footer.css`:** `:where(a:not(.button))` ține culoarea linkurilor la specificitate zero, ca regulile proprii ale subsolului (buton social, linkuri legale, hover) să câștige.
- **`Header.css`:** meniul se restrânge în `@media (scripting: enabled)` încă dinainte ca `site-menu` să fie definit; altfel antetul s-ar micșora după încărcare (layout shift). În DOM, butonul precede `<nav>`, ca Tab de pe buton să intre în meniul deschis (verificat în `Header.test.ts`).
- **`lectie-demo.css`:** `lead-form:not(:defined)` rezervă înălțimea formularului (`--lead-form-reserved-height*`, valorile măsurate rotunjite în jos), ca secțiunile de sub el să nu sară când elementul înlocuiește varianta fără JavaScript.
- **`Logo.css`:** textul logotipului este exceptat de la contrastul WCAG 1.4.3, deci un avertisment axe `color-contrast` pe `.logo__academy` este așteptat.
- **Previzualizare imagini sociale:** `ogImageSize` dă cel mai mare decupaj 1,91:1 care încape în sursă; Astro nu mărește imaginile, deci o copertă mică nu trebuie să declare 1200×630.
- **Fereastra de tipărire:** `openPrintWindowSynchronously` (`level-test.element.ts`) se apelează înainte de orice `await`; Safari blochează altfel fereastra, fiind considerată neinițiată de utilizator.
- **Google tag:** `GTAG_STUB` (`consent-defaults.ts`) pune în `dataLayer` obiectul `arguments`, nu un array; altfel `gtag.js` ignoră comanda. Evenimentele GTM (`generate_lead`, `em_consent`) sunt obiecte simple, nu comenzi gtag.
- **Teste de build (`staging`, `preview`):** `buildSiteOnSameDrive` construiește în `node_modules/.cache`, nu în directorul temporar al sistemului: Astro mută fișiere din `.astro/`, ceea ce pe Windows eșuează între unități diferite (EXDEV). Vitest setează `BASE_URL=/`, iar Vite lasă variabila să suprascrie `base`, deci helperul o scoate din mediu.
- **Migrația 003:** folosește variabile de sesiune și `PREPARE`, care trăiesc pe o singură conexiune; testele o rulează prin `runMigrationsOnOneConnection`.
- **Teste în happy-dom:** `connectedCallback` rulează înainte ca descendenții din `innerHTML` să existe, deci testele de elemente parsează într-un container detașat și abia apoi atașează (`attachAfterParsing`).

## Teste

| Strat | Comandă | Ce acoperă |
|---|---|---|
| Unitare, componente, server | `npm test` | Logica din `model/`, scheme, Web Components (happy-dom), handler-ul și joburile cu fake-uri din `tests/support/`. Testul MySQL rulează doar cu `TEST_DATABASE_URL` (în CI, pe un serviciu MariaDB) |
| Granițe | `npm test` | `tests/boundaries/`: fiecare regulă dependency-cruiser și ESLint, verificată pe o încălcare plantată |
| Build-ul final | `npm run test:dist` | Paginile din `dist/`: meta, JSON-LD, linkuri interne, sitemap, imagini |
| Staging și preview | `npm run test:staging`, `npm run test:preview` | Build-uri cu `SITE_ENV` respectiv: `noindex`, `robots.txt`, formular demo, prefix de bază |
| Browser | `npm run test:e2e` | Playwright pe mobil și desktop, pe un `dist/` deja construit: testul de nivel, formularul, bannerul de cookie-uri, navigarea |
| Calitate | `npm run lighthouse` | Cel puțin 0,9 la cele patru categorii, pe toate paginile |

Biblioteca de cookie-uri ascunde bannerul de browserele automate; testele E2E îl afișează prin `showBannerToTests` din `tests/e2e/support/tracking.ts`.

`npm run verify` rulează local lanțul din CI: lint, tipuri, teste, granițe, build, `test:dist`, build server, `test:staging`, `test:preview`.

## Convenții de cod

- Commit-uri Conventional Commits, la imperativ, cu scope feature sau strat: `feat(lead-capture): …`. Un pas logic per commit, cu testele verzi; mutările de fișiere nu se amestecă cu schimbările de comportament.
- Cod nou: vezi mai sus unde stă fiecare lucru. O pagină nouă înseamnă un fișier subțire în `src/pages/`, cu secțiunile în `src/sections/<pagină>/`.

## Publicare

CI-ul rulează la fiecare push pe `main`/`staging` și la fiecare pull request. După un CI verde, GitHub Actions publică prin SFTP: `main` în producție (cu aprobare), `staging` pe subdomeniul de staging. Preview-ul pentru client se publică separat, pe GitHub Pages, după fiecare CI verde pe `main` (workflow-ul `pages.yml`). Detalii: [`operare/publicare.md`](operare/publicare.md).
