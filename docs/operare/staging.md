# Lista de verificare pentru staging

Bifează fiecare punct pe URL-ul de staging înainte de lansare. Înlocuiește `<staging>` cu domeniul real. Staging-ul este protejat cu parolă, deci comenzile `curl` folosesc `-u user:parola`.

## Rutare

- [ ] `/api/lead` răspunde pe același domeniu ca site-ul.
  - Verificare: `curl -i -u user:parola -X POST https://<staging>/api/lead -H 'content-type: application/json' -d '{}'`
  - Rezultat așteptat: `400` cu corp JSON, nu pagina 404 a site-ului.

## IP-ul real al vizitatorului

- [ ] În log, două cereri de pe telefoane diferite au amprente diferite.
  - Verificare: trimite formularul de pe două telefoane (date mobile) și compară amprentele din log-ul serverului.
- [ ] A 6-a cerere într-o oră de pe același IP primește `429`.
  - Verificare: trimite 6 cereri de pe același telefon, toate în aceeași oră calendaristică (fereastra de limitare este fixă, pe ora de ceas); formularul afișează alerta cu linkurile WhatsApp și telefon.
- [ ] Proxy-ul hostingului pune un singur hop în `X-Forwarded-For`.
  - Verificare: urmărește `docs/operare/server.md` (secțiunea „Adresa IP a vizitatorului”); în log, IP-ul folosit pentru limitare trebuie să fie al vizitatorului, nu al proxy-ului.

## Email

- [ ] O cerere reală ajunge la adresa din `MAIL_TO`.
  - Verificare: trimite formularul cu date reale și caută mesajul în căsuța `MAIL_TO` (și în spam).
- [ ] Serverul SMTP pe portul 587 cere TLS.
  - Verificare: `openssl s_client -starttls smtp -connect <smtp-host>:587` arată un certificat valid.

## Cron

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

## Protecția cu parolă

- [ ] Subdomeniul de staging cere parola.
  - Verificare: deschide URL-ul într-o fereastră privată.
- [ ] Staging-ul are `noindex` sau este blocat în `robots.txt`.
  - Verificare: `curl -s -u user:parola https://<staging>/robots.txt` și antetul `X-Robots-Tag` / meta `robots` din pagină.

## Publicare

- [ ] Fluxul de publicare funcționează: build din ramura `staging`, încărcare prin SFTP, repornire prin `tmp/restart.txt`.
  - Verificare: încarcă un build nou prin SFTP, rulează `touch tmp/restart.txt` în aplicație și confirmă că pagina și `/api/lead` servesc noul build (de exemplu o modificare vizibilă de text).

## Paginile legale

- [ ] Datele firmei sunt completate, fără `TODO`.
  - Verificare: deschide `/confidentialitate/`, `/termeni/` și `/cookies/`; caută „TODO” în pagină (Ctrl+F) sau `curl -s -u user:parola https://<staging>/termeni/ | grep -i todo`.
