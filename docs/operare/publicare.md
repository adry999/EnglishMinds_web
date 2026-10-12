# Publicarea site-ului

## 1. Cum funcționează

Orice modificare ajunge pe site astfel:

1. Se face push pe GitHub, pe branch-ul `main` sau `staging`.
2. Pornește workflow-ul **CI** (joburile `verify` și `browser`: teste, build, Lighthouse).
3. Dacă CI-ul a trecut, pornește workflow-ul **Deploy**, care construiește site-ul și serverul, le urcă prin SFTP (`lftp`) și repornește aplicația Node.

| Branch | Unde se publică | `SITE_ENV` |
|---|---|---|
| `main` | Producție | `production` |
| `staging` | Subdomeniul de staging (cu `noindex`, ascuns de Google) | `staging` |

Publicarea rămâne oprită cât timp variabila de repository `DEPLOY_ENABLED` nu este `true`.

## 2. Configurarea inițială pe GitHub

Se face o singură dată, în repository, la **Settings**.

1. Settings → Environments → **New environment**: creează `production` și `staging`.
2. În fiecare environment, la **Environment secrets**, adaugă:
   - `DEPLOY_HOST`: adresa serverului (hostul SFTP);
   - `DEPLOY_USER`: utilizatorul cPanel;
   - `DEPLOY_SSH_KEY`: cheia privată SSH (tot conținutul fișierului);
   - `DEPLOY_KNOWN_HOSTS`: rezultatul comenzii `ssh-keyscan -p <port> <host>`.
3. În fiecare environment, la **Environment variables**, adaugă:
   - `DEPLOY_WEB_ROOT`: folderul site-ului pe server (de exemplu `/home/utilizator/public_html` pentru producție, folderul subdomeniului pentru staging);
   - `DEPLOY_APP_ROOT`: folderul aplicației Node, în afara lui `DEPLOY_WEB_ROOT`;
   - `DEPLOY_PORT`: portul SSH (opțional, implicit 22).

   `DEPLOY_WEB_ROOT` și `DEPLOY_APP_ROOT` trebuie să fie **diferite** în `staging` față de `production`. Dacă staging primește folderele producției, un push pe `staging` ar urca fișiere nerevizuite direct în producție, ocolind aprobarea.
4. Doar în environment-ul `staging`, adaugă și variabila `DEPLOY_HTPASSWD_FILE`: calea fișierului de parole creat de cPanel (vezi §3, pasul 6). Nu o pune niciodată în `production` sau la nivel de repository, altfel și producția primește parolă.
5. La environment-ul `production`, bifează **Required reviewers** și adaugă proprietarul site-ului, ca fiecare publicare pe producție să ceară o aprobare (obligatoriu înainte de pasul 6).
6. Doar după pasul 5 (cu **Required reviewers** setat pe `production`) și după ce secretele și variabilele sunt complete: Settings → Secrets and variables → Actions → **Variables** → New repository variable: `DEPLOY_ENABLED` = `true`. Din acest moment orice push pe `staging` se publică pe staging, iar orice push pe `main` așteaptă aprobarea ta înainte să ajungă pe producție.

Ambele environment-uri folosesc aceeași cheie SSH (același utilizator cPanel), deci oricine poate face push pe `staging` are, practic, acces și la producție. **Required reviewers** previne accidentele, nu acest lucru; riscul este acceptat pentru această echipă.

Căile trebuie să înceapă cu `/`, fără `/` la sfârșit, să aibă cel puțin 3 segmente și să conțină doar litere, cifre, `.`, `_`, `-`. Altfel publicarea se oprește cu eroare, ca să nu șteargă fișiere din greșeală.

## 3. Configurarea inițială pe cPanel

1. **Cheia SSH.** Creează o pereche de chei (local: `ssh-keygen -t ed25519`). În cPanel → SSH Access → **Import Key**, importă cheia publică, apoi apasă **Manage** → **Authorize**. Cheia privată merge în secretul `DEPLOY_SSH_KEY`.
2. **`known_hosts`.** Rulează `ssh-keyscan -p <port> <host>` și pune rezultatul în secretul `DEPLOY_KNOWN_HOSTS`.
3. **Aplicațiile Node.** Sunt două, una pentru producție și una pentru staging. cPanel → Setup Node.js App → Create Application, de două ori:
   - versiunea Node: 22.22.3 sau mai nouă din seria 22.x, sau 24.16+ (conform `engines` din `package.json`);
   - Application root: aceeași valoare ca `DEPLOY_APP_ROOT` al environment-ului respectiv (de exemplu `/home/utilizator/em-api` pentru producție și `/home/utilizator/em-api-staging` pentru staging; niciodată aceeași pentru ambele);
   - Application URL: pe domeniul principal, `/api` pentru producție; pe subdomeniul de staging, `/api` (adică `<staging>/api`);
   - Application startup file: `app.cjs`;
   - variabilele de mediu din `server.md` §1, separate pentru fiecare aplicație (inclusiv `DB_*` către baza ei de date).
4. **Bazele de date.** Creează două baze de date MySQL, una pentru producție și una pentru staging (fiecare cu utilizatorul ei), și importă migrațiile în amândouă, conform `server.md` §2. Variabilele de mediu ale fiecărei aplicații Node trimit către baza ei.
5. **Cron.** Adaugă jobul zilnic de curățare, conform `server.md` §4.
6. **Subdomeniul de staging.** cPanel → Domains: creează subdomeniul, cu folderul lui (acesta este `DEPLOY_WEB_ROOT` pentru staging). Folderul trebuie să fie **în afara** lui `public_html`, de exemplu `/home/utilizator/staging.englishminds.ro`: cPanel propune implicit `public_html/<subdomeniu>`, iar publicarea pe producție șterge din `public_html` tot ce nu e în build, deci ar șterge și staging-ul. Apoi cPanel → **Directory Privacy**: protejează folderul cu parolă, creează utilizatorul și parola. Pune în variabila `DEPLOY_HTPASSWD_FILE` calea fișierului de parole generat (de exemplu `/home/utilizator/.htpasswds/staging/passwd`). Publicarea adaugă singură blocul de autentificare în `.htaccess` la fiecare rulare.
7. **SSL.** cPanel → SSL/TLS Status: rulează **AutoSSL** (Let's Encrypt) pentru domeniu și pentru subdomeniul de staging.

## 4. Ce nu atinge publicarea pe server

La fiecare rulare se șterge din folderul site-ului tot ce nu există în build, cu excepția acestor căi, care rămân neatinse: `api/`, `.well-known/`, `cgi-bin/`, `.user.ini`, `error_log` și `.htpasswds/`. Nu pune fișiere proprii în folderul site-ului în afara lor.

## 5. Întoarcerea la versiunea anterioară

1. Pe GitHub, anulează modificarea: butonul **Revert** din pull request-ul îmbinat, sau `git revert <commit>`.
2. Fă push (sau îmbină pull request-ul de revert) în același branch.
3. Publicarea pornește singură și pune pe site versiunea anterioară.

Nu șterge și nu înlocui nimic manual pe server.

## 6. Publicare manuală (rezervă)

Dacă GitHub Actions nu funcționează: construiește local (`npm run build` și `npm run build:server`), setează în terminal variabilele `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_WEB_ROOT`, `DEPLOY_APP_ROOT`, `DEPLOY_KEY_FILE` (calea cheii private) și `DEPLOY_KNOWN_HOSTS_FILE` (calea fișierului `known_hosts`), plus opțional `DEPLOY_PORT` și `DEPLOY_HTPASSWD_FILE`, apoi rulează `bash scripts/deploy.sh`. `DEPLOY_KEY_FILE` și `DEPLOY_KNOWN_HOSTS_FILE` sunt obligatorii la o publicare reală; doar `--dry-run` le sare și doar arată ce ar face, fără să urce nimic. Pe calculator trebuie instalat `lftp`. Reconstruiește între ținte: după o publicare pe staging, rulează din nou `npm run build` înainte de producție (scriptul restaurează `dist/.htaccess`, dar `SITE_ENV` rămâne cel din build). Pentru staging construiește cu `SITE_ENV=staging`, pentru producție cu `SITE_ENV=production` (de exemplu `SITE_ENV=staging npm run build`). Pașii complet manuali sunt în `server.md` §3.

## 7. Unde se văd erorile

- Publicare: GitHub → **Actions** → workflow-ul **Deploy** → ultima rulare.
- Aplicația Node (formularul): cPanel → Setup Node.js App → logurile aplicației.

## 8. Preview pe GitHub Pages

Clientul poate vedea o versiune de probă a site-ului la **https://adry999.github.io/EnglishMinds_web/**. Nu înlocuiește publicarea de la §1 și nu atinge serverul real.

- Se reconstruiește singură după fiecare rulare **CI** reușită pe `main` (workflow-ul **Pages**). Se poate porni și manual: GitHub → Actions → **Pages** → Run workflow.
- Are `noindex` și `robots.txt` care interzice tot, deci Google nu o indexează. Canonical-urile și sitemap-ul arată spre adresa de preview.
- Formularul de contact este dezactivat: la trimitere apare mesajul „Aceasta este o versiune demo a site-ului. Trimiterea formularului este dezactivată.”, fără apel către server.
- Se construiește cu `SITE_ENV=preview`, `SITE_BASE=/EnglishMinds_web` și `SITE_URL=https://adry999.github.io`. Cât timp aceste variabile lipsesc (producție, staging, dezvoltare locală), site-ul rămâne exact ca până acum.
- Configurare unică: Settings → Pages → **Source** = **GitHub Actions**. Fără ea, workflow-ul eșuează la pasul de publicare.
- Dacă repository-ul sau contul GitHub își schimbă numele, actualizează `SITE_BASE` și `SITE_URL` în `.github/workflows/pages.yml`.
