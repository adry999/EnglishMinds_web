# Google Tag Manager (opțional)

Site-ul funcționează fără Google Tag Manager (GTM): `taguri.md` descrie varianta directă. GTM e pentru cine vrea să administreze singur tagurile (Google Analytics 4, Google Ads, Meta Pixel) fără să modifice codul site-ului.

Regula rămâne aceeași: înainte de acord nu pleacă nicio cerere către Google sau Meta. GTM se încarcă doar după ce vizitatorul acceptă statisticile sau marketingul.

## 1. Creezi containerul

1. Intră pe <https://tagmanager.google.com> și apasă „Create account".
2. Numele contului: English Minds Academy. Țara: România.
3. Numele containerului: `englishminds.ro`. Platforma: „Web".
4. Acceptă termenii. Ignoră fereastra cu codul de instalat: codul e deja în site.
5. Copiază ID-ul containerului, de forma `GTM-XXXXXXX` (sus, lângă „Submit").

## 2. Îl pui în site

În `src/shared/content/site.ts`, în `tracking`:

- `gtmContainerId: 'GTM-XXXXXXX'`;
- golește ID-urile directe (`ga4MeasurementId`, `metaPixelId`, `googleAdsId`, `googleAdsLeadLabel`): le pui `''`. Cât `gtmContainerId` e completat, site-ul nu le mai încarcă (ca să nu numere de două ori), dar e mai curat să nu rămână.

Un ID cu format greșit e ignorat în tăcere și se revine la modul direct. Verifică după publicare (pasul 5).

## 3. Ce primește GTM de la site

Doar după acord, în `dataLayer`:

- `em_consent`: `{ event: 'em_consent', analytics: true/false, marketing: true/false }`, la fiecare alegere sau schimbare;
- `generate_lead`: `{ event: 'generate_lead', lead_source: 'home' | 'landing' | 'test' }`, la trimiterea reușită a formularului. Nu conține nume, telefon sau email.

Consent Mode v2 e deja setat de site (`default denied`, apoi `update` la alegere). Nu seta alt Consent Mode în GTM.

## 4. Configurezi tagurile în GTM

### 4.1. Google tag (GA4)

1. Tags → New → „Google tag". Tag ID: `G-…` din GA4.
2. Trigger: „Initialization - All Pages".
3. Advanced Settings → Consent Settings → „Require additional consent for tag to fire": `analytics_storage`.
4. Nu activa colectarea de date furnizate de utilizator (user-provided data) și nici „Enhanced conversions”, conform `taguri.md`.

### 4.2. Evenimentul GA4 `generate_lead`

1. Triggers → New → tip „Custom Event", Event name `generate_lead`.
2. Tags → New → „Google Analytics: GA4 Event". Configuration tag: tagul de la 4.1. Event name: `generate_lead`.
3. Parametru: `lead_source` = variabila Data Layer `lead_source` (Variables → New → „Data Layer Variable").
4. Consent: `analytics_storage`. În GA4 marchează evenimentul ca „key event".

### 4.3. Conversia Google Ads

1. Tags → New → „Google Ads Conversion Tracking". ID-ul conversiei și eticheta din contul Google Ads.
2. Trigger: același Custom Event `generate_lead`.
3. Consent: `ad_storage`, `ad_user_data`, `ad_personalization`. Nu importa și evenimentul GA4 în Ads, altfel conversia se numără de două ori.

### 4.4. Meta Pixel (baza și Lead)

1. Variables → New → „Data Layer Variable", nume `marketing`, tip Data Layer Variable Version 2.
2. Triggers → New → Custom Event, Event name `em_consent`, „This trigger fires on: Some Custom Events", condiția `marketing` egal cu `true`. Îl numești „Consimțământ marketing".
3. Tags → New → „Custom HTML" cu codul de bază Meta Pixel (sau un șablon „Facebook Pixel" din Community Template Gallery). Trigger: „Consimțământ marketing". Dezactivează Automatic Advanced Matching și configurarea automată a evenimentelor (vezi `taguri.md`).
4. Tag nou pentru `Lead`: aceeași metodă (șablon sau Custom HTML cu `fbq('track','Lead')`), trigger Custom Event `generate_lead`, plus condiția `marketing` egal cu `true`, ca să nu pornească dacă vizitatorul a acceptat doar statisticile.
5. Pentru retragerea acordului nu e nevoie de nimic: site-ul șterge cookie-urile și reîncarcă pagina.

## 5. Testezi și publici

1. În GTM apasă „Preview" și introdu adresa site-ului. Se deschide Tag Assistant.
2. Fără să accepți nimic, în Tag Assistant containerul nu trebuie să apară deloc.
3. Apasă „Accept toate": apar evenimentele `em_consent` și Container Loaded, iar tagurile pornesc.
4. Trimite formularul de test: apare `generate_lead` și pornesc evenimentul GA4, conversia Ads și `Lead` Meta.
5. În DevTools → Network, după „Refuz" nu apare nicio cerere la `googletagmanager.com`.
6. Când totul e corect: Submit → Publish. Fără publicare, containerul e gol pentru vizitatori.

## Atenție

- Nu adăuga niciodată taguri care pornesc înainte de acord (de exemplu cu trigger „All Pages" fără condiție de consimțământ). Fiecare tag nou are Consent Settings sau un trigger bazat pe `em_consent`.
- Nu trimite nume, telefon sau email în `dataLayer` și nu cere GTM să le citească din formular.
- Cookie-urile sunt aceleași ca în `taguri.md` (Google și Meta); site-ul nu adaugă cookie-uri proprii noi.
- Cine are acces la container poate schimba ce se trimite: dă acces doar persoanelor de încredere și cu 2FA (`conturi.md`).
