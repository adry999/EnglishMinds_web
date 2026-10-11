# Site English Minds Academy — Design

Data: 2026-10-09 · Status: aprobat (2026-10-11) · Audit de pornire: `docs/audit-2026-10-09.md`

## 1. Scop și criterii de succes

Site public pentru English Minds Academy (Cluj-Napoca), adresat părinților copiilor de 5–14 ani. Obiectivul principal este să **aducă rezervări la lecția demo gratuită** și să permită măsurarea campaniilor plătite (Meta, Google).

Site-ul e reușit dacă:

- un părinte de pe telefon ajunge din reclamă la rezervare în cel mult 2 ecrane, iar contactul e salvat chiar dacă nu trimite mesajul pe WhatsApp;
- fiecare contact păstrează sursa (pagina și UTM), iar evenimentul „Lead” ajunge la Meta/Google doar cu acord;
- datele personale respectă GDPR: stocare în UE, consimțământ dovedibil, ștergere automată, minimizare;
- Lighthouse dă cel puțin 90 la Performance, Accessibility, Best Practices și SEO pe toate paginile, pe mobil;
- **structura e portabilă**: logica, conținutul, stilurile, componentele interactive și backend-ul se pot muta în alt framework (Next, Nuxt etc.) fără rescriere. Se traduc doar rutele și layout-urile.

## 2. Decizii

| Rol | Alegere | Motiv |
|---|---|---|
| Generare site | **Astro**, output static | HTML pur, rapid; Astro face doar asamblarea paginilor |
| Componente interactive | **Web Components** (custom elements, light DOM), TypeScript | Standard de browser; merg neschimbate în orice framework |
| Stiluri | CSS simplu: `tokens.css` (variabile de brand) + un fișier CSS per componentă | Nicio dependență de tool |
| Backend formular | **Node.js + TypeScript**, handler pe standardul web `Request → Response` | Se mută aproape neschimbat în rute API Next/Nuxt sau pe platforme serverless |
| Validare | O singură schemă (Valibot), folosită și în browser, și pe server | Validarea nu poate diverge |
| Bază de date | **MySQL/MariaDB** de la hosting, accesat doar prin `LeadRepository` | Inclus în hosting, în UE; schimbabil ulterior |
| Email notificare | SMTP-ul adresei de pe domeniu (nodemailer) | Fără alt procesator GDPR |
| Hosting | Hosting european **cPanel cu suport Node.js** (Passenger) + MySQL + email + SSL | Un singur furnizor, date în UE |
| Cookies | vanilla-cookieconsent v3 + Google Consent Mode v2 | Open-source, categorii, fără abonament |
| Măsurare | Meta Pixel, Google Analytics 4, Google Ads; doar după acord | Campanii plătite |
| Teste | Vitest (logică, server), Playwright (E2E), Lighthouse CI | |
| Cod și publicare | GitHub (repo privat) + GitHub Actions → SFTP | Publicare automată după teste verzi |

Respinse: Next.js (prea mult JS și complexitate pentru un site de prezentare), PHP (backend-ul ar trebui rescris la o migrare spre JS), Supabase/Vercel (furnizori în plus față de hosting), pagină `/admin` (nu e nevoie; contactele vin pe email, iar ștergerea se face din phpMyAdmin).

## 3. Arhitectură

```
Browser părinte
   │
   ├── pagini HTML statice (Astro build) ── public_html/
   │     ├── <level-test>   scor + diplomă calculate local
   │     ├── <lead-form>    validare cu schema comună
   │     └── <cookie-consent> → după acord: Meta Pixel, gtag
   │
   └── POST /api/lead ──► aplicația Node (Passenger)
                            ├── validează (aceeași schemă)
                            ├── limită de trimiteri (MySQL)
                            ├── salvează (LeadRepository → MySQL)
                            └── trimite emailul (best-effort, nu blochează)
       apoi browserul deschide WhatsApp cu mesajul precompletat
```

Fluxul formularului:

1. Părintele completează nume, telefon, grupa de vârstă și bifează acordul.
2. `<lead-form>` validează local cu schema comună, apoi trimite prin `lead.client.ts`.
3. Serverul revalidează, aplică limita, salvează contactul, trimite emailul și răspunde `201`.
4. Formularul emite evenimentul `lead.submitted`; `consent` îl transformă în „Lead” pentru Pixel/GA, doar dacă există acord.
5. Se deschide WhatsApp. Dacă fereastra e blocată, părintele vede numărul și un buton de apel.
6. Dacă serverul nu răspunde (eroare de rețea sau 5xx), părintele ajunge totuși pe WhatsApp și vede un mesaj că rezervarea se finalizează acolo.

## 4. Structura proiectului

Designurile existente (`*.dc.html`, `support.js`, `assets/`) se mută în `design/`, într-un commit separat, doar cu mutarea. Rămân referință vizuală.

```
src/
├── pages/                    app: rute Astro subțiri, doar asamblează
├── layouts/BaseLayout.astro  app: <head>, SEO, Open Graph, JSON-LD, <cookie-consent>
├── features/
│   ├── level-test/
│   │   ├── index.ts
│   │   ├── model/            score-test.ts, recommend-level.ts (+ .test.ts)
│   │   ├── data/questions.json
│   │   ├── diploma/          render-diploma.ts
│   │   └── ui/               LevelTest.astro, level-test.element.ts, level-test.css
│   ├── lead-capture/
│   │   ├── index.ts
│   │   ├── model/            whatsapp-message.ts (+ .test.ts)
│   │   ├── api/lead.client.ts
│   │   └── ui/               LeadForm.astro, lead-form.element.ts, lead-form.css
│   ├── consent/              config banner, încărcare taguri, ascultă lead.submitted
│   ├── faq/                  ui/ faq.element.ts, Faq.astro, faq.css
│   └── blog/                 listare, filtre, pagină articol
├── shared/
│   ├── content/site.ts       sursă unică: contact, adresă, niveluri, prețuri, program, tabere
│   ├── contracts/            lead.schema.ts (Valibot), domain-events.ts
│   └── ui/                   Logo, Header, Footer, WhatsAppButton, Button (.astro + .css)
├── core/analytics/track.ts   trimite evenimente doar cu acord
├── styles/                   tokens.css, base.css
└── content/
    ├── blog/*.md
    └── legal/                confidentialitate.md, cookies.md, termeni.md
server/
├── entry.node.ts             pornire Node; singurul fișier dependent de runtime
├── handle-request.ts         Request → Response; rutare /api/lead
├── config/environment.ts     citește și validează variabilele de mediu
├── leads/
│   ├── submit-lead.ts        orchestrare: validează → limită → salvează → notifică
│   ├── lead.repository.ts    MySQL
│   ├── rate-limit.ts         contor pe hash IP în MySQL, fereastră 1 oră
│   └── lead-notification.ts  email (nodemailer)
├── jobs/purge-expired-leads.ts   rulat de cron zilnic
├── db/migrations/*.sql
└── *.test.ts lângă cod
tests/
├── e2e/                      Playwright
└── support/                  fake-uri: repository, mailer, clock
```

Reguli de graniță (aplicate de dependency-cruiser în CI):

- `pages/`, `layouts/` → `features/*` (prin `index.ts`), `shared/`, `core/`, `styles/`
- `features/X` → `shared/`, `core/`; **niciodată** alt feature
- `features/*/model/` → nu importă DOM, Astro sau rețea
- `server/` → `shared/contracts/`; **niciodată** `src/features/` sau `src/pages/`
- `src/` → nu importă din `server/`

Comunicarea între feature-uri se face prin evenimente DOM (`CustomEvent`) definite în `shared/contracts/domain-events.ts`:

| Eveniment | Emis de | Ascultat de | Payload |
|---|---|---|---|
| `lead.submitted` | lead-capture | consent (tracking) | `{ source, ageGroup }` |
| `level-test.completed` | level-test | pagina Test (pre-completează `<lead-form>`) | `{ level, score, total }` |

Fără nume sau telefon în evenimente.

## 5. Pagini

| Rută | Sursa design | Conținut |
|---|---|---|
| `/` | `Site v2` | Hero cu Ema, grupe, teaser spre test, FAQ, contact, `<lead-form source="home">` |
| `/grupe/` | `Grupe` | 5 niveluri cu obiective; fapte practice din `site.ts` |
| `/metoda-cambridge/` | `Metoda` | |
| `/test-de-nivel/` | `Test` | `<level-test>` + `<lead-form source="test">` după rezultat |
| `/tabere/` | `Tabere` | Date din `site.ts` |
| `/blog/`, `/blog/[slug]/` | `Blog` | Markdown cu schemă de frontmatter; filtre pe categorie |
| `/lectie-demo/` | `Lectie Demo` | Landing fără meniu, `<lead-form source="landing">` |
| `/confidentialitate/`, `/cookies/`, `/termeni/` | nou | Din `content/legal/` |
| `404` | nou | Link spre Acasă și spre test |

- O singură variantă responsive per pagină. Ținta: 360px, 768px și 1280px.
- Testul scurt din `Site v2` devine teaser cu link spre `/test-de-nivel/`, deci există un singur algoritm de recomandare.
- Câmpurile încă necompletate din `site.ts` (preț, zile, mărimea grupei, manual, tabere) sunt tipate ca obligatorii. Build-ul de producție eșuează dacă vreunul conține încă un marcaj `TODO`.

## 6. Date și GDPR

Tabelul `leads`:

| Coloană | Tip | Note |
|---|---|---|
| `id` | BIGINT PK | |
| `parent_name` | VARCHAR(100) | |
| `phone` | VARCHAR(20) | normalizat E.164 (`+407…`) |
| `child_age_group` | VARCHAR(20) NULL | din lista de vârste |
| `source` | ENUM('home','landing','test') | |
| `test_level` | VARCHAR(30) NULL | doar pentru `source='test'` |
| `utm_source`, `utm_medium`, `utm_campaign` | VARCHAR(100) NULL | |
| `consent_at` | DATETIME | ora serverului, la salvare |
| `policy_version` | VARCHAR(20) | versiunea politicii acceptate |
| `created_at` | DATETIME | |

Tabelul `rate_limits`: `ip_hash` (SHA-256 cu salt din configurare), `window_start`, `count`. Rândurile mai vechi de 24 de ore se șterg de același job.

Nu se stochează:
- numele copilului (diploma se generează doar în browser);
- răspunsurile la test;
- IP-ul în clar;
- user-agent-ul.

Reguli:

- **Păstrare:** contactele mai vechi de 12 luni se șterg de `purge-expired-leads`, rulat zilnic prin cron.
- **Drepturile persoanei** (acces, ștergere, export): procedură documentată în `docs/operare/date-personale.md`, executată din phpMyAdmin.
- **Securitate:**
  - credențialele doar în variabile de mediu ale aplicației Node, niciodată în repo;
  - interogări parametrizate;
  - doar HTTPS;
  - `honeypot` + timp minim de completare de 3 secunde;
  - 5 trimiteri pe oră pentru același IP.
- **Cookies:**
  - categoria „necesare” păstrează doar preferința de consimțământ;
  - „statistici” = GA4; „marketing” = Meta Pixel + Google Ads;
  - implicit, Consent Mode are toate semnalele `denied`;
  - butoanele „Accept” și „Refuz” sunt la fel de vizibile;
  - preferința se poate schimba din link-ul din footer.
- **Documente** (șabloane de verificat de un jurist înainte de lansare):
  - politica de confidențialitate;
  - politica de cookies;
  - termeni;
  - textul bifei de acord;
  - registrul de prelucrare (`docs/operare/registru-prelucrare.md`).

## 7. Contract HTTP

`POST /api/lead`, cu `Content-Type: application/json`:

```json
{ "parentName": "Ana Pop", "phone": "0722 123 456", "childAgeGroup": "7–8 ani",
  "source": "home", "testLevel": null, "consent": true, "policyVersion": "1",
  "utm": { "source": "instagram", "medium": "paid", "campaign": "demo-toamna" },
  "website": "", "elapsedMs": 8400 }
```

| Status | Când | Corp |
|---|---|---|
| 201 | salvat | `{ "ok": true }` |
| 400 | validare eșuată / lipsă acord | `{ "ok": false, "error": "validation", "fields": ["phone"] }` |
| 429 | limita depășită | `{ "ok": false, "error": "rate_limited" }` |
| 500 | eroare internă | `{ "ok": false, "error": "internal" }` (detaliile doar în log) |

Comportament special:
- Un `honeypot` completat sau un `elapsedMs` sub 3000 primește `201` fără salvare, ca robotul să nu primească semnal.
- Dacă emailul eșuează după salvare, răspunsul rămâne `201` și serverul scrie un `warn` în log.

## 8. Erori în interfață

- `<lead-form>` are stările `idle | submitting | sent | failed`. Erorile de câmp au mesaje în română, cu `aria-describedby` pe câmp.
- `lead.client.ts` întoarce un rezultat tipat: `ok | validation(fields) | rate_limited | network | server`. UI-ul traduce fiecare caz într-un mesaj; textul brut de la server nu se afișează.
- `<level-test>`: dacă `speechSynthesis` lipsește, întrebările audio afișează textul și un mesaj. Diploma așteaptă `document.fonts.ready`. Numele copilului se escapează la generarea paginii PDF.

## 9. Testare

| Strat | Tool | Ce acoperă |
|---|---|---|
| `features/*/model`, `shared/contracts` | Vitest | Scor, recomandare (fiecare prag ± limită), schema (telefon RO valid/invalid, câmpuri lipsă), mesaj WhatsApp |
| Web Components | Vitest + happy-dom | Stări, evenimente emise, accesibilitate (`aria-*`) |
| `server/` | Vitest (mediu Node) cu fake-uri pentru repository, mailer și clock | 201, 400, 429, honeypot, email eșuat → 201 + warn, eroare DB → 500 generic |
| `lead.repository.ts`, migrații | Vitest pe MySQL în container (CI) | Inserare, purge după 12 luni, rate limit |
| Fluxuri | Playwright (mobil + desktop) | Test → diplomă → formular; formular erori/succes/server căzut; banner: Refuz nu încarcă taguri, Accept le încarcă |
| Calitate | Lighthouse CI | Cel puțin 90 pe toate cele 4 categorii |
| Granițe | dependency-cruiser | Fiecare regulă verificată o dată pe o încălcare plantată |

## 10. Publicare și operare

- **CI**, la fiecare push: lint, typecheck, teste, dependency-cruiser, build.
- **Publicare automată** pe `main`, după CI verde:
  - `dist/` se urcă prin SFTP în `public_html/`;
  - bundle-ul `server/` merge în folderul aplicației Node;
  - repornirea se face prin `tmp/restart.txt` (Passenger).
- **Staging:** subdomeniu protejat cu parolă, publicat din ramura `staging`.
- **Cron zilnic:** `node server/jobs/purge-expired-leads.js`.
- **Documentație de predare**, în română, în `docs/operare/`:
  - cum se modifică `site.ts` și cum se adaugă un articol;
  - date personale (export/ștergere);
  - publicare;
  - inventar de conturi (fără parole în repo).

## 11. În afara scopului

- Plăți online (în pauză; etapă viitoare, cu termeni de vânzare și ANPC/SOL)
- Panou de administrare sau CMS
- Newsletter
- Versiune în engleză
- Scrierea articolelor și a textelor de marketing
- Fotografii noi
- Gestionarea campaniilor
- Profilul Google Business
- Consultanță juridică
- Mentenanța după lansare

## 12. Dependențe de la client

| Ce | Necesar înainte de |
|---|---|
| Hosting european cPanel cu Node.js + acces | etapa formularului |
| Domeniu + adresa de email pentru notificări | etapa formularului |
| Prețuri, zile, mărimea grupelor, manuale | lansare |
| Perioada, programul și prețul taberelor | lansare |
| Date firmă (denumire, CUI, sediu) | lansare |
| ID Meta Pixel, ID GA4, ID conversie Google Ads | lansare |
| Verificarea juridică a textelor | lansare |
| 1–2 articole de blog | lansare (opțional) |

## 13. Riscuri de verificat la pasul 0 al implementării

Aceste mecanisme nu sunt încă validate printr-un prototip:

1. Rutarea `/api/lead` către aplicația Node pe același domeniu cu site-ul static, pe cPanel/Passenger (alternativa: subdomeniu `api.` cu CORS restrâns).
2. Aliasurile (`@features`, `@shared`, `@core`) rezolvate identic în Astro, Vitest și bundle-ul `server/`.
3. Web Components în light DOM peste HTML randat de Astro: îmbunătățire progresivă, deci formularul afișează mesaj util și fără JS.
4. Consent Mode v2 cu vanilla-cookieconsent: semnalele `default denied` se trimit înaintea oricărui tag.

## 14. Ordinea de implementare

0. Prototip pentru riscurile din §13; mutarea designurilor în `design/`
1. Fundație: Astro, tokens, BaseLayout, Header, Footer, Logo, CI, dependency-cruiser
2. Pagini statice: Acasă, Grupe, Metoda, Tabere, Blog, 404
3. Testul de nivel + diploma
4. Formular: schema, client, server, MySQL, email, rate limit
5. Consimțământ + taguri + evenimentul Lead
6. SEO, politici, sitemap, JSON-LD
7. E2E, Lighthouse, verificare pe staging
8. Lansare + documentația de predare

Convențiile de cod și structură sunt înregistrate în `.claude/skills/project-conventions/SKILL.md`.
