# Ce mai e de făcut

Lista detaliată, cu pașii exacți, e în [`docs/operare/lansare.md`](docs/operare/lansare.md). Aici e doar ordinea și cine se ocupă.

## Acum

- [ ] Trimite clientului [chestionarul](docs/operare/chestionar-client.md).
- [ ] Descarcă pictograma oficială ANPC SAL de pe anpc.ro și salveaz-o ca `src/assets/legal/anpc-sal.png`.
- [ ] Creează botul de Telegram din @BotFather și află `TELEGRAM_CHAT_ID` (`docs/operare/server.md`).
- [ ] Decide: Google Tag Manager sau tagurile direct (`docs/operare/gtm.md`).

## Când vin răspunsurile clientului

- [ ] Completează `src/shared/content/site.ts` până nu mai rămâne niciun `TODO`.
- [ ] Publică articolele aprobate (`draft: false`).
- [ ] Build de producție local fără erori.

## Când avem hostingul

- [ ] Configurare GitHub și cPanel (`publicare.md` §2–3).
- [ ] Staging complet (`staging.md`), inclusiv verificarea IP-ului cu `DEBUG_CLIENT_IP`.
- [ ] După verificare: scoate `DEBUG_CLIENT_IP` din cod și din documentație.
- [ ] Domeniu, SSL, redirecționare spre https.
- [ ] Prima publicare pe producție.

## După lansare

- [ ] Search Console, Bing, Google Business Profile (`seo.md`).
- [ ] Conversiile în GA4, Google Ads și Meta.
- [ ] Un formular de test, apoi șters din baza de date.
- [ ] Lighthouse pe producție.
- [ ] Antetul CSP, întâi în mod Report-Only.
- [ ] Predarea către client: `conturi.md`, acces GitHub, documentația parcursă împreună.
