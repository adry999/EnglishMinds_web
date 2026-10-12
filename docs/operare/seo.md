# SEO: cum apare site-ul în Google

Site-ul are deja titluri și descrieri pentru fiecare pagină, hartă a site-ului (`sitemap.xml`), date structurate (organizație, grupe, întrebări frecvente, articole, breadcrumbs) și `robots.txt`. Ce rămâne de făcut e în afara codului: conturile Google și prezența locală.

Așteptări realiste: Google indexează paginile în câteva zile până la câteva săptămâni. Poziția în căutări se construiește în luni, nu în zile. Pentru căutări locale („engleză pentru copii Cluj”) contează la fel de mult profilul Google Business ca site-ul.

## 1. Înainte de lansare

Staging-ul și previzualizarea au `noindex` și nu se trimit nicăieri. Tot ce urmează se face pe domeniul de producție, după lansare.

## 2. Google Search Console

1. Intră pe <https://search.google.com/search-console> cu contul Google al firmei (vezi `conturi.md`).
2. „Add property" → tipul „Domain" → `englishminds.ro`. Google dă o înregistrare TXT.
3. În contul de la registrar/DNS adaugă înregistrarea TXT la domeniu și apasă „Verify". Poate dura câteva minute.
4. Variantă fără DNS: tipul „URL prefix" cu `https://englishminds.ro/`, metoda „HTML tag". Copiezi doar valoarea din `content="…"` și o pui în `src/shared/content/site.ts`, în `seo.googleSiteVerification`, apoi publici site-ul și apeși „Verify". Câmpul gol = nu se afișează nimic.
5. Sitemaps → adaugă `https://englishminds.ro/sitemap.xml` → „Submit". Starea trebuie să devină „Success".
6. URL Inspection: pentru fiecare dintre cele 8 pagini principale, lipește adresa și apasă „Request indexing":
   - `/`, `/grupe/`, `/metoda-cambridge/`, `/test-de-nivel/`, `/lectie-demo/`, `/tabere/`, `/blog/` și primul articol publicat.
   Se pot trimite doar câteva pe zi; continuă a doua zi.

## 3. Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → „Import from Google Search Console". Aduce proprietatea și harta site-ului fără pași în plus.
2. Variantă manuală: cod de verificare în `seo.bingSiteVerification` din `site.ts` (valoarea din `content` a metei `msvalidate.01`).
3. Bing alimentează și alte motoare de căutare și asistenți, deci merită cele 5 minute.

## 4. Google Business Profile (cel mai important pentru căutările locale)

1. <https://business.google.com> → creează profilul.
2. Categoria principală: „Școală de limbi străine". Categorii secundare: „Centru de pregătire educațională" sau „Școală de limbi străine pentru copii", dacă apar în listă.
3. Numele, adresa și telefonul exact ca pe site (consecvență NAP): `English Minds Academy`, `Str. Observatorului 90, et.2, Cluj-Napoca`, `+40 775 630 680`. O diferență mică (de ex. „Str." față de „Strada") slăbește semnalul.
4. Program, descriere (scurtă, fără exagerări), zona deservită: Cluj-Napoca.
5. Fotografii reale: sala, copii la lecție (doar cu acordul părinților), echipa, intrarea.
6. Linkul către site: `https://englishminds.ro/lectie-demo/?utm_source=google&utm_medium=organic&utm_campaign=business-profile`. Așa vezi în GA4 câte rezervări aduce profilul.
7. Recenzii: cere părinților mulțumiți o recenzie (trimite-le linkul scurt din profil). Răspunde la fiecare, inclusiv la cele critice, politicos.
8. Verificarea profilului se face prin poștă sau video; începe-o din timp.

## 5. Directoare și linkuri către site

Linkurile de la site-uri serioase din Cluj ajută mai mult decât orice truc tehnic.

- Site-uri și grupuri pentru părinți din Cluj (articole de ghid „activități pentru copii”, calendare de evenimente).
- Școli și grădinițe partenere: o pagină „parteneri” cu link către `englishminds.ro`.
- Directoare locale de afaceri și educație (cu aceleași nume, adresă și telefon).
- Instagram: linkul din bio către site, cu UTM (`?utm_source=instagram&utm_medium=social`).

Evită schemele de cumpărat linkuri: pot dăuna.

## 6. Plan de conținut pentru blog

Articole scurte, utile, scrise pentru părinți, fiecare cu o căutare clară în minte. Fiecare se termină cu trimiterea la testul de nivel și la lecția demo (apare automat în „Sfatul Emei").

| Subiect | Căutarea vizată |
|---|---|
| De la ce vârstă începe un copil engleza | „engleză pentru copii 5 ani" |
| Cum alegi un curs de engleză pentru copii în Cluj | „curs de engleză pentru copii Cluj" |
| Ce este examenul Cambridge Starters și cum se pregătește | „examen Cambridge Starters" |
| Starters, Movers, Flyers: ce înseamnă fiecare nivel | „Cambridge Starters Movers Flyers" |
| Cum îți ajuți copilul cu engleza acasă, fără teme în plus | „cum învață un copil engleza acasă" |
| Cât durează până vorbește copilul engleza | „cât durează să învețe engleza un copil" |
| Engleză prin joc: 5 activități de 10 minute | „jocuri în engleză pentru copii" |
| Ce este nivelul A2 Key și când e potrivit | „A2 Key pentru copii" |
| Tabără de vară în engleză: ce să cauți | „tabără de engleză pentru copii Cluj" |
| Cum motivezi un copil care nu vrea să învețe engleza | „copilul nu vrea să învețe engleza" |

Reguli: un articol, o întrebare; titlu natural, fără repetarea cuvintelor-cheie; 600–1000 de cuvinte; o fotografie reală. Un articol pe lună e suficient. Cum se adaugă: `continut.md`.

## 7. Ce urmărești lunar (15 minute)

- Search Console → Pages: câte pagini sunt indexate; orice „Not indexed" neașteptat se verifică în URL Inspection.
- Performance: interogările, clicurile, afișările, CTR-ul și poziția medie. Un CTR mic pe o pagină cu multe afișări înseamnă că titlul sau descrierea trebuie rescrise.
- Google Business Profile → Performance: apeluri, cereri de direcții, click-uri pe site.
- GA4: rezervările (`generate_lead`) pe sursă (organic, Business Profile, Instagram).
- Recenzii noi la care nu ai răspuns.

## 8. Când modifici titluri sau descrieri

Titlurile se pun în fiecare pagină din `src/pages/`. Regula: titlul cu tot cu „· English Minds Academy" până în 65 de caractere, descrierea între 120 și 160, fiecare unică. Verificarea automată (`npm run test:dist`) o confirmă.
