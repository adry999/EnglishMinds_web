# Test de nivel — extragere din design

Surse: `design/EnglishMinds Test.dc.html` (pagina completă, 254 linii, script DC la liniile 91-251), `design/EnglishMinds Site v2.dc.html` (quiz scurt, secțiunile `#test-2a` / `#test-2b`, script la liniile 218-289). `design/support.js` este doar runtime-ul DC (`DCLogic`, `sc-if`, `sc-for`); nu adaugă comportament propriu testului. Pagina Test este o pagină fluidă (nu canvas desktop+mobil), cu `EMHeader active="test"` și `EMFooter`.

Tokeni globali: vezi `docs/design/continut-pagini.md`. Font Nunito 600-900 (corp), Barlow Condensed 700 uppercase (etichete). Culorile de mai jos sunt cele din fișier.

## 1. Structura paginii

Fundal pagină `#fff5e6`. Header (EMHeader) sus, footer (EMFooter) jos. Între ele: zonă gradient `linear-gradient(115deg,#ec6423 0%,#f39a2e 100%)`, `flex:1`, padding `40px 16px 80px`. Container `max-width:880px`, centrat, coloană, gap 22px. 4 stări (`state.step`): `mode` -> `setup` -> `q` (x12) -> `result`. Nu există ecran de eroare, de încărcare sau de pauză.

### 1.0 Antet permanent: Ema + bulă (toate stările)
- Cerc Ema 76x76px, `border:5px solid #ffc41f`, fundal `#ef8a2a`, `overflow:hidden`, img `assets/ema-reading.jpg` alt `Ema`, `width:161%;margin-left:-61%;margin-top:-19.1%`.
- Bulă: fundal `#fff`, radius `20px 20px 20px 4px`, padding `14px 18px`, weight 800, `font-size:clamp(16px,2vw,19px)`, line-height 1.3. Flex align center, gap 14px.
- Texte Ema (verbatim, în funcție de stare):
  - mode: `Hei, eu sunt Ema! Alege testul și începem.`
  - setup: `Alege și începem! La final primești o diplomă.`
  - întrebare cu audio: `Apasă „Ascultă” și alege ce ai auzit.`
  - întrebare fără audio (orice altă întrebare, inclusiv prima): `Super! Mergem mai departe.`
  - result fără nume: `Bravo! Scrie numele tău ca să-ți pregătesc diploma.`
  - result cu nume: `Bravo, ${nume}! Diploma ta e gata de descărcat.`
  - Atenție: butonul din întrebare scrie „Ascultă din nou", dar Ema spune „Apasă „Ascultă"". „Super! Mergem mai departe." apare și la prima întrebare (înainte de orice răspuns).

### 1.1 Card principal (conține toate stările)
Fundal `#fff5e6`, radius 32px, padding `clamp(22px,4vw,44px)`, coloană gap 24px, shadow `0 24px 48px rgba(120,40,0,.25)`, `min-height:480px`.

### 1.2 Stare `mode` (ecran de start)
- h1 (`clamp(32px,5vw,48px)`, 900, lh 1.05, ls -.02em): `Ce fel de test vrei să facă copilul?`
- Grid `repeat(auto-fit,minmax(260px,1fr))`, gap 14px, 2 butoane-card (fundal `#fff`, `border:3px solid #14224a`, radius 26px, padding 26px, shadow `0 6px 0 #14224a`, hover fundal `#ffc41f`, text aliniat stânga, gap 8px):
  1. Eyebrow (Barlow Condensed 20px uppercase `#c4501a`): `12 întrebări · 5 minute` / titlu (900, 26px): `Test de nivel` / descriere (16px/600, lh 1.45): `Aflăm grupa potrivită. Întrebările se adaptează vârstei, cu imagini și audio pentru cei mici.`
  2. Eyebrow: `12 întrebări · 5 minute` / titlu: `Test pentru examen Cambridge` / descriere: `Verificăm cât de pregătit e copilul pentru Starters, Movers, Flyers sau A2 Key.`

### 1.3 Stare `setup` (vârstă / examen)
- h1 (`clamp(28px,4.4vw,42px)`, 900): mode=level: `Câți ani are copilul?`; mode=exam: `Pentru ce examen se pregătește?`
- Etichetă (800, 15px): level: `Vârsta`; exam: `Examenul Cambridge`
- Grid `repeat(auto-fit,minmax(130px,1fr))`, gap 10px, butoane (border 3px `#14224a`, radius 18px, padding `16px 8px`, 900, 19px, shadow `0 5px 0 #14224a`, min-height 56px; selectat fundal `#ffc41f`, neselectat `#fff`).
  - Level: `5–6 ani`, `7–8 ani`, `9–10 ani`, `11–12 ani`, `13–14 ani`
  - Exam: `Starters`, `Movers`, `Flyers`, `A2 Key`
- Buton primar `Începe testul`: pill, `color:#fff`, padding `17px 32px`, 900, 19px, shadow `0 5px 0 #b8461a`; fundal `#ec6423` dacă s-a ales ceva, altfel `#d9b9a0` (aspect dezactivat; nu are atribut `disabled`, doar `start()` returnează dacă `choice<0`).
- Link text `Înapoi` (800, 15px, subliniat, `#14224a`) -> revine la `mode`.

### 1.4 Stare `q` (întrebare)
Coloană gap 20px.
- Rând sus (space-between): chip competență (fundal `#fff0d6`, `#c4501a`, pill, padding `6px 14px`, 900, 14px): `Vocabular` | `Gramatică` | `Citit` | `Ascultare`; la dreapta contor `{n} / 12` (900, 15px), ex. `1 / 12`.
- Bară progres: pistă `#f0dcc0` h10 radius 99; umplere `#ec6423`, lățime `qi / total * 100%` (0% la prima întrebare, 91.67% la a 12-a; nu atinge niciodată 100%). Fără tranziție CSS.
- Instrucțiune (Barlow Condensed 20px uppercase `#c4501a`): `Privește imaginea` | `Numără stelele` | `Ascultă și alege` | `Ascultă și răspunde` | `Alege răspunsul` | `Completează` | `Citește`
- Media (după tip):
  - audio: buton pill `#14224a`, text `#fff`, 900, 19px, padding `14px 26px 14px 14px`, gap 14px; în stânga cerc 44px `#ffc41f` cu triunghi play 16x18px `#14224a` (`clip-path:polygon(0 0,100% 50%,0 100%)`, margin-left 4px). Text: `Ascultă din nou`.
  - color: cerc 150x150px, fundal = culoarea întrebării, `border:6px solid #fff`, shadow `0 8px 20px rgba(0,0,0,.12)`.
  - count: `n` stele 64x64px `#ffc41f` (stea cu 12 colțuri, același `clip-path` ca pe site), flex-wrap gap 10px.
  - pasaj de citit (`p`): cutie `#fff`, radius 18px, padding `18px 20px`, 19px/700, lh 1.5, shadow `0 2px 0 #f0dcc0`.
- Text întrebare: `clamp(26px,4vw,40px)`, 900, lh 1.1, ls -.01em.
- Opțiuni: grid `repeat(auto-fit,minmax(180px,1fr))`, gap 12px; buton (flex, gap 12px, `#fff`, border 3px `#14224a`, radius 20px, padding `14px 16px`, 900, 20px, shadow `0 5px 0 #14224a`, min-height 60px, hover `#ffc41f`) cu badge literă (32px cerc `#ec6423`, text `#fff`, 15px): `A`, `B`, `C`. Mereu exact 3 opțiuni.
- Comportament: click pe opțiune înregistrează răspunsul și trece imediat la următoarea; fără feedback corect/greșit, fără buton Înapoi/Sari peste, fără timer. La întrebarea următoare de tip audio, vorbirea pornește automat (din gestul de click). La `start()` se redă automat și prima întrebare dacă e audio (în practică prima întrebare din nicio bancă nu e audio).

### 1.5 Stare `result`
- Bloc titlu: eyebrow (Barlow Condensed 20px uppercase `#c4501a`) = `r.kicker`; titlu (`clamp(34px,5.5vw,56px)`, 900, lh 1) = `r.title`; descriere (18px/600, lh 1.5, max-width 620px) = `r.desc`.
  - Level: kicker `Nivelul recomandat`; titlu = numele nivelului; desc = textul din `LV` (vezi 3.4).
  - Exam: kicker `Test pentru examenul Cambridge ${Starters|Movers|Flyers|A2 Key}`; titlu și desc vezi 3.3.
- Grid 2 coloane `repeat(auto-fit,minmax(300px,1fr))`, gap 18px, `align-items:start`:
  - Card „Rezultat pe competențe" (`#fff`, radius 24, padding 24, gap 16, shadow `0 2px 0 #f0dcc0`): titlu `Rezultat pe competențe` (900, 20px) + scor `{score}/{total}` (900, 18px, `#c4501a`). Apoi 4 rânduri în ordinea `Vocabular`, `Gramatică`, `Citit`, `Ascultare`: etichetă (800, 15px) + `ok/nr` și bară 12px pe pistă `#f5e8d6` (radius 99). Culori bare: Vocabular `#ffc41f`, Gramatică `#ec6423`, Citit `#14224a`, Ascultare `#25a55f`. Competență cu 0 întrebări: 0%.
  - Card diplomă (fundal `#ec6423`, radius 24, padding 14, gap 12): vezi secțiunea 4.
- Bandă CTA (fundal `#14224a`, `#fff`, radius 24, padding 24, flex space-between wrap gap 18): titlu `Următorul pas: lecția demo gratuită` (900, 22px); sub `Trimitem rezultatul pe WhatsApp și stabilim ziua lecției.` (16px, opacity .9, max-width 460px); buton `Trimite rezultatul pe WhatsApp` (fundal `#25d366`, `#fff`, pill, padding `16px 26px`, 900, 17px).
  - Mesaj WhatsApp (către `https://wa.me/40775630680?text=` + encodeURIComponent): `Bună ziua! ${nume sau "Copilul meu"} a făcut testul pe site: ${kicker.toLowerCase()} – ${title} (${score}/${total}). Aș dori o lecție demo gratuită.`
  - Pe pagina Test nu există câmpuri nume părinte / telefon (spre deosebire de quiz-ul scurt din Site v2). Nu se trimite nimic către un server.
- Link `Fă un alt test` (800, 15px, subliniat) -> `restart`: step=mode, qi=0, ans=[], choice=-1 (numele introdus se păstrează).

### 1.6 Erori / stări goale
Nu există mesaje de eroare. Singurele gărzi: `Începe testul` nu face nimic fără alegere; descărcarea diplomei nu face nimic fără nume (butonul arată `Scrie numele ca să descarci`); `try/catch` mut în jurul `speechSynthesis` și `window.open`.

## 2. Banca de întrebări

3 bănci a câte 12 întrebări = **36 de întrebări** (YOUNG, MID, TEEN). Nu există grupare pe nivel în interiorul unei bănci; ordinea e fixă (fără amestecare). Nu există imagini fotografice/emoji/iconițe: media vizuală e doar cercul colorat și stelele (CSS). Prompturile (`t`) sunt în engleză, în afară de cele marcate (RO). Instrucțiunile sunt în română.

Câmpuri: `s` competență (v=Vocabular, g=Gramatică, r=Citit, l=Ascultare), `type` (color|count|audio|text implicit), `p` pasaj, `say` text vorbit, `o` opțiuni (A/B/C), `a` index corect (0-based).

### 2.1 Audio
```js
const say = t => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
```
- Web Speech API (`speechSynthesis`), `lang='en-GB'`, `rate=0.85`, fără `voice` ales explicit (voce implicită a browserului/OS), volum/pitch implicite. `cancel()` înainte de `speak()`. Nu există fișiere audio. Eșecul e înghițit tăcut (fără mesaj/fallback; dacă browserul nu are voce, copilul nu aude nimic).
- Redare automată la afișarea unei întrebări audio (la click-ul răspunsului precedent) + butonul `Ascultă din nou`.

### 2.2 YOUNG (folosit pentru `5–6 ani`, `7–8 ani` și examen `Starters`)
| # | Comp. | Tip | Instrucțiune | Prompt | Media / text vorbit | Opțiuni | Corect |
|---|---|---|---|---|---|---|---|
| 1 | v | color | Privește imaginea | What colour is it? | cerc `#e53935` | red, blue, green | A red |
| 2 | v | count | Numără stelele | How many stars? | 3 stele | two, three, four | B three |
| 3 | l | audio | Ascultă și alege | Ce cuvânt ai auzit? (RO) | say: `cat` | cat, dog, car | A cat |
| 4 | v | color | Privește imaginea | What colour is it? | cerc `#ffc41f` | pink, yellow, black | B yellow |
| 5 | l | audio | Ascultă și alege | Ce număr ai auzit? (RO) | say: `Number five` | 9, 2, 5 | C 5 |
| 6 | v | text | Alege răspunsul | Which one is an animal? | - | apple, lion, chair | B lion |
| 7 | v | count | Numără stelele | How many stars? | 5 stele | five, six, seven | A five |
| 8 | g | text | Completează | I ___ a girl. | - | am, is, are | A am |
| 9 | l | audio | Ascultă și alege | Ce înseamnă? (RO) | say: `Good morning!` | Noapte bună!, Bună dimineața!, La revedere! | B Bună dimineața! |
| 10 | r | text+pasaj | Citește | Ce culoare are mingea? (RO) | pasaj: `The ball is red.` | roșie, albastră, verde | A roșie |
| 11 | g | text | Completează | This is ___ apple. | - | a, an, two | B an |
| 12 | r | text+pasaj | Citește | Cum se numește câinele? (RO) | pasaj: `I have got a dog. His name is Max.` | Tom, Max, Dog | B Max |

Distribuție: Vocabular 5 (1,2,4,6,7), Gramatică 2 (8,11), Ascultare 3 (3,5,9), Citit 2 (10,12).

### 2.3 MID (`9–10 ani`, `11–12 ani`, examen `Movers` și `Flyers`)
| # | Comp. | Tip | Instrucțiune | Prompt | Pasaj / text vorbit | Opțiuni | Corect |
|---|---|---|---|---|---|---|---|
| 1 | v | text | Alege răspunsul | The opposite of "big" is… | - | small, tall, long | A small |
| 2 | g | text | Completează | She ___ to school every day. | - | go, goes, going | B goes |
| 3 | l | audio | Ascultă și răspunde | How old is the brother? | say: `My brother is twelve years old.` | 12, 20, 2 | A 12 |
| 4 | g | text | Completează | Yesterday we ___ football. | - | play, played, playing | B played |
| 5 | r | text+pasaj | Citește | Has Tom got a cat? | `Tom has got a sister and a dog. He hasn’t got a cat.` | Yes, he has. / No, he hasn’t. / Yes, he is. | B |
| 6 | v | text | Alege răspunsul | You borrow books from a… | - | library, kitchen, garage | A library |
| 7 | l | audio | Ascultă și răspunde | When does the shop open? | say: `The shop opens at half past eight.` | 8:00, 8:30, 9:30 | B 8:30 |
| 8 | g | text | Completează | There ___ two apples on the table. | - | is, are, be | B are |
| 9 | g | text | Completează | An elephant is ___ than a mouse. | - | bigger, biggest, more big | A bigger |
| 10 | r | text+pasaj | Citește | How does Anna go to school? | `Anna gets up at seven. She has breakfast and then walks to school.` | by bus, on foot, by car | B on foot |
| 11 | l | audio | Ascultă și răspunde | What colour is the pencil? | say: `Can you pass me the blue pencil, please?` | black, brown, blue | C blue |
| 12 | v | text | Alege răspunsul | I’m hungry. I want to… | - | eat, sleep, swim | A eat |

Distribuție: Vocabular 3, Gramatică 4, Citit 2, Ascultare 3. Apostrofurile sunt `’` (U+2019) în fișier.

### 2.4 TEEN (`13–14 ani`, examen `A2 Key`)
| # | Comp. | Tip | Instrucțiune | Prompt | Pasaj / text vorbit | Opțiuni | Corect |
|---|---|---|---|---|---|---|---|
| 1 | g | text | Completează | I have lived here ___ 2020. | - | for, since, from | B since |
| 2 | g | text | Completează | If I ___ more time, I would travel. | - | had, have, will have | A had |
| 3 | l | audio | Ascultă și răspunde | What will the speaker do? | say: `I would rather stay in tonight. I am really tired.` | go out, stay at home, go to work | B stay at home |
| 4 | v | text | Alege răspunsul | To "give up" means to… | - | stop trying, start again, give a present | A stop trying |
| 5 | r | text+pasaj | Citește | What do you need to do? | `The museum is free on Sundays, but you need to book online.` | pay at the door, book online, go on Monday | B book online |
| 6 | g | text | Completează | She asked me where I ___. | - | lived, live, am living | A lived |
| 7 | l | audio | Ascultă și răspunde | What happened? | say: `The train to London has been delayed by twenty minutes.` | The train is cancelled. / The train is late. / The train left early. | B late |
| 8 | v | text | Alege răspunsul | Something you really need is… | - | essential, optional, unusual | A essential |
| 9 | g | text | Completează | This book ___ by millions of people. | - | has read, is reading, has been read | C has been read |
| 10 | r | text+pasaj | Citește | Now Jake… | `Jake used to hate maths, but now it’s his favourite subject.` | likes maths, hates maths, doesn’t study maths | A likes maths |
| 11 | g | text | Completează | You ___ wear a uniform at our school. It’s the rule. | - | might, could, must | C must |
| 12 | l | audio | Ascultă și răspunde | What time will they meet? | say: `Let’s meet outside the cinema at a quarter to seven.` | 6:45, 7:15, 7:45 | A 6:45 |

Distribuție: Vocabular 2, Gramatică 5, Citit 2, Ascultare 3.

### 2.5 Maparea bancă -> alegere
```js
const AGES = [{ l: '5–6 ani', b: YOUNG }, { l: '7–8 ani', b: YOUNG }, { l: '9–10 ani', b: MID }, { l: '11–12 ani', b: MID }, { l: '13–14 ani', b: TEEN }];
const EXAMS = [{ l: 'Starters', b: YOUNG }, { l: 'Movers', b: MID }, { l: 'Flyers', b: MID }, { l: 'A2 Key', b: TEEN }];
```
5–6 și 7–8 primesc aceleași 12 întrebări; 9–10 și 11–12 la fel; Movers și Flyers (examen) la fel. Nu există bancă separată pentru „Pre A1" sau „B1 Preliminary".

## 3. Scoring și recomandare

### 3.1 Punctaj
1 punct per răspuns corect, 0 la greșit, fără ponderi, fără penalizări, fără timp. `total` = 12 mereu.
```js
const score = s.ans.filter((a, i) => a === bank[i].a).length, total = bank.length, pct = score / total;
```
Scorul pe competență (`ok/nr` per `s`) este doar afișat; nu influențează nivelul recomandat.

### 3.2 Nivel recomandat (mode = level; `c` = indexul vârstei 0..4)
```js
const c = s.choice; let lvl;
if (c <= 1) lvl = c === 0 ? (pct >= .85 ? 'Pre A1' : 'Starters') : (pct < .5 ? 'Starters' : pct >= .85 ? 'Movers' : 'Pre A1');
else if (c <= 3) lvl = pct < .4 ? 'Pre A1' : pct < .7 ? 'Movers' : pct < .9 ? 'Flyers' : 'A2 Key';
else lvl = pct < .4 ? 'Flyers' : pct < .8 ? 'A2 Key' : 'B1 Preliminary';
kicker = 'Nivelul recomandat'; title = lvl; desc = LV[lvl];
```
Praguri traduse în corecte din 12: `.4` -> ≥5 (4/12=.333 <.4); `.5` -> ≥6; `.7` -> ≥9 (8/12=.667); `.8` -> ≥10 (9/12=.75); `.85` -> ≥11 (10/12=.833); `.9` -> ≥11 (11/12=.917).

| Vârstă | Rezultat |
|---|---|
| 5–6 ani | 0-10 corecte: Starters; 11-12: Pre A1 |
| 7–8 ani | 0-5: Starters; 6-10: Pre A1; 11-12: Movers |
| 9–10 și 11–12 ani | 0-4: Pre A1; 5-8: Movers; 9-10: Flyers; 11-12: A2 Key |
| 13–14 ani | 0-4: Flyers; 5-9: A2 Key; 10-12: B1 Preliminary |

Observații:
- Vârsta alege banca ȘI poziția rezultatelor posibile; nu există clamp explicit. Pe 12 întrebări nu apar egalități ambigue la praguri.
- 9–10 și 11–12 au aceeași logică și aceeași bancă; cel mai jos rezultat posibil pentru 9+ ani este Pre A1 (Starters apare doar la 5–8 ani).
- Un copil de 9–10 care știe mult primește A2 Key (nivelul de 13–14 ani); un copil de 13–14 foarte bun primește B1 Preliminary.

### 3.3 Mod examen
```js
title = pct >= .8 ? 'Pregătit pentru examen' : pct >= .5 ? 'Aproape pregătit' : 'Mai avem de lucru';
desc = pct >= .8 ? `Rezultat foarte bun. Un curs de pregătire ${ex} îl ajută să se simtă sigur în ziua examenului.` : pct >= .5 ? `Baza e solidă. Cu pregătire țintită pe competențele de mai jos, examenul ${ex} e la îndemână.` : `Recomandăm întâi grupa potrivită nivelului actual, apoi pregătirea pentru ${ex}.`;
```
`${ex}` = `Starters` | `Movers` | `Flyers` | `A2 Key`. Praguri: ≥10/12 Pregătit pentru examen; 6-9/12 Aproape pregătit; 0-5 Mai avem de lucru. Kicker: `Test pentru examenul Cambridge ${ex}`.

### 3.4 Descrieri nivel (`LV`, verbatim)
- Starters: `Primele cuvinte și propoziții, prin joc, cântece și povești.`
- Pre A1: `Vocabular de bază, citit și scris simplu, primele dialoguri.`
- Movers: `Propoziții complete, povestit la trecut și conversații scurte.`
- Flyers: `Texte mai lungi și gramatică explicată simplu, pregătire pentru examen.`
- A2 Key: `Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge.`
- B1 Preliminary: `Nivel peste A2 Key. Stabilim împreună la lecția demo programul potrivit.`

## 4. Diplomă

### 4.1 Pe ecran (previzualizare HTML, în cardul portocaliu `#ec6423` din rezultat)
- Câmp (text `#fff`): etichetă `Cui se decernează diploma?` (900, 18px); input placeholder `Numele și prenumele copilului` (fundal `#fff`, radius 14, padding `14px 16px`, 17px/800, text `#14224a`, width 100%). `onChange` actualizează `name`.
- Previzualizare: fundal `#fff5e6`, radius 16, padding `24px 20px`, centrat, gap 6, `border:3px dashed #ffc41f`:
  - stea 40px `#ffc41f`
  - `Diplomă` (Barlow Condensed 18px uppercase `#c4501a`)
  - `Se acordă lui / ei` (13px/700, opacity .75)
  - nume (900, 30px, lh 1; culoare `#14224a` dacă s-a scris, altfel `#b9a58a`; text implicit `Numele copilului`)
  - linie: mode=level `a finalizat testul de nivel`; mode=exam `a finalizat testul de pregătire Cambridge` (14px/700)
  - titlu rezultat (ex. `Flyers`) (900, 20px, `#c4501a`)
  - `Pregătire după metoda Cambridge` (12px/700 `#c4501a`)
  - `English Minds Academy · {data}` (12px/700, opacity .7); data = `new Date().toLocaleDateString('ro-RO')` (ex. `11.10.2026`)
  - două linii de semnătură (border-top 2px `#14224a`, 10px/700): `Semnătura profesorului` și `Director` (fără nume)
- Buton principal (100%, pill, text `#14224a`, padding 14, 900, 17px, shadow `0 4px 0 #c98f00`): cu nume: fundal `#ffc41f`, text `Descarcă diploma (PNG)`; fără nume: fundal `#f3e3c8`, text `Scrie numele ca să descarci` (click nu face nimic).
- Buton secundar (doar dacă există nume; `#fff`, pill, padding 13, 900, 16px): `Tipărește / salvează PDF (A4)`.

### 4.2 Producere (canvas -> PNG / print)
Nu există bibliotecă PDF. Se desenează un `<canvas>` 1600x1130 px (aprox. A4 landscape):
- Fundal: gradient liniar (0,0)->(1600,1130) `#ec6423` -> `#f39a2e`.
- Panou crem `#fff5e6`: `roundRect(70,70,1460,990, r48)`.
- Chenar punctat `#ffc41f`: `setLineDash([22,16])`, lineWidth 8, `roundRect(100,100,1400,930, r36)`.
- Stele (12 colțuri, raport interior .58, `#ffc41f`): centru (800,230) R70; (260,880) R40; (1340,880) R40.
- Texte (toate `textAlign:center`, font Nunito, fallback sans-serif):
  - `DIPLOMĂ`: 800 40px `#c4501a`, y=370
  - `Se acordă lui / ei`: 700 32px `#14224a`, y=420
  - nume copil: 900, început 104px, scade din 4 în 4 până la min 50px cât timp lățimea > 1250px; y=520
  - linia (`a finalizat testul de nivel` / `a finalizat testul de pregătire Cambridge`): 700 40px, y=590
  - titlu rezultat: 900 84px `#c4501a`, y=700
  - `${score} din ${total} răspunsuri corecte`: 800 34px `#14224a`, y=770
  - `Pregătire după metoda Cambridge`: 800 24px `#c4501a`, y=820
  - `English Minds Academy`: 900 44px `#14224a`, y=900
  - `Cluj-Napoca · ${data}`: 700 28px, y=950
  - două linii semnătură (3px `#14224a`): x 190-520 și 1080-1410, y=960; etichete 700 24px: `Semnătura profesorului` (x=355, y=995) și `Director` (x=1245, y=995)
- Diferență previzualizare vs PNG: PNG-ul are `DIPLOMĂ` (majuscule), scorul `X din 12 răspunsuri corecte` și `Cluj-Napoca`; previzualizarea HTML are `Diplomă`, fără scor și fără oraș.
- Descărcare PNG: `<a download="diploma-${nume cu spații->-}.png" href=canvas.toDataURL('image/png')>` .click(). Ex.: `diploma-Maria-Popescu.png`.
- „PDF": deschide fereastră nouă (`window.open('', '_blank')`) cu HTML: `<title>Diplomă ${nume}</title>`, `@page{size:A4 landscape;margin:0}`, `img{width:100%;height:100%;object-fit:contain}`, `onload` -> `setTimeout(()=>print(),200)`. Utilizatorul alege „Salvează ca PDF" în dialogul de tipărire. Dacă pop-up-ul e blocat, cade pe descărcarea PNG.
- Fontul Nunito în canvas depinde de faptul că e deja încărcat (Google Fonts); nu se așteaptă `document.fonts.ready`.
- Numele nu e trimis nicăieri (doar client-side), dar apare în mesajul WhatsApp.

## 5. Stiluri / dimensiuni (rezumat)
- Tokeni: crem `#fff5e6`, portocaliu `#ec6423`, `#f39a2e`, galben `#ffc41f`, umbră galbenă `#c98f00`, navy `#14224a`, text portocaliu `#c4501a`, umbră portocalie `#b8461a`, chip `#fff0d6`, margine card `#f0dcc0`, pistă bară rezultat `#f5e8d6`, Ema bg `#ef8a2a`, WhatsApp `#25d366`, verde Ascultare `#25a55f`, roșu cerc `#e53935`, buton dezactivat `#d9b9a0`, nume gol `#b9a58a`, buton diplomă gol `#f3e3c8`.
- Butoane „3D": opțiuni/alegeri `0 5px 0 #14224a` (border 3px navy); CTA portocaliu `0 5px 0 #b8461a`; galben `0 4px 0 #c98f00`; card mod `0 6px 0 #14224a`.
- Raze: card principal 32, card mod 26, opțiune 20, alegere vârstă 18, card rezultat 24, bare 99, pill 999.
- Responsive doar prin `clamp()` și `auto-fit/minmax` (nu există media queries în fișier): h1 mod `clamp(32px,5vw,48px)`, setup `clamp(28px,4.4vw,42px)`, întrebare `clamp(26px,4vw,40px)`, titlu rezultat `clamp(34px,5.5vw,56px)`, bulă `clamp(16px,2vw,19px)`, padding card `clamp(22px,4vw,44px)`. Grile: mod `minmax(260px,1fr)`, vârstă `minmax(130px,1fr)`, opțiuni `minmax(180px,1fr)`, rezultat `minmax(300px,1fr)`.
- Animații: niciuna definită (fără `transition`/`@keyframes`); doar `style-hover` (fundal `#ffc41f`) pe cardurile de mod și opțiuni, și `a:hover{opacity:.85}`. Bara de progres nu animă.
- Focus: nu există stiluri `:focus-visible` explicite.

## 6. Inconsistențe față de cele 5 niveluri ale site-ului
Site: Starters 5–6, Pre A1 7–8, Movers 9–10, Flyers 11–12, A2 Key 13–14.
1. Rezultat `B1 Preliminary` (13–14 ani cu ≥10/12): nivel inexistent pe site.
2. Nivelul recomandat nu coincide cu maparea fixă vârstă->nivel (intenționat, după scor): 5–6 poate primi Pre A1; 7–8 poate primi Starters sau Movers; 9–12 pot primi Pre A1/Movers/Flyers/A2 Key; 13–14 poate primi Flyers.
3. Mod examen: există doar Starters, Movers, Flyers, A2 Key (Pre A1 nu e examen Cambridge). Movers și Flyers au aceeași bancă (MID); 5–6 și 7–8 aceeași bancă (YOUNG), deci testul nu diferențiază fin între grupe adiacente.
4. Textul `Flyers` diferă ușor: Test `Texte mai lungi și gramatică explicată simplu, pregătire pentru examen.` vs Site v2 `Texte mai lungi, gramatică explicată simplu, pregătire pentru examen.`
5. Durată/lungime: Test complet `12 întrebări · 5 minute`; quiz scurt Site v2 `Test de nivel · 3 minute` cu 5 întrebări.
6. EMHeader leagă `Test de nivel` -> `EnglishMinds Test.dc.html` cu cheia `test`, dar enum-ul `active` din props conține doar `acasa|cursuri|metoda|tabere|blog` (`test` lipsește din enum; funcționează totuși prin comparație de string).
7. Pagina Test poate produce `B1 Preliminary`; quiz-ul scurt din Site v2 nu (clamp 0..4).
8. Mod examen nu mapează la un nivel recomandat; doar Pregătit / Aproape pregătit / Mai avem de lucru.
9. Întrebările de ascultare #3 și #5 din YOUNG au promptul în română, #9 are opțiuni în română; restul sunt în engleză.

## 7. Placeholder / note de designer
- Atribute DC `hint-placeholder-val`, `hint-placeholder-count`, `hint-size` = metadate de editor, nu conținut.
- Placeholder-e inputuri: `Numele și prenumele copilului` (Test); `Numele părintelui` și `Telefon` (Site v2).
- Valoare implicită când nu s-a scris nume: `Numele copilului` (previzualizare; diploma nu se poate descărca fără nume).
- Nu există text în paranteze drepte, `TODO` sau note de designer în fișierul Test.
- `Director` și `Semnătura profesorului` sunt etichete fără nume/semnătură reale.
- Ema apare doar ca fotografie circulară în antet; fără variante de expresie.
- În `continut-pagini.md` linkul „Test de nivel" din header este marcat „level test page, later feature".

## 8. Quiz scurt din Site v2 (pentru comparație)
Desktop `#test-2a` (gradient 115deg, padding `96px 64px`, grid `340px 1fr` gap 40) și mobil `#test-2b` (gradient 160deg, padding `48px 16px`).
- Eyebrow (Barlow Condensed 22px, mobil 18px): `Test de nivel · 3 minute`
- Link alb (desktop; `order:9`, 16px/900 `#c4501a`, pill): `Testul complet, cu audio și diplomă →` -> `EnglishMinds Test.dc.html`
- h2: desktop `Descoperă nivelul potrivit copilului tău` (52px); mobil `Descoperă nivelul potrivit` (30px)
- Ema (120px desktop / 60px mobil) cu bulă, text dinamic (mai jos).
- Card: fundal `#fff5e6`, radius 32 (mobil 26), padding 44 (mobil 22), min-height 460 (mobil 360), shadow desktop `0 20px 40px rgba(120,40,0,.25)`.
- Indicator progres: 5 stele (30px desktop / 22px mobil), `#ffc41f` pentru cele parcurse, `#f0dcc0` altfel; etichetă dreapta (800, 15px/13px, `#c4501a`): `PASUL 1: VÂRSTA` | `ÎNTREBAREA {n} / 5` | `REZULTAT`.
- Pas 1: titlu `Câți ani are copilul?` (38px / mobil 26px); butoane `5–6 ani`, `7–8 ani`, `9–10 ani`, `11–12 ani`, `13–14 ani` (desktop 5 coloane, mobil 2 coloane; 22px / 19px).
- Întrebări (hint Barlow 20px uppercase; text 48px / mobil 30px; 3 opțiuni A/B/C; desktop 3 coloane, mobil coloană). Cele 5 întrebări sunt identice pentru toate vârstele:

| # | Hint | Text | Opțiuni | Corect | Ema |
|---|---|---|---|---|---|
| 1 | Alege cuvântul potrivit | The sun is ___. | yellow, blue, green | A yellow | `Uită-te pe cer! De ce culoare e soarele?` |
| 2 | Completează propoziția | I ___ seven years old. | is, am, are | B am | `Despre tine vorbim: I ...` |
| 3 | Completează propoziția | She ___ a small cat. | have, having, has | C has | `Ea are o pisică mică.` |
| 4 | Completează propoziția | Where ___ you go yesterday? | did, do, does | A did | `Yesterday înseamnă ieri.` |
| 5 | Completează propoziția | If it rains, we ___ at home. | stayed, will stay, staying | B will stay | `Ultima! Dacă plouă, ce facem?` |

- Ema: intro `Hai să vedem ce știi deja! Alege vârsta.`; rezultat `Bravo! Am găsit grupa potrivită.`; după trimitere `Ne vedem la lecția demo!`
- Logică:
```js
let li = (s.base ?? 0) + (score >= 5 ? 1 : score <= 1 ? -1 : 0);
li = Math.max(0, Math.min(4, li));
const lvl = LEVELS[li];
```
  `base` = indexul vârstei alese (0..4); 5/5 = un nivel mai sus; 0-1 corecte = un nivel mai jos; 2-4 = nivelul vârstei; limitat 0..4 (fără B1). Fără bancă pe vârstă, fără audio, fără imagini, fără diplomă.
- LEVELS (verbatim): `Starters | 5–6 ani | Primele cuvinte și propoziții, prin joc, cântece și povești.`; `Pre A1 | 7–8 ani | Vocabular de bază, citit și scris simplu, primele dialoguri.`; `Movers | 9–10 ani | Propoziții complete, povestit la trecut și conversații scurte.`; `Flyers | 11–12 ani | Texte mai lungi, gramatică explicată simplu, pregătire pentru examen.`; `A2 Key | 13–14 ani | Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge.`
- Rezultat (desktop 2 coloane; mobil coloană): card navy `#14224a` cu `NIVELUL RECOMANDAT` (galben, 14px/12px, ls .06em), nume nivel (44px / 32px), vârstă (18px, `#ffc41f`), descriere; desktop `{score} din 5 răspunsuri corecte`; mobil `{vârstă} · {score}/5 corecte`.
- Lead după rezultat: desktop titlu `Rezervă lecția demo gratuită` (24px); inputuri `Numele părintelui`, `Telefon`; buton desktop `Rezervă locul acum`, mobil `Rezervă lecția demo` (`#ec6423`, shadow `0 5px 0 #b8461a`); link `Reia testul`.
- Trimitere (necesită nume ȘI telefon, altfel nu face nimic, fără mesaj de eroare): `https://wa.me/40775630680?text=` + `Bună ziua! Sunt ${nume} (${telefon}). Am făcut testul de nivel: grupa recomandată ${lvl.name} (${lvl.age}). Aș dori o lecție demo gratuită.`; apoi stare `done`.
- Stare `done`: desktop `Mulțumim, {nume}!` (48px, `#c4501a`) + `Ți-am deschis WhatsApp cu mesajul completat. Trimite-l și te contactăm pentru lecția demo la grupa {nivel}.`; mobil `Mulțumim, {nume}!` (32px) + `Te sunăm în curând pentru lecția demo la grupa {nivel}.` (mesaj diferit: promite apel, nu WhatsApp); link `Reia testul`.
- Diferențe față de pagina Test: 5 întrebări vs 12; fără audio/imagini; fără diplomă; lead cu nume părinte + telefon; recomandare = vârstă ±1; fără mod examen.
