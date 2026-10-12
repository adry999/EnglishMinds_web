# Serverul formularului: operare

Serverul primește cererile `POST /api/lead`, salvează contactul în MySQL și trimite un email. Rulează ca aplicație Node pe cPanel (Passenger).

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
| `TRUST_PROXY` | `true` pe cPanel/Passenger, `false` local. |

Serverul nu pornește dacă lipsește o variabilă sau are valoare invalidă.

### Adresa IP a vizitatorului

Cu `TRUST_PROXY=true`, serverul ia ultima (cea mai din dreapta) adresă din `X-Forwarded-For`. Presupune exact un singur proxy de încredere în fața aplicației (Passenger/cPanel); intrările din stânga pot fi falsificate de client. Dacă hostingul are mai mulți proxy, regula trebuie ajustată. Cu `TRUST_PROXY=false` se folosește adresa conexiunii directe.

## 2. Baza de date

În phpMyAdmin, pe baza de date a aplicației, importă în această ordine:

1. `server/db/migrations/001_create_leads.sql`
2. `server/db/migrations/002_create_rate_limits.sql`

## 3. Publicare

Publicarea este automată, prin GitHub Actions după un CI verde: vezi `publicare.md`. Pașii de mai jos sunt doar rezerva, dacă publicarea automată nu funcționează.

### Publicare manuală (rezervă)

1. `npm run build:server` creează două pachete în `dist-server/`: `app.cjs` (serverul) și `purge-expired-leads.cjs` (jobul de curățare).
2. Urcă `app.cjs` în folderul aplicației Node (punct de pornire: `app.cjs`) și `purge-expired-leads.cjs` în același folder.
3. Repornește aplicația prin `tmp/restart.txt` (`touch tmp/restart.txt` sau din interfața cPanel).

Emailul se trimite după ce răspunsul a plecat către vizitator, pe principiul „cât se poate": dacă SMTP eșuează, contactul rămâne salvat în baza de date, iar eroarea apare în loguri ca avertisment (fără date personale).

## 4. Curățare zilnică (cron)

În cPanel, la Cron Jobs, o dată pe zi:

```
node /calea/aplicatiei/purge-expired-leads.cjs
```

Jobul are nevoie de exactamente aceleași variabile de mediu ca aplicația, toate (nu doar cele `DB_*`): configurarea se validează integral la pornire, iar dacă lipsește ceva jobul se oprește fără să șteargă nimic. Rulează-l cu același fișier de mediu (`node --env-file=/cale/.env /cale/purge-expired-leads.cjs`) sau cu variabilele setate în panou. Șterge contactele mai vechi de 12 luni și limitele de trimitere mai vechi de 24 de ore.

## 5. Local

1. Copiază `.env.example` în `.env` și completează valorile.
2. Într-un terminal: `npm run dev:server` (construiește și pornește serverul pe portul 3000).
3. În alt terminal: `npm run dev`. Astro trimite `/api` către `http://localhost:3000`.

## 6. De verificat pe staging

- Ruta `/api/lead` este servită pe același domeniu ca site-ul (spec §13.1).
- Adresa IP din `X-Forwarded-For` este a vizitatorului, nu a proxy-ului (trimite un formular și verifică în logul/baza de date că limitarea diferențiază vizitatorii).
- Tabela `rate_limits` arată valori `ip_hash` diferite pentru două rețele diferite (de exemplu Wi-Fi și date mobile).
- Un email de test ajunge la `MAIL_TO`, iar pe portul 587 conexiunea folosește TLS.
