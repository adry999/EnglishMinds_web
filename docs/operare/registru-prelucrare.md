# Registrul activităților de prelucrare (art. 30 GDPR)

> De verificat de jurist. Document de lucru, nu text final.

Există o singură activitate de prelucrare: „Cereri pentru lecția demo".

## Cereri pentru lecția demo

| Câmp | Conținut |
|---|---|
| Operator | Datele firmei din `src/shared/content/site.ts` → `company` (denumire, CUI, sediu social). De completat. |
| Contact pentru date personale | Telefonul din `site.contact`. Nu există responsabil cu protecția datelor (DPO) desemnat. |
| Scop | Contactarea părintelui pentru lecția demo gratuită. |
| Temei legal | Consimțământul persoanei, art. 6 alin. (1) lit. a GDPR. |
| Scop și temei: securitate | Securitate și prevenirea abuzurilor — interes legitim, art. 6(1)(f) GDPR. Date: amprenta IP (hash cu sare, în `rate_limits`) și jurnalele serverului de găzduire. |
| Categorii de persoane | Părinți care completează formularul. |
| Categorii de date | Numele părintelui, telefonul, grupa de vârstă a copilului, pagina de proveniență, nivelul recomandat de test (dacă există), parametrii UTM, momentul acordului, versiunea politicii. |
| Date care NU se prelucrează | Numele copilului, răspunsurile la test, IP în clar în baza de date (serverul îl primește la cerere; se stochează doar amprenta), user-agent. |
| Destinatari / persoane împuternicite | Furnizorul de găzduire, locație UE (de confirmat cu furnizorul ales la lansare); serviciul de email (serverul SMTP al domeniului), care trimite notificarea; furnizorul căsuței de email a academiei, care primește notificarea; WhatsApp (Meta), doar dacă persoana alege să trimită mesajul. |
| Transferuri în afara UE | Niciunul de către academie, cu hosting în UE (de confirmat cu furnizorul ales la lansare). WhatsApp/Meta se supun politicii proprii. |
| Termen de ștergere | Baza de date: 12 luni de la cerere, prin job zilnic automat. Limitele de trimitere (amprentă IP): șterse automat în cel mult 2 zile (jobul șterge rândurile mai vechi de 24 de ore, iar rulează o dată pe zi). |
| Copii prin email | Fiecare cerere ajunge și ca email de notificare la adresa `MAIL_TO` (nume, telefon, grupa de vârstă, UTM). Jobul NU le șterge: ștergere manuală în aceleași 12 luni (vezi `date-personale.md`). |
| Loguri ale serverului de găzduire | Pot conține IP-uri; păstrate conform setărilor furnizorului de găzduire. |

## Statistici și reclame (cookie-uri, doar cu acord)

| Câmp | Conținut |
|---|---|
| Furnizori | Google (Analytics, Ads) și Meta (Pixel). |
| Temei legal | Consimțământul, prin bannerul de cookies, pe categorii. |
| Categorii de date | Identificatori din cookie-uri, paginile vizitate, evenimentul de conversie. Fără nume sau telefon. |
| Transferuri | Posibile în afara UE, conform termenilor furnizorilor. |
| Durate | Vezi `src/content/legal/cookies.md` și `COOKIE_INVENTORY` (`src/features/consent/model/cookie-inventory.ts`). |

## Măsuri de securitate

- HTTPS pe tot site-ul (de confirmat la lansare);
- credențiale doar în variabile de mediu;
- interogări parametrizate către baza de date;
- IP doar ca hash cu sare, șters automat în cel mult 2 zile;
- limită de 5 cereri pe oră;
- log fără date personale.

## Documente înrudite

- `docs/operare/date-personale.md`: cum se rezolvă cererile de acces și ștergere.
- `docs/operare/taguri.md`: cookie-urile, taguri de măsurare și setările obligatorii din conturi.
