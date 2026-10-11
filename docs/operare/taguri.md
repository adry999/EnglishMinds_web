# Taguri de măsurare și consimțământ

Site-ul încarcă Google Analytics 4, Google Ads și Meta Pixel doar după acordul vizitatorului, pe categorii. Înainte de acord nu pleacă nicio cerere către aceste servicii. Bannerul se redeschide oricând din butonul „Setări cookies" din subsol.

## Ce cookie-uri folosește site-ul

| Categorie | Serviciu | Cookie-uri | Durată |
|---|---|---|---|
| Necesar | Site (memorează alegerea) | `em_consent` | 182 de zile |
| Statistici | Google Analytics 4 | `_ga`, `_ga_*` | conform furnizorului |
| Marketing | Meta | `_fbp` | conform furnizorului |
| Marketing | Google Ads | `_gcl_*` | conform furnizorului |

Tabelul e baza pentru politica de cookies din etapa 6.

## Unde se pun ID-urile

În `src/shared/content/site.ts`, în `tracking`. Formatul fiecăruia:

- ID-ul GA4: `G-…`;
- ID-ul pixelului Meta: 10–20 de cifre;
- ID-ul Google Ads: `AW-…`;
- eticheta conversiei Google Ads (partea de după `/` din `send_to`).

Build-ul de producție eșuează cât timp rămân marcaje `TODO`. Un ID greșit ca format e ignorat în tăcere (tagul nu se încarcă), deci verifică după publicare.

## Ce evenimente pleacă

- `generate_lead` la GA4; marchează-l ca „key event" în GA4;
- `conversion` cu `send_to` la Google Ads;
- `Lead` standard la Meta.

Toate pleacă doar la răspunsul `201` al formularului și doar cu acordul pentru categoria respectivă. Nu conțin nume sau telefon.

## Cum se verifică

- Google Tag Assistant și Meta Pixel Helper, după „Accept toate".
- DevTools → Network: după „Refuz" nu apare nicio cerere la `googletagmanager.com` sau `facebook.net`.

## Când se schimbă politica de cookies

Crește `COOKIE_REVISION` în `src/features/consent/ui/consent-config.ts`, ca toți vizitatorii să fie întrebați din nou.
