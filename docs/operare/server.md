# Serverul formularului: operare

Serverul primește cererile `POST /api/lead`, salvează contactul în MySQL și anunță academia prin email și, opțional, prin Telegram. Rulează ca aplicație Node pe cPanel (Passenger).

## 1. Variabile de mediu

Modelul este `.env.example`. Pe cPanel se setează în aplicația Node; local, în `.env` (nu se comite).

| Variabilă | Ce înseamnă |
|---|---|
| `PORT` | Portul local (implicit 3000). Pe Passenger îl stabilește Passenger. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexiunea MySQL de la hosting. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Contul de email prin care pleacă notificările. Portul 465 folosește TLS direct; pe 587 serverul cere obligatoriu TLS (`STARTTLS`) și refuză conexiunea fără el. |
| `MAIL_FROM` | Adresa expeditorului. |
| `MAIL_TO` | Adresa care primește contactele noi. |
| `IP_HASH_SALT` | Cel puțin 32 de caractere aleatorii. Se folosește la calculul amprentei IP (SHA-256 cu sare) pentru limitarea trimiterilor. Schimbarea lui resetează limitele. |
| `TRUST_PROXY_HOPS` | Câte proxy-uri se află între vizitator și aplicație și adaugă fiecare adresa în `X-Forwarded-For` (număr întreg, implicit `0`). `0` = se folosește adresa conexiunii directe (local); `1` = ultima adresă din antet; `2` = penultima etc. Vezi „Adresa IP a vizitatorului”. |
| `LEAD_GLOBAL_HOURLY_CAP` | Câte cereri acceptă site-ul pe oră, de la toți vizitatorii la un loc (implicit `60`). Plasă de siguranță când adresa vizitatorului nu poate fi identificată sau este falsificată; peste prag toți primesc `429` până la ora următoare. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Opționale, se setează amândouă sau niciuna. Dacă există, fiecare cerere nouă trimite și un mesaj scurt pe Telegram (nume, telefon, grupa de vârstă, pagina, ora). Vezi „Notificarea pe Telegram”. Tokenul este o parolă: doar în variabilele de mediu, niciodată în repository sau în loguri. |
| `DEBUG_CLIENT_IP` | `true` doar temporar, la verificarea de pe staging; apoi șterge-o. Vezi „Adresa IP a vizitatorului”. |

Serverul nu pornește dacă lipsește o variabilă sau are valoare invalidă.

### Adresa IP a vizitatorului

Limita de trimiteri se calculează pe adresa IP a vizitatorului, iar adresa corectă depinde de lanțul de proxy-uri al hostingului. Regula este una singură: cu `TRUST_PROXY_HOPS=N`, serverul ia a N-a adresă numărând din dreapta în `X-Forwarded-For`. Tot ce e mai în stânga este scris de client și se ignoră. Dacă antetul are mai puține adrese decât N sau lipsește, serverul nu folosește nicio adresă: cererea nu intră în limita pe vizitator (ar însemna adresa proxy-ului, comună tuturor) și se aplică doar limita generală a site-ului. Verifică atunci `TRUST_PROXY_HOPS`.

- `0`: local, fără proxy.
- `1`: un proxy (Apache/Passenger) care adaugă adresa de la care a primit conexiunea. Valoarea probabilă pe cPanel, dar **trebuie verificată pe staging**.
- `2`: două proxy-uri, de exemplu dacă se pune Cloudflare în fața hostingului.

Dacă adresa nu poate fi aflată deloc, nu se mai folosește o găleată comună „necunoscut” (care ar bloca tot site-ul după 5 cereri): se aplică doar plafonul `LEAD_GLOBAL_HOURLY_CAP` și apare un avertisment în log. Plafonul se aplică întotdeauna, indiferent de adresă, și numără în același tabel `rate_limits`, la cheia `global`.

Cum verifici valoarea corectă pe staging (punctul se bifează și în [`staging.md`](staging.md)):

1. Setează temporar `DEBUG_CLIENT_IP=true` și repornește aplicația.
2. Deschide `https://<staging>/api/health` de pe două rețele diferite (Wi-Fi și date mobile). Serverul scrie la fiecare cerere o linie `[debug] client address` cu `hops`, `forwardedEntries`, `hasSocketAddress` și `resolvedHash` (primele 12 caractere ale amprentei, nu adresa).
3. Cu valoarea corectă, `resolvedHash` este **diferit** pe cele două rețele și identic la cereri repetate de pe aceeași rețea. Dacă e identic pe ambele rețele, ai luat adresa proxy-ului: schimbă `TRUST_PROXY_HOPS` (sau verifică `forwardedEntries`: dacă e mai mic decât `hops`, proxy-ul nu adaugă adresa; vezi și `hasSocketAddress`).
4. Șterge `DEBUG_CLIENT_IP` și repornește aplicația.

### Notificarea pe Telegram (opțional)

Emailul rămâne canalul principal; Telegram este o a doua cale, ca o cerere să nu treacă neobservată dacă emailul nu funcționează. Canalele sunt independente: dacă unul eșuează, celălalt tot trimite, iar vizitatorul primește oricum confirmarea.

1. În Telegram, scrie lui `@BotFather`, comanda `/newbot`, și păstrează tokenul primit (`TELEGRAM_BOT_TOKEN`).
2. Adaugă botul într-un grup al academiei (sau scrie-i direct un mesaj).
3. Află identificatorul conversației (`TELEGRAM_CHAT_ID`): după ce ai scris un mesaj în grup, deschide în browser `https://api.telegram.org/bot<token>/getUpdates` și caută `"chat":{"id":...}` (pentru grupuri numărul e negativ).
4. Setează cele două variabile în aplicația Node și repornește-o. Fără ele, funcția este oprită.

Mesajul conține doar numele părintelui, telefonul, grupa de vârstă, pagina și ora. Telegram Messenger are servere în afara UE, de aceea este trecut în politica de confidențialitate și în [`registru-prelucrare.md`](registru-prelucrare.md). Cererea către Telegram are un timeout de 5 secunde; tokenul nu apare în loguri.

### Cereri nenotificate: reîncercare

Notificările (email și Telegram) pleacă după ce răspunsul a ajuns la vizitator. Dacă un canal eșuează, contactul rămâne salvat, iar eroarea apare în loguri ca avertisment, fără date personale.

Fiecare cerere salvată are în baza de date `notified_at` (momentul în care cel puțin un canal a reușit) și `notify_attempts`. Dacă niciun canal nu a reușit (SMTP căzut, parola de email schimbată, aplicația repornită în timpul trimiterii), jobul `notify-pending-leads` o retrimite: cererile mai vechi de 5 minute și mai noi de 7 zile, de cel mult 3 ori în total (prima încercare se numără). Două rulări ale jobului nu iau niciodată aceeași cerere, deci nu o retrimit împreună; o retrimitere tot e posibilă dacă prima trimitere durează mai mult de 5 minute sau dacă marcarea ca notificată eșuează după livrare. Dacă o cerere rămâne cu `notified_at` gol în phpMyAdmin, ea nu a ajuns la nimeni: sună părintele din baza de date.

## 2. Baza de date

În phpMyAdmin, pe baza de date a aplicației, importă în această ordine:

1. `server/db/migrations/001_create_leads.sql`
2. `server/db/migrations/002_create_rate_limits.sql`
3. `server/db/migrations/003_add_lead_notification_state.sql`

Migrațiile pot fi rulate din nou fără pagube (a treia adaugă coloanele doar dacă lipsesc). La o actualizare a unui site existent, rulează în phpMyAdmin doar migrațiile noi, înainte de publicare. Migrația 003 marchează contactele deja existente drept notificate la data creării, ca jobul de reîncercare să nu le retrimită.

## 3. Joburi programate (cron)

În cPanel, la Cron Jobs, se programează două joburi. Cron nu are `node` în PATH: folosește calea completă din mediul virtual al aplicației (cPanel → Setup Node.js App arată comanda `source /home/<utilizator>/nodevenv/<aplicație>/22/bin/activate`; binarul este `/home/<utilizator>/nodevenv/<aplicație>/22/bin/node`). Fișierul `.env` pentru `--env-file` stă în afara folderului site-ului, cu drepturi `600`.

Curățare, o dată pe zi:

```
0 3 * * * /calea/completa/node --env-file=/cale/.env /calea/aplicatiei/purge-expired-leads.cjs >> ~/logs/purge.log 2>&1
```

Reîncercarea notificărilor, la fiecare 10 minute:

```
*/10 * * * * /calea/completa/node --env-file=/cale/.env /calea/aplicatiei/notify-pending-leads.cjs >> ~/logs/notify.log 2>&1
```

Redirecționarea (`>> ~/logs/... 2>&1`) este necesară: cPanel trimite pe email tot ce scrie un cron, iar altfel ai primi un email la fiecare rulare cu eroare. Creează folderul o dată (`mkdir -p ~/logs`). Jobul scrie în log doar când a găsit cereri de retrimis sau a eșuat; când renunță la o cerere după a treia încercare scrie o eroare cu numărul cererii (id), ca să suni părintele din baza de date.

Jobul are nevoie de exactamente aceleași variabile de mediu ca aplicația, toate (nu doar cele `DB_*`): configurarea se validează integral la pornire, iar dacă lipsește ceva jobul se oprește fără să șteargă nimic. Rulează-l cu același fișier de mediu (`--env-file=/cale/.env`, ca în linia de mai sus) sau cu variabilele setate în panou. Ce șterge curățarea și cât se păstrează: [`date-personale.md`](date-personale.md).

## 4. Local

1. Copiază `.env.example` în `.env` și completează valorile.
2. Într-un terminal: `npm run dev:server` (construiește și pornește serverul pe portul 3000).
3. În alt terminal: `npm run dev`. Astro trimite `/api` către `http://localhost:3000`.

Publicarea aplicației (build, urcare, repornire) este automată, iar varianta manuală de rezervă e în [`publicare.md`](publicare.md) §6.
