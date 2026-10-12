# English Minds Academy: site

Site-ul academiei de engleză pentru copii English Minds Academy din Cluj-Napoca: pagini statice Astro, plus un mic server Node pentru formularul de contact (`/api/lead`).

## Cerințe

- Node `^22.22.3 || >=24.16.0` (vezi `engines` din `package.json` și `.nvmrc`).
- `npm ci` pentru instalarea dependențelor.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | Serverul de dezvoltare Astro (trimite `/api` către portul 3000). |
| `npm run dev:server` | Construiește și pornește serverul formularului (are nevoie de `.env`, modelul este `.env.example`). |
| `npm run verify` | Toate verificările: lint, tipuri, teste, dependențe, build site și server. |
| `npm run test:e2e` | Testele din browser (Playwright). |
| `npm run lighthouse` | Măsurătorile Lighthouse (prag 90). |

## Documentație

- Operare, publicare și lansare, pentru cine administrează site-ul: [`docs/operare/README.md`](docs/operare/README.md).
- Specificația de design: [`docs/superpowers/specs/2026-10-09-site-englishminds-design.md`](docs/superpowers/specs/2026-10-09-site-englishminds-design.md).
- Convențiile de cod și jurnalul deciziilor: [`.claude/skills/project-conventions/SKILL.md`](.claude/skills/project-conventions/SKILL.md).
