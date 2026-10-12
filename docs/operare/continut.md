# Cum se schimbă conținutul

## 1. Textele și datele site-ului

Aproape toate datele sunt într-un singur fișier: `src/shared/content/site.ts`. Câmpurile principale:

| Câmp | Ce conține |
|---|---|
| `contact` | Telefon, WhatsApp, Instagram, adresă. |
| `levels` | Nivelurile (Starters, Pre A1 etc.), descrierile și rezultatele. |
| `courseFacts` | Durata, zilele, mărimea grupei, manualul, prețul lunar. |
| `offer` | Oferta curentă (eticheta, titlul, detaliul). |
| `camps` | Tabăra: an, vârste, perioadă, program, preț, ziua tip, ce include. |
| `company` | Denumirea firmei, CUI, sediul social (apar în paginile legale). |
| `tracking` | ID-urile GA4, Meta Pixel și Google Ads (vezi `taguri.md`). |
| `url` | Adresa site-ului, folosită în sitemap și linkuri canonice. |

**Regula `TODO`:** valorile care încă lipsesc sunt scrise `TODO: …`. Build-ul de producție refuză să pornească cât timp există un `TODO`. Pe staging sunt permise, ca să se poată vedea site-ul înainte de a avea toate datele.

## 2. Articole de blog

1. Creează fișierul `src/content/blog/<slug>.md`. Numele fișierului devine adresa articolului și nu începe cu `_`.
2. Începe fișierul cu acest antet (toate câmpurile, în afară de `draft`, sunt obligatorii):

   ```
   ---
   title: Titlul articolului
   description: O frază pentru Google și pentru lista de articole.
   category: acasa
   cover: ../../assets/photos/numele-pozei.jpg
   coverAlt: Descrierea pozei pentru cititorii care nu o văd
   publishedAt: 2026-10-12
   draft: true
   ---
   ```

3. `category` poate fi doar una dintre: `acasa`, `metoda-cambridge`, `motivatie`, `scoala` (lista este `BLOG_CATEGORY_IDS`, în `src/features/blog/model/categories.ts`).
4. Coperta are cel puțin 1200 px lățime și se pune în `src/assets/photos/`.
5. Cât timp scrie `draft: true`, articolul nu apare pe site. La publicare, schimbă în `draft: false`.

Cele 4 articole existente sunt toate `draft: true`, deci nu apar încă. Fiecare are nevoie de o copertă de cel puțin 1200 px lățime înainte de a fi trecut pe `draft: false`.

## 3. Textele legale

Cele 3 pagini sunt în `src/content/legal/`: `confidentialitate.md`, `termeni.md`, `cookies.md`.

- **`POLICY_VERSION`** (`src/shared/contracts/policy.ts`): se crește când se schimbă politica de confidențialitate sau textul bifei de acord. Versiunea se salvează împreună cu fiecare contact.
- **`COOKIE_REVISION`** (`src/features/consent/ui/consent-config.ts`): se crește când se schimbă politica de cookies. Bannerul reapare pentru toți vizitatorii.
- **Inventarul de cookie-uri:** `src/features/consent/model/cookie-inventory.ts`. Se actualizează când se adaugă sau se scoate un serviciu.

Modificările juridice se fac numai după verificarea unui jurist.

## 4. Fotografiile

Fișierele sunt în `src/assets/photos/`, iar legătura cu paginile este în `src/shared/content/photos.ts`. Pentru o poză nouă, pune fișierul în folder și adaugă-l în `photos.ts`.

## 5. După o modificare

1. Fă commit pe branch-ul `staging` (publicarea pe staging pornește singură, vezi `publicare.md`).
2. Verifică modificarea pe subdomeniul de staging.
3. Fă merge din `staging` în `main`. Publicarea pe producție pornește singură.

Dacă nu folosești git local, poți edita fișierul direct pe GitHub, în browser: deschide fișierul, apasă creionul (Edit), fă modificarea și salvează cu „Commit changes” pe branch-ul `staging`.
