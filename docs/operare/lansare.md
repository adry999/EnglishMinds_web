# Lista de lansare

Bifează în ordine. Fiecare punct spune unde se face.

## 1. Datele de la client

- [ ] **Hosting cPanel cu acces:** cu Node 22.22.3 sau mai nou din seria 22.x, sau 24.16+, SSH și MySQL. Datele de acces se trec în managerul de parole, nu în repo.
- [ ] **Domeniul și `MAIL_TO`:** domeniul la registrar; adresa de email care primește contactele se setează în variabilele aplicației Node (`server.md` §1).
- [ ] **Prețuri, zile, mărimea grupelor, manual:** `src/shared/content/site.ts` → `courseFacts`.
- [ ] **Tabere (an, vârste, perioadă, program, preț, ora fiecărei activități, ce include):** `src/shared/content/site.ts` → `camps`.
- [ ] **Datele firmei (denumire, CUI, sediu social):** `src/shared/content/site.ts` → `company`.
- [ ] **ID-urile de măsurare (GA4, Meta Pixel, Google Ads și eticheta conversiei Lead):** `src/shared/content/site.ts` → `tracking`.
- [ ] **Verificarea juridică** a celor 3 pagini (`src/content/legal/`), a bannerului de cookie-uri și a textului bifei de acord din formular.
- [ ] **Articole de blog (opțional):** `src/content/blog/`, toate sunt acum `draft: true`; fiecare are nevoie de copertă de cel puțin 1200 px lățime (`continut.md` §2).

## 2. Build de producție local

- [ ] `SITE_ENV=production npm run build` trece, adică nu mai există niciun `TODO`. În PowerShell (Windows): `$env:SITE_ENV='production'; npm run build`.

## 3. Configurarea inițială

- [ ] Pașii din `publicare.md` §2 (GitHub) și §3 (cPanel).
- [ ] Staging are propria aplicație Node (Application URL `/api` pe subdomeniul de staging, alt Application root), propria bază de date MySQL și propriile variabile de mediu.
- [ ] `DEPLOY_WEB_ROOT` și `DEPLOY_APP_ROOT` sunt diferite în `staging` față de `production`.
- [ ] Folderul subdomeniului de staging este în afara lui `public_html` (de exemplu `/home/utilizator/staging.englishminds.ro`).

## 4. Activarea publicării

- [ ] La GitHub → Settings → Environments → `production`: **Required reviewers** setat pe proprietar. Fără asta nu activa publicarea, pentru că un push pe `main` ar publica direct pe producție.
- [ ] Apoi variabila de repository `DEPLOY_ENABLED=true` (`publicare.md` §2, pasul 6). De acum, publicarea pe producție așteaptă aprobarea ta.

## 5. Staging

- [ ] Prima publicare pe staging, supravegheată: push pe branch-ul `staging`, urmărește în GitHub → Actions → Deploy.
- [ ] Parcurge complet `staging.md`.

## 6. Domeniul

- [ ] DNS-ul domeniului arată spre hosting.
- [ ] SSL activ (AutoSSL).
- [ ] `http://` redirecționează spre `https://`.

## 7. Producție

- [ ] Merge din `staging` în `main`.
- [ ] În GitHub → Actions → Deploy: aprobă publicarea în așteptare pe `production` (Review deployments → Approve and deploy), sau repornește rularea (Re-run) după aprobare.
- [ ] Verifică în Actions că Deploy a trecut și că `https://englishminds.ro` arată noua versiune.

## 8. După lansare

- [ ] **Search Console:** adaugă proprietatea și trimite `https://englishminds.ro/sitemap.xml`.
- [ ] **GA4:** `generate_lead` marcat ca eveniment cheie.
- [ ] **Google Ads:** conversia „Lead”, cu eticheta din `site.ts`.
- [ ] **Meta:** evenimentul `Lead` vizibil în Events Manager.
- [ ] Setările din `taguri.md` (Advanced Matching etc.) verificate.
- [ ] Un formular de test trimis, apoi șters din baza de date (`date-personale.md`).
- [ ] Lighthouse rulat pe producție.
- [ ] **CSP Report-Only după lansare:** adaugă antetul `Content-Security-Policy-Report-Only` (în `public/.htaccess`), urmărește rapoartele o perioadă, apoi trece la `Content-Security-Policy` obligatoriu. Nu se pune direct în mod obligatoriu: tagurile Google și Meta și scripturile inline Astro cer o politică calibrată.

## 9. Predarea

- [ ] `conturi.md` completat.
- [ ] Clientul are acces la GitHub.
- [ ] Documentația parcursă împreună cu clientul.
