# English Minds Academy: site

Site-ul academiei de engleză pentru copii English Minds Academy din Cluj-Napoca: pagini statice Astro, plus un mic server Node pentru formularul de contact (`/api/lead`).

## Cerințe

- Node `^22.22.3 || >=24.16.0` (vezi `engines` din `package.json` și `.nvmrc`).
- `npm ci` pentru instalarea dependențelor.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | Serverul de dezvoltare Astro (trimite `/api` către portul 3000). Articolele `draft` se văd. |
| `npm run build`, `npm run build:server` | Site-ul în `dist/` și serverul cu cele două joburi în `dist-server/`. |
| `npm run dev:server` | Construiește și pornește serverul formularului (are nevoie de `.env`, modelul este `.env.example`). |
| `npm run lint`, `npm run check` | ESLint și verificarea tipurilor (`astro check`). |
| `npm test` | Testele Vitest (unitare, componente, server, granițe). |
| `npm run deps` | Verifică granițele de import (dependency-cruiser). |
| `npm run test:dist` | Testele paginilor din `dist/` (după `npm run build`). |
| `npm run test:staging`, `npm run test:preview` | Build-uri cu `SITE_ENV=staging` și `preview`, apoi verificări pe rezultat. |
| `npm run verify` | Lanțul din CI: lint, tipuri, teste, granițe, build site și server, `test:dist`, `test:staging`, `test:preview`. |
| `npm run test:e2e` | Testele din browser (Playwright), pe un `dist/` construit. În CI rulează separat de `verify`. |
| `npm run lighthouse` | Măsurătorile Lighthouse (prag 90 la toate categoriile), tot pe `dist/`. |

## Preview pentru client

Versiunea de probă a site-ului este la <https://adry999.github.io/EnglishMinds_web/>, cu `noindex`, formularul în mod demo și articolele `draft` vizibile. Se publică singură din `main`, după ce CI trece. Detalii: [`docs/operare/publicare.md`](docs/operare/publicare.md) §8.

## Documentație

- Starea proiectului și ce mai e de făcut până la lansare: [`TODO.md`](TODO.md).
- Operare, publicare și lansare, pentru cine administrează site-ul: [`docs/operare/README.md`](docs/operare/README.md).
- Arhitectura, granițele de import și convențiile de cod: [`docs/arhitectura.md`](docs/arhitectura.md).
