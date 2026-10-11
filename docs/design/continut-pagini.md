# Design content extraction (design/*.dc.html)

Global tokens (all pages): fonts Nunito 600/700/800/900 (body, headings weight 900), Barlow Condensed 700 (uppercase labels/badges/numbers). Colors: orange #ec6423, orange-light #f39a2e, yellow #ffc41f, dark yellow shadow #c98f00, navy #14224a, cream #fff5e6, orange-text #c4501a, orange-shadow #b8461a, pale-orange chip #fff0d6, card-edge #f0dcc0, photo placeholder #f3e3c8, Ema bg #ef8a2a, WhatsApp green #25d366, white #fff.
Hero gradient: `linear-gradient(115deg,#ec6423 0%,#f39a2e 100%)` (mobile: 160deg). Buttons: pill (radius 999px), 900 weight, "3D" bottom shadow `0 5px 0 <darker>`.
Star shape (12-point): `clip-path:polygon(50% 0,64.5% 24.9%,93.3% 25%,79% 50%,93.3% 75%,64.5% 75.1%,50% 100%,35.5% 75.1%,6.7% 75%,21% 50%,6.7% 25%,35.5% 24.9%)` on a colored square (yellow #ffc41f usually; #ec6423 on yellow card).
Contact constants: phone `+40 775 630 680` (tel:+40775630680), WhatsApp `https://wa.me/40775630680`, Instagram `https://www.instagram.com/englishminds_academy/` shown as `@englishminds_academy`, address `Str. Observatorului 90, et.2, Cluj-Napoca`.
Template syntax is DC (sc-for/sc-if); Metoda/Tabere/Blog are real fluid pages (clamp, auto-fit grids, max-width 1200px, padding 24px), NOT desktop+mobile canvases. Site v2 and Grupe are canvases (desktop 1280 + mobile 390 side by side, "designer notes" header above, not content).

## Shared components

### EMHeader (used by Metoda, Tabere, Blog; prop `active` = acasa|cursuri|metoda|tabere|blog)
- bg gradient 115deg #ec6423 -> #f39a2e, text #fff. Inner max-width 1200px, padding 22px 24px, flex space-between, wrap, gap 20px.
- Logo (link to Acasa): stacked text lockup, line-height .84, weight 900: "english" (28px, letter-spacing -.02em) / star(21px yellow) + "minds" (28px) / "ACADEMY" (14px, letter-spacing .03em, margin 4px 0 0 21px).
- Nav links (16px, 800, gap 6px 26px, active has 3px bottom border #ffc41f, others transparent): Acasă -> Site v2 (/) ; Cursuri -> Grupe (/grupe/) ; Metoda Cambridge -> Metoda (/metoda-cambridge/) ; Test de nivel -> Test.dc.html (level test page, later feature) ; Tabere de vară -> Tabere (/tabere/) ; Blog -> Blog (/blog/).
- CTA right: "Rezervă locul acum" -> https://wa.me/40775630680, navy #14224a bg, #fff text, 15px/900, padding 13px 22px, pill.

### EMFooter (Metoda, Tabere, Blog)
- bg #14224a, text #fff, max-width 1200, padding 56px 24px 32px, gap 36px.
- Row 1: heading "Rezervă lecția **demo gratuită**" ("demo gratuită" in #ffc41f), font clamp(28px,4vw,40px)/900, max-width 560. Buttons: "WhatsApp" (bg #25d366, #fff, 17px/900, padding 16px 26px, pill) -> wa.me/40775630680; "+40 775 630 680" (bg #ffc41f, navy) -> tel:+40775630680.
- Row 2 (border-top 1px rgba(255,255,255,.18), padding-top 24, 15px/700, opacity .8): "Str. Observatorului 90, et.2, Cluj-Napoca" | "@englishminds_academy" (Instagram link) | "Toate paginile proiectului" (yellow link to Index.dc.html; a design-project artifact, not site content).

## 1. Homepage `/` — `EnglishMinds Site v2.dc.html`
Designer note (not content): "Runda 2 · Direcția 1a rafinată / 1a v2: desktop și mobil". Page bg #fff5e6, text #14224a. Desktop artboard 2a (1280), mobile 2b (390, with 8px navy phone-frame border + radius 36 = canvas chrome, ignore).
Images used: only `assets/ema-reading.jpg` (4 times, Ema crop technique below). No other jpg.

Ema circle crop technique (identical everywhere on this page and Blog): wrapper `border-radius:50%; overflow:hidden; background:#ef8a2a; border:Npx solid #ffc41f` (sizes: hero 500px/12px border + shadow `0 24px 50px rgba(150,50,0,.3)`; test-section 120px/6px; mobile hero 250px/8px border, shadow `0 16px 30px rgba(150,50,0,.3)`; mobile test 60px/4px; blog 110px/6px). Inner `<img style="display:block;width:161%;margin-left:-61%;margin-top:-19.1%">` — i.e. photo is scaled to 161% of the circle width, shifted left 61% and up 19.1% to frame Ema's face (source image is wider than tall; margins are % of the wrapper width). alt "Ema, mascota English Minds Academy" (hero) / "Ema" (others).

### Floating WhatsApp
- Desktop: fixed on screen (in canvas `position:absolute right:28px; top:700px`; spec text: "butonul WhatsApp rămâne fix pe ecran"): pill bg #25d366, #fff, 900/17px, padding 14px 22px 14px 14px, shadow `0 10px 24px rgba(0,0,0,.2)`; inside a 32px white circle with green text "WA" + label "Scrie-ne pe WhatsApp" -> https://wa.me/40775630680.
- Mobile: fixed bottom bar ("bara de jos rămâne fixă"): left/right 12px, white pill, padding 6, 2-col grid gap 8, shadow; buttons "WhatsApp" (green #25d366, -> https://wa.me/40775630680) and "Lecție demo" (#ec6423, -> #test-2b / the quiz section on mobile). 15px/900, padding 13px 8px.

### Section A: Header + Hero (gradient 115deg #ec6423 -> #f39a2e; text #fff)
Decoration: a big yellow ellipse (#ffc41f, border-radius 50%, height 260px, left/right -10%, bottom -140px) at the bottom of the hero forming a curved yellow transition into the offer strip.
Header (desktop, padding 28px 64px): logo (32px/32px/ACADEMY 16px); nav 17px/800 gap 36: "Cursuri" (#cursuri), "Test de nivel" (#test), "Întrebări" (#faq), "Contact" (#contact) [in-page anchors]; CTA "Rezervă locul acum" navy pill 16px/900 padding 14px 24px -> #contact.
Mobile header (padding 20px): logo (22px/11px) + "Sună-ne" (navy pill, 14px/900, tel:+40775630680) + hamburger icon (44px circle rgba(255,255,255,.2) with three 18x2 white bars) — no menu content defined.
Hero desktop: grid 1.1fr / 1fr, gap 32, padding 24px 64px 96px, align center.
- Badge (rotate -2deg, bg #fff, color #c4501a, Barlow Condensed 20px uppercase, padding 6px 14px): "Start înscrieri pentru noul an școlar" (mobile: "Start înscrieri · noul an școlar", 16px).
- h1 78px / line-height .98 / ls -.025em / 900 (mobile 40px/1): "Engleză de la 5 ani, după metoda **Cambridge**." ("Cambridge" colored #14224a).
- Sub: 22px/1.45/700, max-width 500: "Grupe pe vârste, de la 5 la 14 ani, în Cluj-Napoca. Copiii învață pas cu pas, într-un mod adaptat vârstei lor." (not shown on mobile)
- Buttons: "Descoperă nivelul copilului" (bg #ffc41f, navy, 19px/900, padding 18px 30px, shadow 0 6px 0 #c98f00) -> #test ; "Lecție demo gratuită" (transparent, #fff text, 3px #fff border, 19px/900) -> #contact. Mobile: stacked full-width, 17px.
- Right: Ema circle 500px (see technique). Speech bubble overlay (desktop): left:-8px top:24px, bg #fff, navy, radius 24, padding 16px 22px, 24px/900, rotate -4deg, shadow, tail = 20px rotated square at right:28px bottom:-9px. Text: "Hei, eu sunt Ema!" + sub 15px/700 #c4501a "Hai să învățăm împreună." Mobile bubble: only "Hei, eu sunt Ema!" 16px/900 top-left of the 250px circle, rotate -4deg. Mobile order: badge, h1, Ema, buttons (no sub paragraph); desktop: text left, Ema right.

### Section B: Offer strip (bg #ffc41f; text navy)
Single row centered, gap 28, padding 6px 64px 26px: "Ofertă pre-sale 2026" (Barlow Condensed 28px uppercase #c4501a) • (10px navy dot) "4 + 1 lună cadou" (24px/900) • "Reducere pentru primii 20 înscriși" (18px/700). Mobile: stacked, centered: "Ofertă pre-sale 2026" (22px) / "4 + 1 lună cadou" (20px); the "Reducere pentru primii 20 înscriși" line is dropped on mobile.

### Section C: `#cursuri` Grupele de vârstă (bg cream #fff5e6)
Padding 96px 64px. Header row (space-between, align end): left label "Grupele de vârstă" (Barlow Condensed 22px uppercase #c4501a) + h2 "și structura cursurilor" (56px/900/ls -.02em); right text (19px/600, max-width 380): "3 ore pe săptămână, într-o investiție în viitorul lui."
Cards: grid 5 cols, gap 16; card bg #fff, radius 24, padding 28px 22px, min-height 260, shadow `0 2px 0 #f0dcc0`; contents: age chip (bg #fff0d6, #c4501a, pill, 15px/900), name (30px/900), desc (16px/1.5/600, opacity .85), link "Detalii grupă →" (16px/900 #c4501a, margin-top auto) -> Grupe page (/grupe/). Mobile: stacked list gap 10, card radius 20, padding 18px 20px; name (22px) left and age chip (14px) right on the same row, then desc 15px, then link.
LEVELS data (verbatim):
- Starters | 5–6 ani | Primele cuvinte și propoziții, prin joc, cântece și povești.
- Pre A1 | 7–8 ani | Vocabular de bază, citit și scris simplu, primele dialoguri.
- Movers | 9–10 ani | Propoziții complete, povestit la trecut și conversații scurte.
- Flyers | 11–12 ani | Texte mai lungi, gramatică explicată simplu, pregătire pentru examen.
- A2 Key | 13–14 ani | Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge.
(Mobile heading label+h2 are: "Grupele de vârstă" / "și structura cursurilor" at 18px / 32px.)

### Section D: 3 value cards (bg cream)
Grid 3 cols gap 20, padding 0 64px 96px; cards radius 28, padding 36, each with a 44px star at top (mobile: 34px star inline-left of title, only title shown, row layout, radius 22, padding 22, title 19px; the descriptions are omitted on mobile).
1. bg #14224a, white text, yellow star: "Program structurat pe niveluri" / "Fiecare copil începe la nivelul lui, stabilit prin test și lecția demo."
2. bg #ec6423, white text, yellow star: "Metodologie Cambridge" / "Manuale Cambridge, precum Kid's Box, adaptate fiecărei grupe."
3. bg #ffc41f, navy text, orange (#ec6423) star: "Rezultate vizibile după prima lună" / "Progres pas cu pas, pe care îl vezi și acasă."
Title 28px/900, body 17px/1.5.

### Section E: `#test` Test de nivel (bg gradient 115deg #ec6423 -> #f39a2e; mobile 160deg; padding 96px 64px; mobile 48px 16px)
Desktop: grid 340px | 1fr, gap 40, align center.
Left column (white text): label "Test de nivel · 3 minute" (Barlow Condensed 22px uppercase); link button "Testul complet, cu audio și diplomă →" (white bg, #c4501a text, 16px/900, padding 12px 20px, pill; `order:9` = visually last) -> Test.dc.html (full level test page, later feature); h2 "Descoperă nivelul potrivit copilului tău" (52px/1; mobile: "Descoperă nivelul potrivit" 30px, no full-test link); then Ema mini-scene: 120px Ema circle (6px yellow border) + white speech bubble (radius 20 20 20 4, padding 14px 18px, 17px/800, margin-bottom 60px) showing Ema's line (qd.ema, changes per step). Mobile: label + h2 on top, then 60px Ema + bubble (15px) in a row, then card.
Right: quiz card bg #fff5e6, radius 32 (mobile 26), padding 44 (mobile 22), min-height 460 (mobile 360), shadow `0 20px 40px rgba(120,40,0,.25)`.
Card header: 5 stars (30px; mobile 22px) = progress; filled (#ffc41f) for answered, empty (#f0dcc0); right label (15px/800 #c4501a) = step label.
QUIZ STATES (one component, state step = 'intro' | 0..4 | 'result' | 'done'; desktop and mobile have separate state):
1. intro — label "PASUL 1: VÂRSTA"; Ema: "Hai să vedem ce știi deja! Alege vârsta."; question "Câți ani are copilul?" (38px/900; mobile 26px); 5 buttons (grid 5 cols; mobile 2 cols) labelled with the LEVELS ages ("5–6 ani", "7–8 ani", "9–10 ani", "11–12 ani", "13–14 ani"): white bg, 3px navy border, radius 20, 22px/900, shadow 0 5px 0 navy, hover bg #ffc41f. Picking age i sets base level index = i, step=0, score=0.
2. question n (0..4) — label "ÎNTREBAREA {n+1} / 5"; hint (Barlow Condensed 20px uppercase #c4501a); question text (48px/900; mobile 30px); 3 option buttons (grid 3 cols, mobile stacked) each with a 34px orange (#ec6423) circle letter A/B/C + option text. Click records score and advances; after last -> result. Ema shows the question's tip (`e`).
3. result — label "REZULTAT"; Ema: "Bravo! Am găsit grupa potrivită."; navy panel (radius 24, padding 28): "NIVELUL RECOMANDAT" (yellow 14px/800 ls .06em), level name (44px/900), age (18px/800 yellow), level desc (16px), "{score} din 5 răspunsuri corecte" (14px, opacity .7) (mobile: "{age} · {score}/5 corecte"). Right: "Rezervă lecția demo gratuită" (24px/900), inputs "Numele părintelui", "Telefon" (bg #fff, 2px border #e8d4b6, radius 14, 17px/700), button "Rezervă locul acum" (bg #ec6423, white, shadow 0 5px 0 #b8461a; mobile label "Rezervă lecția demo"), text button "Reia testul". Desktop: 2-col grid (panel | form); mobile stacked.
   Recommended level = LEVELS[clamp(base + (score>=5 ? 1 : score<=1 ? -1 : 0), 0, 4)].
4. done — label "REZULTAT", Ema: "Ne vedem la lecția demo!". Desktop: "Mulțumim, {name}!" (48px/900 #c4501a) + "Ți-am deschis WhatsApp cu mesajul completat. Trimite-l și te contactăm pentru lecția demo la grupa {levelName}." (20px/600) + "Reia testul". Mobile: "Mulțumim, {name}!" (32px) + "Te sunăm în curând pentru lecția demo la grupa {levelName}." + "Reia testul".
   Submit requires non-empty name and phone; opens `https://wa.me/40775630680?text=` + encodeURIComponent("Bună ziua! Sunt {name} ({phone}). Am făcut testul de nivel: grupa recomandată {lvl.name} ({lvl.age}). Aș dori o lecție demo gratuită.").
QS data (verbatim; fields h=hint, t=question, o=options, a=correct index, e=Ema line):
- h 'Alege cuvântul potrivit' | t 'The sun is ___.' | o ['yellow','blue','green'] | a 0 | e 'Uită-te pe cer! De ce culoare e soarele?'
- h 'Completează propoziția' | t 'I ___ seven years old.' | o ['is','am','are'] | a 1 | e 'Despre tine vorbim: I ...'
- h 'Completează propoziția' | t 'She ___ a small cat.' | o ['have','having','has'] | a 2 | e 'Ea are o pisică mică.'
- h 'Completează propoziția' | t 'Where ___ you go yesterday?' | o ['did','do','does'] | a 0 | e 'Yesterday înseamnă ieri.'
- h 'Completează propoziția' | t 'If it rains, we ___ at home.' | o ['stayed','will stay','staying'] | a 1 | e 'Ultima! Dacă plouă, ce facem?'
Stage assignment: the spec/designer note says Ema guides the child through the test; the standalone full test (audio, diploma) is a separate page (Test.dc.html, later feature). Quiz scoring and WhatsApp-message submit are in this file; the real lead form / persistence is a later feature.

### Section F: `#faq` Întrebări frecvente (bg cream)
Desktop: grid 380px | 1fr, gap 56, padding 96px 64px, align start. Left: label "Întrebări frecvente" (Barlow Condensed 22px uppercase #c4501a), h2 "Ce ne întreabă părinții" (48px/900), text (18px/600): "Nu găsești răspunsul? Sună-ne la **+40 775 630 680**." (tel link, #c4501a, 900). Mobile: stacked (label 18px, h2 30px; the phone sentence omitted).
Right: accordion, one item open at a time (state index; clicking open item closes; initial state 0 = FIRST item open). Item: bg #fff, radius 22 (mobile 18), shadow 0 2px 0 #f0dcc0; question button 20px/900 (mobile 17px, min-height 56), padding 22px 26px; toggle circle 36px (mobile 30) shows "+" on #fff0d6 when closed, "–" (en dash) on #ffc41f when open; answer 17px/1.55/600, max-width 700 (mobile 15px).
FAQ data (7 items, verbatim; design says "6" as placeholder count but data has 7):
1. Q: De la ce vârstă poate începe copilul? / A: Avem grupe de la 5 ani până la 14 ani, organizate pe vârste și niveluri.
2. Q: Cum aflu nivelul copilului? / A: Faceți testul de nivel de pe site, apoi veniți la lecția demo gratuită. Acolo stabilim grupa potrivită.
3. Q: Câte ore pe săptămână sunt cursurile? / A: 3 ore pe săptămână.
4. Q: După ce metodă predați? / A: După metoda Cambridge, adaptată vârstei copiilor, cu manuale Cambridge precum Kid’s Box. (typographic apostrophe U+2019 here; elsewhere "Kid's Box" with straight apostrophe)
5. Q: Când se văd rezultatele? / A: Părinții observă rezultate vizibile după prima lună de curs.
6. Q: Ce include oferta pre-sale 2026? / A: 4 + 1 lună cadou. Detalii la +40 775 630 680.
7. Q: Unde au loc cursurile? / A: Str. Observatorului 90, et.2, Cluj-Napoca.

### Section G: `#contact` (bg #14224a, text #fff; padding 88px 64px 40px; mobile 48px 20px 32px)
Desktop grid 1.1fr | 1fr, gap 48.
Left: h2 "Rezervă lecția **demo gratuită**" (56px/1; "demo gratuită" #ffc41f; mobile 32px). Paragraph (19px, opacity .9): "Lasă-ne un număr de telefon și te sunăm să stabilim ziua și ora." (desktop only).
Lead form (state notSent): inputs (white, radius 14, 17px/700; desktop 2-col grid) placeholders "Numele părintelui", "Telefon"; label "Vârsta copilului" (15px/800, opacity .85); age pill toggles (single-select; 5 pills = the LEVELS ages; unselected transparent with white text and 2px #ffc41f border, selected bg #ffc41f navy text; 16px/800, padding 10px 18px; mobile min-height 44); submit "Rezervă locul acum" (bg #ffc41f navy, 19px/900, padding 18px 34px, shadow 0 5px 0 #c98f00). Submit (name and phone required) opens wa.me with text: "Bună ziua! Sunt {name} ({phone}). Aș dori o lecție demo gratuită" + (age ? " pentru copilul meu ({age})." : ".").
Sent state: yellow box (radius 22, padding 26, 24px/900 navy): desktop "Mulțumim, {name}! Trimite mesajul deschis în WhatsApp și te contactăm în curând."; mobile "Mulțumim, {name}! Trimite mesajul din WhatsApp și te contactăm."
Right info card (bg #fff5e6, navy text, radius 28): map placeholder 220px high (repeating-linear-gradient 135deg #f3e3c8/#efdcbd stripes) with monospace text "hartă · Str. Observatorului 90" (real map not designed); then labeled rows (labels 14px/800 ls .06em #c4501a): "ADRESĂ" -> "Str. Observatorului 90, et.2, Cluj-Napoca" (19px/800); "TELEFON" -> "+40 775 630 680" (tel:+40775630680, 26px/900); "INSTAGRAM" -> "@englishminds_academy" (https://www.instagram.com/englishminds_academy/, 19px/800). Mobile: no map; card (radius 22, padding 20): address 16px/800, big orange pill phone button "+40 775 630 680" (bg #ec6423, white, 20px/900, tel link), instagram link centered 15px.
Bottom bar (desktop): border-top 1px rgba(255,255,255,.18); logo (24px/ACADEMY 12px) left; right text (14px/700 opacity .7): "Cursuri de engleză pentru copii după metoda Cambridge · Cluj-Napoca". Mobile: only centered "English Minds Academy · Cluj-Napoca" (12px/700, opacity .6).
Mobile order differences: header -> hero -> pre-sale strip -> groups list -> 3 compact value rows -> test -> FAQ -> contact (form, then address card). Same order as desktop.

Placeholders on the homepage: none in [] form (map placeholder only).

## 2. `/grupe/` — `EnglishMinds Grupe.dc.html`
Designer note (not content): "Runda 3 · Pagina de grupă" / "Un singur șablon pentru toate cele 5 grupe" / "Schimbi grupa din tab-uri. Câmpurile marcate cu [ ] (preț, zile, mărimea grupei, manual) le completezi tu cu datele reale." One template, 5 groups selected by tabs (state d desktop, m mobile; initial 0 = Starters). Page bg #fff5e6, text #14224a.

Desktop (1280):
- Header+tabs (gradient 115deg #ec6423 -> #f39a2e, white text): logo (-> home); nav (17px/800, gap 36): "Acasă" (-> Site v2), "Cursuri" (current, 3px #ffc41f underline, not a link), "Test de nivel" (-> Site v2 #test-2a); CTA "Rezervă locul acum" (navy pill) -> wa.me/40775630680. Tab row under header (padding 8px 64px 0, gap 8): 5 tab buttons (radius 18 18 0 0, padding 14px 22px, name 17px/900 + age 13px/700); active tab bg #fff5e6 with navy text (merges into page), inactive bg rgba(255,255,255,.15) white text.
- Hero (padding 72px 64px; grid 1.2fr | 1fr, gap 48, align center): label "Nivelul {name} · {age}" (Barlow Condensed 24px uppercase #c4501a); h1 (64px/1, ls -.025em, same for every group) "Ce va învăța copilul tău la cursurile noastre de limbă engleză"; desc (21px/1.5/600, max-width 560) = group desc; buttons: "Rezervă lecția demo gratuită" (bg #ec6423, white, 18px/900, shadow 0 5px 0 #b8461a) -> wa.me/40775630680?text=encode("Bună ziua! Aș dori o lecție demo gratuită la grupa {name} ({age}).") ; "Nu știi nivelul? Fă testul" (3px navy border, navy text) -> homepage #test-2a. Photo: aspect-ratio 4/5, radius 36, border 10px solid #ffc41f, bg #f3e3c8, `<img object-fit:cover width/height 100%>`, alt "Copii la cursurile English Minds"; photo per group (below).
- Outcomes + details (padding 0 64px 88px; grid 1.4fr | 1fr, gap 24, align start):
  - White card (radius 32, padding 44, shadow 0 2px 0 #f0dcc0): h2 "La finalul anului, copilul:" (36px/900); 2-col grid of 4 outcomes, each = 30px yellow star + text (18px/1.45/700).
  - Navy card (radius 32, padding 36): label "Detalii curs" (Barlow Condensed 22px uppercase #ffc41f); rows (border-top 1px rgba(255,255,255,.18), padding 14px 0; key 16px/700 opacity .8, value 17px/900 right-aligned) from FACTS (below); then yellow box (radius 18, padding 16px 18px, margin-top 16): "Ofertă pre-sale 2026" (Barlow Condensed 18px uppercase #b8461a) + "4 + 1 lună cadou" (22px/900).
- "Celelalte grupe" (bg #ffc41f; padding 56px 64px): title (30px/900); grid 4 cols gap 14 of the other 4 groups as white buttons (radius 22, padding 22, shadow 0 4px 0 #c98f00): name (24px/900) + "{age} →" (15px/800 #c4501a); click switches the active group (current group excluded).
- Footer strip (bg #14224a, padding 32px 64px): "Str. Observatorului 90, et.2, Cluj-Napoca" left; "+40 775 630 680" (tel link, yellow #ffc41f, 22px/900) right.

Mobile (390) differences: header = logo + "← Acasă" (rgba(255,255,255,.2) pill, -> home), then tabs in a 3-col grid (radius 14, min-height 48, name 14px/900 over age 11px/700; active #fff5e6, inactive rgba(255,255,255,.18)). Hero text block: label (19px), h1 shortened to "Ce va învăța copilul tău" (32px), desc (17px), photo 4/3 (radius 24, border 6px #ffc41f, alt "Copii la curs") — photo comes AFTER the text on mobile (on desktop it is to the right). Then outcomes white card (title 22px, stacked list with 24px stars), navy "Detalii curs" card with the pre-sale box shortened to one centered line "Pre-sale 2026 · 4 + 1 lună cadou" (bg #ffc41f, 17px/900). Then CTAs stacked: "Rezervă demo pe WhatsApp" (bg #25d366, white, 17px/900) -> same group wa.me link; "Nu știi nivelul? Fă testul" (3px navy border) -> homepage #test-2b. Then navy address strip centered (address 14px/800 + phone 20px yellow). No "Celelalte grupe" block on mobile (tabs serve that purpose). No outbound header nav besides "← Acasă".

LEVELS data (verbatim: name | age | photo | desc | outcomes[4]):
1. Starters | 5–6 ani | assets/class.jpg | "Primele cuvinte și propoziții, prin joc, cântece și povești. Copilul prinde curaj să vorbească fără teama de a greși." | ["Numără până la 20 și recunoaște culorile, animalele și membrii familiei", "Se prezintă și salută în engleză", "Înțelege instrucțiuni simple din clasă", "Cântă și ascultă povești scurte"]
2. Pre A1 | 7–8 ani | assets/hands.jpg | "Vocabular de bază, citit și scris simplu, primele dialoguri. Engleza începe să se lege de ce învață la școală." | ["Citește cuvinte și propoziții simple", "Vorbește despre el, casă, școală și mâncare", "Scrie cuvinte și propoziții scurte", "Răspunde la întrebări simple în dialog"]
3. Movers | 9–10 ani | assets/group.jpg | "Propoziții complete, povestit la trecut și conversații scurte despre viața de zi cu zi." | ["Povestește ce a făcut, la timpul trecut", "Descrie oameni, locuri și obiecte", "Citește și înțelege texte scurte", "Susține dialoguri de zi cu zi"]
4. Flyers | 11–12 ani | assets/boy-reading.jpg | "Texte mai lungi și gramatică explicată simplu, cu pregătire pentru examenul Cambridge A2 Flyers." | ["Folosește viitorul și comparațiile", "Scrie mesaje și povești scurte", "Înțelege texte și înregistrări mai lungi", "Se pregătește pentru examenul A2 Flyers"]
5. A2 Key | 13–14 ani | assets/teacher-ema.jpg | "Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge A2 Key." | ["Conversează despre școală, hobby-uri și călătorii", "Scrie e-mailuri și texte scurte", "Înțelege engleza vorbită în situații reale", "Se pregătește pentru examenul A2 Key"]
FACTS (key: value): Durată: "3 ore pe săptămână" | Zile: "[de completat]" | Mărimea grupei: "[nr.] copii" | Manual: "[manual Cambridge]" | Preț: "[preț] lei / lună".
Placeholders to list: `[de completat]` (Zile), `[nr.] copii` (Mărimea grupei), `[manual Cambridge]` (Manual), `[preț] lei / lună` (Preț).
Images used: class.jpg, hands.jpg, group.jpg, boy-reading.jpg, teacher-ema.jpg (all as object-fit:cover, no object-position). No Ema crop on this page.
Interaction: client-side tab switching only (no URL state defined; for the real site likely one URL per group or hash — not specified).

## 3. `/metoda-cambridge/` — `EnglishMinds Metoda.dc.html`
Fluid responsive page (not a canvas). body bg #fff5e6, text #14224a; links default color #c4501a. Container max-width 1200px, padding 0 24px. Uses EMHeader (active="metoda") and EMFooter. No interactivity, no script.
1. Hero (gradient 115deg #ec6423 -> #f39a2e, white text; padding 48px 24px 88px; grid auto-fit minmax(320px,1fr), gap 40, align center -> collapses to 1 column on narrow screens, text first, image after):
   - Badge (rotate -2deg, bg #fff, #c4501a, Barlow Condensed 20px uppercase, padding 6px 14px): "Metoda Cambridge, pe înțelesul părinților"
   - h1 clamp(40px,6vw,72px)/1/ls -.025em: "De ce predăm după această metodă?"
   - p clamp(18px,2vw,21px)/1.5/700, max-width 520: "Pentru că le dă copiilor un drum clar: știi mereu la ce nivel sunt, ce urmează și cum arată progresul."
   - Image: circle width min(420px,80vw), aspect 1/1, border 12px solid #ffc41f, bg #f3e3c8, `assets/teacher-ema.jpg` alt "Profesoară cu manuale Cambridge", `object-fit:cover; object-position:50% 25%`.
2. "Trei lucruri care contează" (bg cream; padding 88px 24px): h2 clamp(32px,4vw,48px)/900. Grid auto-fit minmax(280px,1fr), gap 18, 3 cards (radius 28, padding 32, number in Barlow Condensed 44px, title 24px/900/1.15, body 17px/1.55):
   - 01 (bg #14224a, white; number color #ffc41f): "Engleza se vorbește din prima lecție" / "Copiii folosesc limba în jocuri, dialoguri și proiecte, nu doar memorează reguli."
   - 02 (bg #ec6423, white; number #fff5e6): "Niveluri recunoscute internațional" / "Fiecare nivel corespunde Cadrului European Comun de Referință (Pre A1, A1, A2, B1)."
   - 03 (bg #ffc41f, navy; number #c4501a): "Adaptată vârstei" / "Manuale și activități gândite separat pentru preșcolari, școlari și adolescenți."
3. "Drumul prin niveluri" (bg #fff; padding 88px 24px): label "Drumul prin niveluri" (Barlow Condensed 22px uppercase #c4501a); h2 "De la primele cuvinte la primul examen". Staircase bar chart: grid auto-fit minmax(200px,1fr), gap 14, align end; each column = colored block with top-rounded corners (radius 20 20 0 0) of increasing height + name (22px/900) + age (15px/700 #c4501a):
   - block 80px #fff0d6: "Pre A1 Starters" / "5–8 ani"
   - 130px #ffc41f: "A1 Movers" / "9–10 ani"
   - 180px #f39a2e: "A2 Flyers" / "11–12 ani"
   - 230px #ec6423: "A2 Key" / "13–14 ani"
   - 280px #14224a with 44px yellow star at top center (padding-top 20): "B1 Preliminary" / "următorul pas"
   Then paragraph (17px/1.55/600, max-width 720): "Examenele Cambridge sunt opționale. La final, copilul primește o diplomă recunoscută internațional, care arată exact ce știe."
4. "Ce primești tu, ca părinte" (bg cream; padding 88px 24px; grid auto-fit minmax(320px,1fr), gap 40, align center): left image 4/3, radius 32, `assets/class.jpg` alt "Lecție la English Minds", object-fit cover. Right: h2 clamp(30px,3.6vw,44px) "Ce primești tu, ca părinte"; 3 bullets (28px yellow star + 18px/1.5/700):
   - "Un nivel clar de pornire, stabilit la lecția demo"
   - "Progres pas cu pas, cu rezultate vizibile după prima lună"
   - "Un obiectiv concret: următorul nivel sau o diplomă Cambridge"
   CTA "Află nivelul copilului" (bg #ec6423, white, 18px/900, shadow 0 5px 0 #b8461a) -> homepage #test-2a (level test).
5. EMFooter.
Images: teacher-ema.jpg, class.jpg. Placeholders: none.

## 4. `/tabere/` — `EnglishMinds Tabere.dc.html`
Fluid page; bg #fff5e6; EMHeader active="tabere"; EMFooter; no script/interactivity.
1. Hero (bg solid #ffc41f, navy text; padding 56px 24px 88px; grid auto-fit minmax(320px,1fr), gap 40, align center):
   - Badge (rotate -2deg, bg #ec6423, white, Barlow Condensed 22px uppercase, padding 6px 16px): "Vara [2026] · [5–12] ani" (placeholders `[2026]`, `[5–12]`)
   - h1 clamp(44px,6.5vw,80px)/.98/ls -.03em: "O vară întreagă în engleză, cu Ema"
   - p clamp(18px,2vw,21px)/700, max-width 520: "Jocuri, proiecte și ieșiri, toate în engleză. Copiii nu pierd ritmul peste vară și se întorc la școală mai încrezători."
   - Button "Anunță-mă când încep înscrierile" (navy bg, white, 18px/900, padding 17px 28px) -> https://wa.me/40775630680?text=Bun%C4%83%20ziua!%20A%C8%99%20dori%20detalii%20despre%20tab%C4%83ra%20de%20var%C4%83. (decoded: "Bună ziua! Aș dori detalii despre tabăra de vară.")
   - Image: circle min(440px,80vw), border 12px solid #fff (white, not yellow), bg #f3e3c8, `assets/group.jpg`, alt "Copii bucuroși la English Minds", object-fit cover, object-position 50% 60%.
2. "Pe scurt" (cream; padding 88px 24px): h2 clamp(32px,4vw,48px). Grid auto-fit minmax(220px,1fr), gap 14, 4 info cards (bg #fff, radius 24, padding 26, shadow 0 2px 0 #f0dcc0; label 14px/800 ls .06em #c4501a; value 22px/900):
   - PERIOADA: "[iulie – august]"
   - PROGRAM: "[L–V, 9:00–13:00]"
   - LOCAȚIE: "Str. Observatorului 90, et.2"
   - PREȚ: "[preț] lei / săptămână"
3. "O zi în tabără" (bg #fff; padding 88px 24px): h2. Timeline rows (grid 120px | 1fr, gap 20, padding 22px 0, border-top 2px solid #f0e4d2; last row also border-bottom; time in Barlow Condensed 28px #c4501a; title 21px/900; desc 17px/600 opacity .85):
   - [9:00] Good morning! — Cântec de dimineață și jocul zilei.
   - [10:00] Proiectul săptămânii — Lucru în echipă pe o temă: călătorii, natură, meserii.
   - [11:30] Gustare și joacă — Pauză, tot în engleză.
   - [12:15] Show & tell — Fiecare copil prezintă ce a făcut azi.
   Note under (15px/700 opacity .7): "Programul și activitățile sunt un exemplu. Se completează cu programul real." (designer-ish note inside the page; likely not to be shown publicly).
4. Two cards (cream; padding 88px 24px; grid auto-fit minmax(320px,1fr), gap 24; radius 32, padding 40):
   - Orange card (#ec6423, white): h2 "Ce include" (36px) + list (18px/700): "[Materiale și manuale]", "[Gustare]", "[Diplomă de participare]", "[Ieșire tematică]".
   - Navy card (#14224a, white, vertically centered): "Locurile sunt limitate" (32px/900); "Scrie-ne pe WhatsApp și te anunțăm primul când se deschid înscrierile." (18px/1.5); button "Scrie-ne pe WhatsApp" (green #25d366, white, 18px/900, padding 16px 26px) -> same wa.me/40775630680 URL with text above.
5. EMFooter (note: in source it is placed inside the last div).
Placeholders: `[2026]`, `[5–12]`, `[iulie – august]`, `[L–V, 9:00–13:00]`, `[preț] lei / săptămână`, `[9:00]`, `[10:00]`, `[11:30]`, `[12:15]`, `[Materiale și manuale]`, `[Gustare]`, `[Diplomă de participare]`, `[Ieșire tematică]`.
Images: group.jpg only.

## 5. `/blog/` — `EnglishMinds Blog.dc.html`
Fluid page; bg #fff5e6; EMHeader active="blog"; EMFooter. Container max-width 1200, padding 64px 24px 96px, gap 40.
1. Title block: label "Blog" (Barlow Condensed 22px uppercase #c4501a); h1 clamp(40px,6vw,68px)/1/ls -.025em "Sfaturi pentru părinți"; p 19px/1.5/600, max-width 600: "Idei scurte despre cum îți ajuți copilul cu engleza acasă, fără teme în plus."
2. Category filter pills (flex wrap, gap 10; 2px navy border, radius 999, padding 11px 20px, 16px/800, min-height 44; active = bg #14224a + white text, inactive transparent + navy): "Toate" (default), "Acasă", "Metoda Cambridge", "Motivație", "Școală". Single-select client-side filter; filters POSTS by cat (Toate = all). First post of the filtered list becomes featured; the rest go to the grid; if the filtered list is empty the featured block is hidden.
3. Featured post (first of filtered list): link card (href="#" placeholder), bg #fff, radius 32, shadow 0 2px 0 #f0dcc0, grid auto-fit minmax(320px,1fr): image side min-height 320 (object-fit cover, alt ""); text side padding 40: category chip (bg #ffc41f, pill, 14px/900) + "{min} min de citit" (14px/700 opacity .7); title clamp(28px,3.4vw,40px)/900/1.08; excerpt 18px/1.55/600; "Citește articolul →" (17px/900 #c4501a).
4. Grid of remaining posts: repeat(auto-fill,minmax(300px,1fr)), gap 18; card bg #fff radius 26, shadow 0 2px 0 #f0dcc0; image aspect 16/10 object-fit cover (alt ""); body padding 24: chip (bg #fff0d6, #c4501a, 13px/900) + "{min} min" (13px/700 opacity .7); title 22px/900/1.2; excerpt 16px/1.5/600 opacity .85. Card hrefs are "#" (no post page designed).
POSTS (verbatim: cat | min | img | title | excerpt):
- Acasă | 4 | assets/boy-reading.jpg | "5 obiceiuri de 10 minute care îl ajută pe copil cu engleza" | "Desene în engleză, cântece în mașină, jocul „ce e asta?”: lucruri mici care fac diferența între lecții."
- Metoda Cambridge | 5 | assets/teacher-ema.jpg | "Starters, Movers, Flyers: ce înseamnă fiecare nivel" | "Ghid scurt despre nivelurile Cambridge pentru copii și ce ar trebui să știe copilul la fiecare."
- Motivație | 3 | assets/hands.jpg | "Copilul meu nu vrea să vorbească în engleză. E normal?" | "Perioada de tăcere e o etapă firească. Ce poți face ca să-i dai curaj, fără presiune."
- Școală | 4 | assets/class.jpg | "Cum îl ajută engleza pe copilul tău la școală și în viață" | "De la note mai bune la încredere în sine: beneficiile pe care le observă părinții."
5. "Sfatul Emei" banner (bg #ec6423, white, radius 32, padding 32, flex wrap, gap 24): Ema circle 110px (6px #ffc41f border, same 161%/-61%/-19.1% crop of `assets/ema-reading.jpg`, alt "Ema"); title "Sfatul Emei" (24px/900) + text "Nu știi de unde să începi? Fă testul de nivel și îți spunem ce se potrivește copilului tău." (18px/1.5/600); button "Fă testul" (bg #ffc41f, navy, 17px/900, shadow 0 5px 0 #c98f00) -> homepage #test-2a.
6. EMFooter.
Post detail page: NOT designed in this file (cards link to "#"; no body, date, author, or post layout shown). No dates or authors anywhere in the list.
Images: boy-reading.jpg, teacher-ema.jpg, hands.jpg, class.jpg, ema-reading.jpg (Ema crop).

## Image usage summary (design/assets/*.jpg)
- ema-reading.jpg: Homepage (hero, test scene desktop+mobile), Blog "Sfatul Emei" — always the 161% / -61% / -19.1% circular crop.
- teacher-ema.jpg: Grupe (A2 Key photo), Metoda hero (circle, object-position 50% 25%), Blog post 2.
- class.jpg: Grupe (Starters), Metoda "Ce primești" (4/3), Blog post 4.
- hands.jpg: Grupe (Pre A1), Blog post 3.
- group.jpg: Grupe (Movers), Tabere hero (circle, object-position 50% 60%).
- boy-reading.jpg: Grupe (Flyers), Blog post 1.
- karina.jpg: not used by any of these 5 pages (and not referenced in the Grupe/Metoda/Tabere/Blog/Site v2 files).

## Inconsistencies noticed
- Level naming/ages differ: Site v2 and Grupe have 5 groups (Starters 5–6, Pre A1 7–8, Movers 9–10, Flyers 11–12, A2 Key 13–14); Metoda staircase has 4 steps + exam: "Pre A1 Starters 5–8 ani", "A1 Movers 9–10", "A2 Flyers 11–12", "A2 Key 13–14", "B1 Preliminary" (Starters/Pre A1 merged, Movers labelled A1, Flyers labelled A2).
- Metoda text says CEFR levels "(Pre A1, A1, A2, B1)" while the other pages use Movers/Flyers without CEFR mapping; Grupe says Flyers prepares for "Cambridge A2 Flyers" and A2 Key for "A2 Key" (Metoda lists Flyers as "A2 Flyers").
- Level descriptions differ: homepage descs are the short versions; Grupe descs for Starters, Pre A1, Flyers and A2 Key add extra sentences/different wording (Movers is a longer variant "...despre viața de zi cu zi"); Flyers: "pregătire pentru examen" (home) vs "pregătire pentru examenul Cambridge A2 Flyers" (Grupe); A2 Key adds "A2 Key" in Grupe.
- Phone/WhatsApp/address/Instagram consistent across pages (+40 775 630 680, wa.me/40775630680, Str. Observatorului 90, et.2); Tabere card shows "Str. Observatorului 90, et.2" without "Cluj-Napoca".
- Kid's Box apostrophe: straight (value card) vs typographic ’ (FAQ answer).
- Pre-sale: "Reducere pentru primii 20 înscriși" appears only in the homepage strip (desktop); Grupe/FAQ only say "4 + 1 lună cadou". No prices anywhere (all `[preț]`).
- Hours: "3 ore pe săptămână" everywhere; Grupe "Zile" is `[de completat]`. Tabere program 9:00–13:00 is a placeholder.
- Header nav differs: homepage in-page anchors (Cursuri/Test de nivel/Întrebări/Contact); Grupe nav only Acasă/Cursuri/Test de nivel; EMHeader (Metoda/Tabere/Blog) has 6 links incl. Metoda Cambridge, Tabere de vară, Blog. Homepage 2a/2b uses its own inline header, not EMHeader. Mobile header has "Sună-ne" + hamburger with no menu defined.
- Quiz result text: desktop "{score} din 5 răspunsuri corecte" vs mobile "{score}/5 corecte"; mobile submit label "Rezervă lecția demo" vs desktop "Rezervă locul acum"; mobile done text omits WhatsApp mention though it also opens WhatsApp. Ema's `done` line says "Ne vedem la lecția demo!".
- Homepage FAQ: placeholder count 6, data has 7 items; initial state opens the first item.
- Hero CTA "Lecție demo gratuită" and test section lead form both exist (hero -> #contact form; quiz result has its own mini form); two different lead forms with different fields (quiz form has no age; contact form has age pills).
- Blog: category chip "Școală"/"Acasă" etc. exist but featured shows chip color #ffc41f while grid chips #fff0d6; no post detail design, no dates/authors; post links "#".
