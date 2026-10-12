# Taguri de măsurare și consimțământ

Site-ul încarcă Google Analytics 4, Google Ads și Meta Pixel doar după acordul vizitatorului, pe categorii. Înainte de acord nu pleacă nicio cerere către aceste servicii. Bannerul se redeschide oricând din butonul „Setări cookies" din subsol.

## Ce cookie-uri folosește site-ul

| Categorie | Serviciu | Cookie-uri | Durată | Scop |
|---|---|---|---|---|
| Necesar | English Minds Academy | `em_consent` | 182 de zile | Ține minte alegerea ta despre cookie-uri. |
| Statistici | Google Analytics 4 | `_ga`, `_ga_*` | 2 ani | Numără vizitele și paginile citite. |
| Statistici | English Minds Academy | `em-utm` (sessionStorage) | până închizi fila | Se salvează doar dacă accepți statisticile sau marketingul. Ține minte din ce reclamă ai venit, cât timp navighezi pe site. |
| Marketing | Meta Pixel | `_fbp`, `_fbc` | 90 de zile | Arată ce reclame Meta aduc rezervări. |
| Marketing | Google Ads | `_gcl_*` | 90 de zile | Arată ce reclame Google aduc rezervări. |

Duratele furnizorilor sunt orientative și pot varia (conform furnizorului).

Tabelul este identic cu `COOKIE_INVENTORY` din `src/features/consent/model/cookie-inventory.ts`, pe care pagina `/cookies/` îl afișează. Când schimbi unul, schimbă-l și pe celălalt. (`_gid` nu apare: GA4 nu îl setează, era un cookie al vechiului Universal Analytics. Bannerul îl șterge totuși, inofensiv, la retragerea acordului.)

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

## Setări obligatorii în conturile Google și Meta

Checklist de bifat la configurarea conturilor. Am promis că nu trimitem nume sau telefon, iar consimțământul trebuie respectat; setările automate ale furnizorilor pot încălca ambele.

- [ ] Meta Events Manager: „Automatic Advanced Matching" OFF și „Configurare automată a evenimentelor" OFF. De ce: altfel pixelul citește numele și telefonul din formular și le trimite hashuite.
- [ ] Google Ads: „Enhanced conversions" (automatic) OFF. De ce: altfel Google colectează date din formular.
- [ ] GA4: „User-provided data collection" OFF. De ce: același motiv, nume și telefon nu pleacă.
- [ ] Taguri Google separate: GA4 și Google Ads rămân taguri distincte. Nu le lega într-un singur tag Google cu „load other destinations". De ce: GA4 ar putea trimite ping-uri fără consimțământ pentru statistici.
- [ ] Nu importa evenimentul GA4 `generate_lead` în Google Ads ca conversie. De ce: Ads primește deja propriul `conversion`, iar importul ar număra fiecare lead de două ori.

## Cum se verifică

- Google Tag Assistant și Meta Pixel Helper, după „Accept toate".
- DevTools → Network: după „Refuz" nu apare nicio cerere la `googletagmanager.com` sau `facebook.net`.

## Pentru testele E2E (etapa 7)

Biblioteca de consimțământ ascunde bannerul pentru boți detectați (`hideFromBots`, implicit true), deci Playwright nu îl va vedea fără o suprascriere de test.

## Când se schimbă politica de cookies

Crește `COOKIE_REVISION` în `src/features/consent/ui/consent-config.ts`, ca toți vizitatorii să fie întrebați din nou.
