# Lista de lansare

Bifează în ordine. Fiecare punct spune unde se face.

## 1. Datele de la client

- [ ] **Hosting cPanel cu acces:** cu Node 22.22.3 sau mai nou din seria 22.x, sau 24.16+, SSH și MySQL. Datele de acces se trec în managerul de parole, nu în repo.
- [ ] **Domeniul și `MAIL_TO`:** domeniul la registrar; adresa de email care primește contactele se setează în variabilele aplicației Node (`server.md` §1).
- [ ] **Prețuri, zile, mărimea grupelor, manual:** `src/shared/content/site.ts` → `courseFacts`. Când `monthlyPrice` devine număr, `courseJsonLd` (`src/shared/seo/json-ld.ts`) primește și `offers`; până atunci datele structurate nu conțin prețuri.
- [ ] **Tabere (an, vârste, perioadă, program, preț, ora fiecărei activități, ce include):** `src/shared/content/site.ts` → `camps`.
- [ ] **Datele firmei (denumire cu forma juridică, de ex. „X SRL”, CUI, număr de înmatriculare la Registrul Comerțului J…, sediu social):** `src/shared/content/site.ts` → `company`. Apar în subsolul fiecărei pagini și în blocul „Operator” al paginilor legale (Legea 365/2002 art. 5, Legea 31/1990 art. 74).
- [ ] **Emailul de contact public:** `src/shared/content/site.ts` → `contact.email`. Apare în subsol și în blocul „Operator”; pe el primesc părinții cererile legate de date (GDPR).
- [ ] **Mențiunea TVA de lângă prețuri („TVA inclus” sau „scutit de TVA”):** `src/shared/content/site.ts` → `pricing.vatNote`.
- [ ] **Condițiile ofertelor (valabilitate, cursurile la care se aplică, valoarea reducerii, cum se numără primii 20 de înscriși):** `src/shared/content/site.ts` → `offer.terms`. Apar pe pagina Termeni, la „Oferte și reduceri” (Legea 363/2007).
- [ ] **Pictograma oficială ANPC – SAL:** se descarcă de pe anpc.ro (Ordinul ANPC 449/2022, modificat prin Ordinul 270/2026) și se salvează ca `src/assets/legal/anpc-sal.png` (sau `.svg`, `.webp`). Subsolul o folosește automat, la 250×50 px. Până atunci apare un buton text de aceeași mărime. Nu desena pictograma singur.
- [ ] **ID-urile de măsurare (GA4, Meta Pixel, Google Ads și eticheta conversiei Lead):** `src/shared/content/site.ts` → `tracking`.
- [ ] **Verificarea juridică** a celor 3 pagini (`src/content/legal/`), a bannerului de cookie-uri și a textului bifei de acord din formular. Jurist: baza legală a transferului către Telegram (art. 6 alin. (1) lit. b GDPR, prelucrare în afara UE) din secțiunea „Transferuri în afara UE” a politicii de confidențialitate.
- [ ] **Articole de blog (opțional):** `src/content/blog/`, vezi `continut.md` §2 (draft și coperți).

## 1b. Obligații legale în afara site-ului

Acestea nu se rezolvă în cod. Fără ele site-ul poate fi corect, dar activitatea nu. Pictograma ANPC și verificarea juridică sunt la §1.

- [ ] **Contracte de prelucrare (DPA, GDPR art. 28)** cu furnizorul de găzduire și cu furnizorul de email.
- [ ] **Acord scris al părinților** pentru fiecare fotografie în care copilul poate fi recunoscut (site și Instagram), plus acordul profesorilor pentru pozele în care apar.
- [ ] **CAEN 8559** autorizat la sediul unde se predă, plus avizele DSP/ISU cerute de primărie.
- [ ] **Tabere:** autorizație sanitară DSP și, dacă includ cazare sau transport, licență de turism.
- [ ] **Contract de înscriere** cu prețuri, condiții de anulare și rambursare.

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

- [ ] **Search Console:** adaugă proprietatea și trimite `https://englishminds.ro/sitemap.xml`. Pașii compleți (Business Profile, Bing, cele 8 pagini principale) sunt în [`seo.md`](seo.md).
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
