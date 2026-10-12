---
name: project-conventions
description: Convențiile înregistrate ale site-ului English Minds Academy (Astro + Web Components + server Node). Folosește-l la orice cod nou în acest repo, ca să știi unde stă un fișier, cine are voie să importe ce și cum se testează.
---

# Convenții: site English Minds Academy

Design complet: `docs/superpowers/specs/2026-10-09-site-englishminds-design.md`.

## Stack

- Astro, output static; Astro asamblează doar paginile.
- Web Components (custom elements, light DOM, TypeScript) pentru tot ce e interactiv.
- CSS simplu: `src/styles/tokens.css` + un `.css` per componentă. Fără Tailwind, fără CSS-in-JS.
- Server: Node + TypeScript, handler `Request → Response` în `server/handle-request.ts`. Doar `server/entry.node.ts` depinde de runtime.
- Validare: Valibot; schema comună în `src/shared/contracts/lead.schema.ts`.
- DB: MySQL, accesat doar prin `server/leads/lead.repository.ts`.
- Teste: Vitest (unit/integrare, lângă cod), Playwright (`tests/e2e/`), fake-uri în `tests/support/`.

## Unde stă codul

| Ce | Unde |
|---|---|
| Rută / pagină | `src/pages/` (subțire: doar asamblează) |
| Capabilitate (test, formular, consimțământ, FAQ, blog) | `src/features/<feature>/` cu `index.ts`, `model/`, `ui/`, `api/`, `data/` |
| Logică pură | `src/features/<feature>/model/`, fără DOM, Astro sau rețea |
| Conținut editabil (contact, prețuri, niveluri, program) | `src/shared/content/site.ts` (singura sursă) |
| Contracte (schema, evenimente) | `src/shared/contracts/` |
| Componente UI comune | `src/shared/ui/` |
| Secțiune a unei singure pagini | `src/sections/<pagină>/` (`.astro` + `.css`) |
| Infrastructură fără domeniu | `src/core/` |
| Articole, texte legale | `src/content/blog/`, `src/content/legal/` |
| Backend | `server/` |
| Design de referință (nu se editează) | `design/` |

## Granițe (verificate de dependency-cruiser)

- `pages/`, `layouts/` → `features/*` (prin `index.ts`), `shared/`, `core/`, `styles/`.
- `sections/` → `features/*` (prin `index.ts`), `shared/`, `core/`, `styles/`. Doar `pages/` și alte `sections/` importă din `sections/`.
- Un feature nu importă alt feature. Comunică prin `CustomEvent`-uri definite în `shared/contracts/domain-events.ts`.
- `model/` nu importă DOM, Astro sau rețea.
- `server/` importă din `src/` doar `shared/contracts/`. `src/` nu importă din `server/`.
- Fără `../../`; aliasuri `@features/`, `@shared/`, `@core/`, `@sections/`, `@layouts/`, `@assets/`. Un singur `../` e permis doar în interiorul aceluiași feature.
- Fără barrel-uri în subfoldere și fără `export *`.
- dependency-cruiser nu citește fișierele `.astro`; pentru `.astro` granițele sunt verificate de ESLint (`no-restricted-imports`) — orice regulă nouă se adaugă în ambele.

## Erori

- Client: `lead.client.ts` întoarce `ok | validation | rate_limited | network | server`. UI-ul afișează mesaje în română; textul brut de la server nu se afișează.
- Server: 400 validare, 429 limită, 500 mesaj generic + log cu context. Emailul e best-effort: dacă eșuează, se scrie `warn` și răspunsul rămâne 201. `catch {}` gol nu e permis.

## Config

- Doar `server/config/environment.ts` citește `process.env`. Validează la pornire și expune un obiect înghețat.

## Git

- Conventional Commits, la imperativ: `feat(lead-capture): …`, `refactor(level-test): …`. Scope = feature sau strat.
- Un pas logic per commit, cu testele verzi. Mutările de fișiere nu se amestecă cu schimbările de comportament.

## Decision log

| Data | Decizie | Motiv |
|---|---|---|
| 2026-10-09 | Astro static + Web Components | Portabilitate maximă spre orice framework |
| 2026-10-09 | Server Node/TS pe standardul `Request → Response`, nu PHP | Se mută în rutele API ale Next/Nuxt fără rescriere; schemă de validare comună |
| 2026-10-09 | MySQL de la hosting, nu Supabase | Un singur furnizor în UE |
| 2026-10-09 | Fără pagină `/admin` | Contactele vin pe email; GDPR prin phpMyAdmin |
| 2026-10-09 | Plăți online în pauză | Etapă viitoare |
| 2026-10-11 | Strat `src/sections/` pentru secțiunile unei pagini | Pagini subțiri fără a umfla `shared/ui` cu piese folosite o singură dată |
| 2026-10-12 | Consent Mode „basic”: gtag.js și fbevents.js se încarcă doar după acord | Spec: taguri doar cu acord; `default denied` inline, primul în `<head>` |
| 2026-10-12 | Publicare prin GitHub Actions + SFTP (lftp) după CI verde; staging pe branch-ul `staging`, noindex | Spec §10; fără acces manual pe server la fiecare modificare |
