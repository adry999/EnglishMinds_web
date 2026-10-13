# Ce mai e de făcut

Lista detaliată, cu pașii exacți, e în [`docs/operare/lansare.md`](docs/operare/lansare.md). Aici sunt doar starea și ordinea.

## Stare (13 octombrie 2026)

- Codul este complet și toate verificările trec (`npm run verify`, E2E și Lighthouse în CI).
- Preview-ul pentru client e live la <https://adry999.github.io/EnglishMinds_web/> ([`publicare.md`](docs/operare/publicare.md) §8).
- Cele 4 articole de blog sunt scrise ca `draft`, în așteptarea aprobării clientului ([`continut.md`](docs/operare/continut.md) §2).
- Curățenia e făcută: fără comentarii în cod, designul vechi arhivat în tag-ul git `arhiva-design`.
- Rămân datele clientului ([`chestionar-client.md`](docs/operare/chestionar-client.md)), hostingul și domeniul, botul de Telegram, decizia pentru GTM, pictograma oficială ANPC SAL și verificarea juridică.

## Acum

- [ ] Trimite clientului [chestionarul](docs/operare/chestionar-client.md).
- [ ] Descarcă pictograma oficială ANPC SAL de pe anpc.ro și salveaz-o ca `src/assets/legal/anpc-sal.png` ([`lansare.md`](docs/operare/lansare.md) §1).
- [ ] Creează botul de Telegram din @BotFather și află `TELEGRAM_CHAT_ID` ([`server.md`](docs/operare/server.md), „Notificarea pe Telegram”).
- [ ] Decide: Google Tag Manager sau tagurile direct ([`gtm.md`](docs/operare/gtm.md), [`taguri.md`](docs/operare/taguri.md)).
- [ ] Găsește un jurist pentru cele 3 pagini legale, bannerul de cookie-uri și bifa de acord ([`lansare.md`](docs/operare/lansare.md) §1).

## Când vin răspunsurile clientului

- [ ] Completează `src/shared/content/site.ts` până nu mai rămâne niciun `TODO` ([`lansare.md`](docs/operare/lansare.md) §1, [`continut.md`](docs/operare/continut.md) §1).
- [ ] Înlocuiește copertele de 640 px ale articolelor `5-obiceiuri-de-10-minute` și `copilul-nu-vrea-sa-vorbeasca` cu fotografii mai mari ([`continut.md`](docs/operare/continut.md) §2).
- [ ] Publică articolele aprobate (`draft: false`, [`continut.md`](docs/operare/continut.md) §2).
- [ ] Build de producție local fără erori ([`lansare.md`](docs/operare/lansare.md) §2).

## Când avem hostingul

- [ ] Configurare GitHub și cPanel ([`publicare.md`](docs/operare/publicare.md) §2–3), apoi activarea publicării ([`lansare.md`](docs/operare/lansare.md) §4).
- [ ] Staging complet ([`staging.md`](docs/operare/staging.md)), inclusiv verificarea IP-ului cu `DEBUG_CLIENT_IP` ([`server.md`](docs/operare/server.md), „Adresa IP a vizitatorului”).
- [ ] După verificare: scoate `DEBUG_CLIENT_IP` din cod și din documentație.
- [ ] Domeniu, SSL, redirecționare spre https ([`lansare.md`](docs/operare/lansare.md) §6).
- [ ] Prima publicare pe producție ([`lansare.md`](docs/operare/lansare.md) §7).

## După lansare

- [ ] Search Console, Bing, Google Business Profile ([`seo.md`](docs/operare/seo.md)).
- [ ] Conversiile în GA4, Google Ads și Meta ([`lansare.md`](docs/operare/lansare.md) §8, [`taguri.md`](docs/operare/taguri.md)).
- [ ] Un formular de test, apoi șters din baza de date ([`date-personale.md`](docs/operare/date-personale.md)).
- [ ] Lighthouse pe producție.
- [ ] Antetul CSP, întâi în mod Report-Only ([`lansare.md`](docs/operare/lansare.md) §8).
- [ ] Predarea către client: [`conturi.md`](docs/operare/conturi.md), acces GitHub, documentația parcursă împreună ([`lansare.md`](docs/operare/lansare.md) §9).
