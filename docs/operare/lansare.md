# Lista de lansare

Bifează în ordine. Fiecare punct spune unde se face.

## 1. Datele de la client

- [ ] **Hosting cPanel cu acces:** cu Node ≥ 22.22.3, SSH și MySQL. Datele de acces se trec în managerul de parole, nu în repo.
- [ ] **Domeniul și `MAIL_TO`:** domeniul la registrar; adresa de email care primește contactele se setează în variabilele aplicației Node (`server.md` §1).
- [ ] **Prețuri, zile, mărimea grupelor, manual:** `src/shared/content/site.ts` → `courseFacts`.
- [ ] **Tabere (an, vârste, perioadă, program, preț, ora fiecărei activități, ce include):** `src/shared/content/site.ts` → `camps`.
- [ ] **Datele firmei (denumire, CUI, sediu social):** `src/shared/content/site.ts` → `company`.
- [ ] **ID-urile de măsurare (GA4, Meta Pixel, Google Ads și eticheta conversiei Lead):** `src/shared/content/site.ts` → `tracking`.
- [ ] **Verificarea juridică** a celor 3 pagini (`src/content/legal/`), a bannerului de cookie-uri și a textului bifei de acord din formular.
- [ ] **Articole de blog (opțional):** `src/content/blog/`, toate sunt acum `draft: true`; fiecare are nevoie de copertă de cel puțin 1200 px lățime (`continut.md` §2).

## 2. Build de producție local

- [ ] `SITE_ENV=production npm run build` trece, adică nu mai există niciun `TODO`.

## 3. Configurarea inițială

- [ ] Pașii din `publicare.md` §2 (GitHub) și §3 (cPanel).

## 4. Staging

- [ ] Prima publicare pe staging, supravegheată: push pe branch-ul `staging`, urmărește în GitHub → Actions → Deploy.
- [ ] Parcurge complet `staging.md`.

## 5. Domeniul

- [ ] DNS-ul domeniului arată spre hosting.
- [ ] SSL activ (AutoSSL).
- [ ] `http://` redirecționează spre `https://`.

## 6. Producție

- [ ] Variabila de repository `DEPLOY_ENABLED=true` (`publicare.md` §2, pasul 6).
- [ ] Merge din `staging` în `main`.
- [ ] Verifică în Actions că Deploy a trecut și că `https://englishminds.ro` arată noua versiune.

## 7. După lansare

- [ ] **Search Console:** adaugă proprietatea și trimite `https://englishminds.ro/sitemap.xml`.
- [ ] **GA4:** `generate_lead` marcat ca eveniment cheie.
- [ ] **Google Ads:** conversia „Lead”, cu eticheta din `site.ts`.
- [ ] **Meta:** evenimentul `Lead` vizibil în Events Manager.
- [ ] Setările din `taguri.md` (Advanced Matching etc.) verificate.
- [ ] Un formular de test trimis, apoi șters din baza de date (`date-personale.md`).
- [ ] Lighthouse rulat pe producție.
- [ ] **CSP Report-Only după lansare:** adaugă antetul `Content-Security-Policy-Report-Only` (în `public/.htaccess`), urmărește rapoartele o perioadă, apoi trece la `Content-Security-Policy` obligatoriu. Nu se pune direct în mod obligatoriu: tagurile Google și Meta și scripturile inline Astro cer o politică calibrată.

## 8. Predarea

- [ ] `conturi.md` completat.
- [ ] Clientul are acces la GitHub.
- [ ] Documentația parcursă împreună cu clientul.
