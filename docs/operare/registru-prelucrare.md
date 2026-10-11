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
| Categorii de persoane | Părinți care completează formularul. |
| Categorii de date | Numele părintelui, telefonul, grupa de vârstă a copilului, pagina de proveniență, nivelul recomandat de test (dacă există), parametrii UTM, momentul acordului, versiunea politicii. |
| Date care NU se prelucrează | Numele copilului, răspunsurile la test, IP în clar, user-agent. |
| Destinatari | Furnizorul de găzduire (UE); emailul academiei (notificarea cererii); WhatsApp (Meta), doar dacă persoana alege să trimită mesajul. |
| Transferuri în afara UE | Niciunul de către academie. WhatsApp/Meta se supun politicii proprii. |
| Termen de ștergere | 12 luni de la cerere, prin job zilnic automat. Limitele de trimitere (amprentă IP) se șterg după 24 de ore. |

## Măsuri de securitate

- HTTPS pe tot site-ul;
- credențiale doar în variabile de mediu;
- interogări parametrizate către baza de date;
- IP doar ca hash cu sare, șters după 24 de ore;
- limită de 5 cereri pe oră;
- log fără date personale.

## Documente înrudite

- `docs/operare/date-personale.md`: cum se rezolvă cererile de acces și ștergere.
- `docs/operare/taguri.md`: cookie-urile, taguri de măsurare și setările obligatorii din conturi.
