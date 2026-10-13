# Lista de verificare pentru staging

Bifează fiecare punct pe URL-ul de staging înainte de lansare. Înlocuiește `<staging>` cu domeniul real. Staging-ul este protejat cu parolă, deci comenzile `curl` folosesc `-u user:parola`.

Staging-ul se publică automat din branch-ul `staging` (vezi [`publicare.md`](publicare.md)). Are propria aplicație Node (Application URL `/api` pe subdomeniul de staging), propria bază de date și propriul folder, în afara lui `public_html` ([`publicare.md`](publicare.md) §3). Parola se creează în cPanel, la Directory Privacy ([`publicare.md`](publicare.md) §3, pasul 6).

## Rutare

- [ ] `/api/lead` răspunde pe același domeniu ca site-ul.
  - Verificare: `curl -i -u user:parola -X POST https://<staging>/api/lead -H 'content-type: application/json' -d '{}'`
  - Rezultat așteptat: `400` cu corp JSON, nu pagina 404 a site-ului.

## IP-ul real al vizitatorului

- [ ] `TRUST_PROXY_HOPS` este cel corect.
  - Verificare: urmează procedura din [`server.md`](server.md) („Adresa IP a vizitatorului”): cu `DEBUG_CLIENT_IP=true`, deschide `https://<staging>/api/health` de pe Wi-Fi și de pe date mobile; linia `[debug] client address` din logul aplicației (cPanel → Setup Node.js App) trebuie să aibă `resolvedHash` diferit pe cele două rețele. Apoi șterge `DEBUG_CLIENT_IP` și repornește aplicația.
- [ ] Rândurile din `rate_limits` confirmă același lucru.
  - Verificare: după două trimiteri de pe rețele diferite, phpMyAdmin → tabela `rate_limits` are două valori `ip_hash` diferite, plus rândul `global`.
- [ ] A 6-a cerere într-o oră de pe același IP primește `429`.
  - Verificare: trimite 6 cereri de pe același telefon, toate în aceeași oră calendaristică (fereastra de limitare este fixă, pe ora de ceas); formularul afișează alerta cu linkurile WhatsApp și telefon.

## Modul aplicației Node (secrete)

- [ ] Aplicația Node rulează în mod **Production**, nu Development.
  - Verificare: cPanel → Setup Node.js App → aplicația → „Application mode” arată `Production`. În Development, Passenger poate afișa public variabilele de mediu (parole) la o eroare de pornire.
- [ ] O configurare greșită nu publică variabilele de mediu.
  - Verificare: pe staging, schimbă temporar `MAIL_TO` în `gresit`, repornește aplicația și deschide `https://<staging>/api/health`: trebuie să apară o pagină de eroare simplă (500/503), fără nume sau valori de variabile. În logul aplicației apare doar „cannot start: invalid or missing configuration (MAIL_TO)”. Apoi restabilește valoarea.
- [ ] `.htaccess`-ul aplicației conține `PassengerFriendlyErrorPages off`.
  - Verificare: în folderul aplicației Node (`DEPLOY_APP_ROOT`) deschide `.htaccess` și verifică linia (vezi [`publicare.md`](publicare.md) §3).

## Email

- [ ] O cerere reală ajunge la adresa din `MAIL_TO`.
  - Verificare: trimite formularul cu date reale și caută mesajul în căsuța `MAIL_TO` (și în spam).
- [ ] Serverul SMTP pe portul 587 cere TLS.
  - Verificare: `openssl s_client -starttls smtp -connect <smtp-host>:587` arată un certificat valid.

## Notificări

- [ ] Telegram (dacă este configurat) primește cererea.
  - Verificare: trimite formularul și verifică mesajul în grupul academiei, în câteva secunde.
- [ ] Cererea apare ca notificată în baza de date.
  - Verificare: phpMyAdmin → `leads`: `notified_at` este completat și `notify_attempts` este 1.
- [ ] Reîncercarea funcționează.
  - Verificare: setează temporar o parolă SMTP greșită (și, dacă folosești Telegram, un `TELEGRAM_CHAT_ID` greșit), trimite formularul și observă `notified_at` gol; restabilește valorile, așteaptă următoarea rulare a jobului `notify-pending-leads` (10 minute) și verifică `notified_at` completat și emailul sosit.

## Cron

- [ ] `notify-pending-leads` rulează la 10 minute, cu calea completă către `node`.
  - Verificare: programarea cron conține jobul ([`server.md`](server.md) §3); `~/logs/notify.log` există și nu conține erori (jobul scrie „pending leads retried” doar când a retrimis ceva).
- [ ] `purge-expired-leads` rulează zilnic.
  - Verificare: programarea cron a hostingului (sau `crontab -l`) conține jobul zilnic.
- [ ] În log apare numărul de rânduri șterse.
  - Verificare: caută linia jobului în log după o rulare; numărul poate fi 0.

## Atribuire UTM

- [ ] UTM-urile ajung în lead-ul salvat.
  - Verificare: deschide `https://<staging>/?utm_source=test&utm_campaign=x`, navighează pe alte pagini, trimite formularul și verifică în baza de date (phpMyAdmin) și în email că `utm_source=test` și `utm_campaign=x` sunt păstrate.

## Formular fără JavaScript

- [ ] Fără JS, formularul arată mesajul de rezervă cu WhatsApp și telefon.
  - Verificare: dezactivează JavaScript în DevTools (Settings, Debugger, Disable JavaScript), reîncarcă `/lectie-demo/` și verifică mesajul alternativ.

## Banner cookies

- [ ] Consent Mode pornește cu `denied` înainte de prima alegere.
  - Verificare: în Tag Assistant, la prima vizită (fereastră privată), primul `consent default` are `ad_storage`, `analytics_storage`, `ad_user_data` și `ad_personalization` pe `denied`, înaintea oricărui hit.

- [ ] Refuz: zero cereri spre Google sau Meta.
  - Verificare: DevTools, Network, filtrează `google` și `facebook`, apasă „Refuz”, reîncarcă pagina.
- [ ] Accept: tagurile sunt văzute.
  - Verificare: Tag Assistant (Google) și Meta Pixel Helper detectează tagurile după „Accept toate”.
- [ ] Un formular trimis produce evenimentele `generate_lead`, `conversion` și `Lead`.
  - Verificare: Tag Assistant și Meta Pixel Helper, după ce ai acceptat cookie-urile și ai trimis formularul.

## Lighthouse

- [ ] Rulează Lighthouse (mobil) pe URL-ul de staging; pragul este 90 la toate categoriile.
  - Verificare: Lighthouse rulat pe pagina de login ar măsura pagina de autentificare, nu site-ul. Rulează-l fie pe un URL scos temporar din protecție, fie cu autentificarea trimisă în antet: `npx lighthouse https://<staging>/ --form-factor=mobile --extra-headers "{\"Authorization\":\"Basic $(printf 'user:parola' | base64)\"}"` (sau DevTools, Lighthouse, mod Mobile, după autentificare).

## Certificat SSL

- [ ] Staging-ul are certificat SSL valid și se reînnoiește.
  - Verificare: cPanel → SSL/TLS Status arată subdomeniul de staging cu certificat valid (AutoSSL), iar `curl -sI https://<staging>/` nu dă eroare de certificat. Autentificarea cu parolă exceptează `/.well-known/`, ca validarea AutoSSL să nu primească 401; verifică și `curl -I http://<staging>/.well-known/acme-challenge/test` (fără `-u`): răspunsul trebuie să fie 404 sau redirect, nu 401.

## Protecția cu parolă

- [ ] Subdomeniul de staging cere parola.
  - Verificare: deschide URL-ul într-o fereastră privată.
- [ ] După o publicare automată, staging-ul cere în continuare parola.
  - Verificare: deschide URL-ul într-o fereastră privată imediat după ce rulează workflow-ul Deploy.
  - Parola și `DEPLOY_HTPASSWD_FILE` se configurează în [`publicare.md`](publicare.md) (§2 pasul 4 și §3 pasul 6).
- [ ] Staging-ul are `noindex` sau este blocat în `robots.txt`.
  - Verificare: `curl -s -u user:parola https://<staging>/robots.txt` și antetul `X-Robots-Tag` / meta `robots` din pagină.

## Publicare

- [ ] Fluxul de publicare funcționează.
  - Verificare: fă o modificare vizibilă de text pe branch-ul `staging`, așteaptă să treacă workflow-urile CI și Deploy, apoi deschide pagina și verifică și `/api/lead` (vezi „Rutare”).

- [ ] Site-ul nu răspunde cu 500 după prima încărcare.
  - Verificare: deschide `https://<staging>/`. Dacă apare 500, `AllowOverride` al hostingului poate interzice `Options`: șterge linia `Options -Indexes` din `.htaccess` sau cere hostingului să o permită.
- [ ] Fișierele din `/_astro/` au cache pe termen lung.
  - Verificare: `curl -I -u user:parola https://<staging>/_astro/<fișier>` arată `Cache-Control: public, max-age=31536000, immutable`.

## Paginile legale

- [ ] Datele firmei sunt completate, fără `TODO`.
  - Verificare: deschide `/confidentialitate/`, `/termeni/` și `/cookies/`; caută „TODO” în pagină (Ctrl+F) sau `curl -s -u user:parola https://<staging>/termeni/ | grep -i todo`.
