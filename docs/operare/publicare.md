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
4. Doar în environment-ul `staging`, adaugă și variabila `DEPLOY_HTPASSWD_FILE`: calea fișierului de parole creat de cPanel (vezi §3, pasul 6). Nu o pune niciodată în `production` sau la nivel de repository, altfel și producția primește parolă.
5. Opțional: la environment-ul `production`, bifează **Required reviewers**, ca fiecare publicare pe producție să ceară o aprobare.
6. Ultimul pas: Settings → Secrets and variables → Actions → **Variables** → New repository variable: `DEPLOY_ENABLED` = `true`.

Căile trebuie să înceapă cu `/`, fără `/` la sfârșit, să aibă cel puțin 3 segmente și să conțină doar litere, cifre, `.`, `_`, `-`. Altfel publicarea se oprește cu eroare, ca să nu șteargă fișiere din greșeală.

## 3. Configurarea inițială pe cPanel

1. **Cheia SSH.** Creează o pereche de chei (local: `ssh-keygen -t ed25519`). În cPanel → SSH Access → **Import Key**, importă cheia publică, apoi apasă **Manage** → **Authorize**. Cheia privată merge în secretul `DEPLOY_SSH_KEY`.
2. **`known_hosts`.** Rulează `ssh-keyscan -p <port> <host>` și pune rezultatul în secretul `DEPLOY_KNOWN_HOSTS`.
3. **Aplicația Node.** cPanel → Setup Node.js App → Create Application:
   - versiunea Node: `22.22.3` sau mai nouă (conform `engines` din `package.json`);
   - Application root: aceeași valoare ca `DEPLOY_APP_ROOT`;
   - Application URL: `/api`;
   - Application startup file: `app.cjs`;
   - variabilele de mediu din `server.md` §1.
4. **Baza de date.** Creează baza de date MySQL și importă migrațiile, conform `server.md` §2.
5. **Cron.** Adaugă jobul zilnic de curățare, conform `server.md` §4.
6. **Subdomeniul de staging.** cPanel → Domains: creează subdomeniul, cu folderul lui (acesta este `DEPLOY_WEB_ROOT` pentru staging). Apoi cPanel → **Directory Privacy**: protejează folderul cu parolă, creează utilizatorul și parola. Pune în variabila `DEPLOY_HTPASSWD_FILE` calea fișierului de parole generat (de exemplu `/home/utilizator/.htpasswds/staging/passwd`). Publicarea adaugă singură blocul de autentificare în `.htaccess` la fiecare rulare.
7. **SSL.** cPanel → SSL/TLS Status: rulează **AutoSSL** (Let's Encrypt) pentru domeniu și pentru subdomeniul de staging.

## 4. Ce nu atinge publicarea pe server

La fiecare rulare se șterge din folderul site-ului tot ce nu există în build, cu excepția acestor foldere, care rămân neatinse: `api/`, `.well-known/`, `cgi-bin/`. Nu pune fișiere proprii în folderul site-ului în afara lor.

## 5. Întoarcerea la versiunea anterioară

1. Pe GitHub, anulează modificarea: butonul **Revert** din pull request-ul îmbinat, sau `git revert <commit>`.
2. Fă push (sau îmbină pull request-ul de revert) în același branch.
3. Publicarea pornește singură și pune pe site versiunea anterioară.

Nu șterge și nu înlocui nimic manual pe server.

## 6. Publicare manuală (rezervă)

Dacă GitHub Actions nu funcționează: construiește local (`npm run build` și `npm run build:server`), setează în terminal variabilele `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_WEB_ROOT`, `DEPLOY_APP_ROOT` (și opțional `DEPLOY_PORT`, `DEPLOY_KEY_FILE`, `DEPLOY_KNOWN_HOSTS_FILE`, `DEPLOY_HTPASSWD_FILE`), apoi rulează `bash scripts/deploy.sh`. Cu `--dry-run` doar arată ce ar face, fără să urce nimic. Pașii complet manuali sunt în `server.md` §3.

## 7. Unde se văd erorile

- Publicare: GitHub → **Actions** → workflow-ul **Deploy** → ultima rulare.
- Aplicația Node (formularul): cPanel → Setup Node.js App → logurile aplicației.
