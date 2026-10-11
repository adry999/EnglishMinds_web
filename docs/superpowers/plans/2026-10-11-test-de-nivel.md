# Test de nivel + diplomă (etapa 3) — Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pagina `/test-de-nivel/` cu testul de nivel și testul pentru examen Cambridge (12 întrebări adaptate vârstei, cu audio prin `speechSynthesis`), rezultat pe competențe, diplomă PNG / PDF generată în browser și pasul următor spre lecția demo pe WhatsApp.

**Architecture:**
- Feature nou `src/features/level-test/`:
  - `data/` conține cele 3 bănci de întrebări;
  - `model/` conține logica pură: selectarea băncii, scorul, recomandarea, starea testului, textele Emei, textele diplomei;
  - `diploma/` desenează diploma pe `<canvas>` și o exportă;
  - `ui/` conține `<level-test>`, un Web Component în light DOM. Elementul înlocuiește un fallback randat de Astro, care funcționează și fără JS.
- Comunicarea spre alte feature-uri se face prin evenimentul `level-test.completed` din `src/shared/contracts/domain-events.ts`. Formularul din etapa 4 îl va asculta.
- Pasul 1 unifică stilurile de buton repetate în etapa 2 în `shared/ui/Button`. Testul folosește aceleași clase `.button`.

**Tech Stack:** Astro 7.3.8, TypeScript, Web Components, Canvas 2D, Web Speech API, Vitest 5 + happy-dom.

**Spec:** `docs/superpowers/specs/2026-10-09-site-englishminds-design.md` (§3, §4, §5 rândul `/test-de-nivel/`, §6 „nu se stochează”, §8 `<level-test>`, §9).
**Design extras:** `docs/design/test-de-nivel.md` (texte exacte, cele 36 de întrebări, praguri, diplomă, stiluri). Fiecare task îl citează.
**Convenții:** `.claude/skills/project-conventions/SKILL.md`.

## Decizii luate în acest plan (de confirmat la review)

1. **„B1 Preliminary” rămâne rezultat posibil** pentru 13–14 ani cu cel puțin 10 răspunsuri corecte din 12, ca în design. Pagina Metoda îl prezintă deja ca „următorul pas”. Descrierea e cea din design.
2. **Descrierile nivelurilor vin din `site.levels[].summary`.** Pentru Flyers asta înseamnă textul site-ului, nu varianta ușor diferită din Test.
3. **Audio fără `speechSynthesis`:** în loc de tăcerea din design, apar textul englez și mesajul „Browserul tău nu poate reda sunetul. Citește propoziția:” (spec §8).
4. **Bara de progres arată întrebarea curentă**, de la 1/12 la 12/12, cu `role="progressbar"`. În design nu ajungea niciodată la 100%.
5. **Textul Emei la întrebări:**
   - la audio: „Apasă „Ascultă din nou” și alege ce ai auzit.” (în design nu se potrivea cu eticheta butonului);
   - la prima întrebare fără audio: „Hai să începem! Alege răspunsul potrivit.”;
   - la celelalte întrebări fără audio rămâne „Super! Mergem mai departe.”.
6. **Contrast:**
   - butonul WhatsApp are text bleumarin pe verde;
   - eticheta „Cui se decernează diploma?” are 19px/900 pe portocaliu;
   - textele mici portocalii folosesc `--color-text-accent` (#b8461a), nu #c4501a.
7. **Butonul „Începe testul” e `disabled` real** până se alege vârsta sau examenul, nu doar cu aspect de dezactivat.
8. **Fereastra de tipărire / PDF e construită prin DOM** (`textContent`, `createElement`), nu prin `document.write` cu HTML concatenat. Numele copilului nu poate injecta cod (spec §8).
9. **Diploma așteaptă `document.fonts.ready`** înainte de desen (spec §8).
10. **Fără JavaScript**, `<level-test>` arată titlul testului și un mesaj cu buton WhatsApp. Testul în sine are nevoie de JS.
11. **Evenimentul `level-test.completed`** are payload-ul `{ mode, level, score, total }`. Spec-ul avea doar `{ level, score, total }`; `mode` e adăugat ca formularul din etapa 4 să știe dacă `level` e un nivel recomandat sau un examen. Evenimentul nu conține numele copilului (spec §4).
12. **Banca de întrebări e în `data/questions.ts`**, nu `.json`. Tipurile verifică la compilare că fiecare întrebare are exact 3 opțiuni și un răspuns valid.
13. **Fără formular pe pagina Test în această etapă.** Formularul `<lead-form source="test">` vine în etapa 4. Banda de la rezultat folosește butonul „Trimite rezultatul pe WhatsApp” din design.
14. **Stilurile de buton din paginile etapei 2 se mută în `shared/ui/Button`** (Task 1), cum a cerut recenzia finală a etapei 2.

## Global Constraints

- Toate constrângerile din planurile `2026-10-11-fundatie.md` și `2026-10-11-pagini-statice.md` rămân valabile:
  - aliasuri, fără `../../`;
  - linkuri interne terminate în `/`;
  - diacritice ș ț cu virgulă;
  - apostrof tipografic `’`;
  - mobil implicit 360px, apoi 768px și 1100px, fără derulare orizontală.
- Contrast:
  - pe portocaliu (`--color-orange` sau degrade), textul are ≥ 19px și grosime ≥ 700, sau ≥ 24px;
  - textul portocaliu sub 24px apare doar pe alb, crem sau piersică și folosește `--color-text-accent`;
  - nu există text `#b8461a` sub 24px pe galben;
  - textul butonului WhatsApp e bleumarin.
- Focus vizibil peste tot. Inelul bleumarin global nu se vede pe bleumarin, așa că acolo se folosește galben (`--color-sun`) sau alb.
- `model/` nu importă DOM, Astro sau rețea. `diploma/` și `ui/` pot folosi DOM. `model/` nu importă din `diploma/` sau `ui/` (regula `model-must-be-pure`).
- Nimic din test nu se trimite la server.
  - Numele copilului rămâne în browser.
  - Numele apare doar pe diplomă și în mesajul WhatsApp pe care părintele îl trimite el însuși.
  - Răspunsurile nu se stochează (spec §6).
- Textul utilizatorului (numele copilului) intră în DOM doar prin `textContent` sau atribute, niciodată prin `innerHTML`.
- Texte vizibile copiate exact din `docs/design/test-de-nivel.md`, cu excepțiile din „Decizii”.
- Întrebările sunt copiate exact, inclusiv `’` (U+2019) din `hasn’t`, `I’m`, `it’s`, `It’s`, `Let’s`.

## Review Focus

1. **Pragurile de recomandare la limită.** De exemplu 10 față de 11 corecte la 5–6 ani, sau 4 față de 5 la 13–14 ani. Un prag greșit trimite copilul la grupa greșită. Task 3 testează fiecare prag ±1 (spec §9).
2. **Browser fără `speechSynthesis`, sau cu voce care eșuează.** Întrebarea audio trebuie să rămână rezolvabilă, iar eroarea nu are voie să fie înghițită în tăcere. Task 6 are teste.
3. **Nume de copil neobișnuit:** foarte lung, cu diacritice, cu `<script>`, cu spații multiple sau gol. Diploma, numele fișierului și fereastra de tipărire trebuie să rămână corecte și sigure. Testele sunt în Task 4 și Task 5.
4. **Pop-up blocat sau canvas indisponibil.** Părintele trebuie să primească descărcarea PNG sau un mesaj clar, nu un buton care nu face nimic. Testele sunt în Task 5 și Task 6.
5. **Navigarea cu tastatura și cititorul de ecran:**
   - la fiecare pas, focusul trece pe titlul nou;
   - opțiunile sunt butoane cu numele răspunsului;
   - progresul e anunțat prin `role="progressbar"`.
   Task 6 are teste.

---

### Task 1: Butoane comune — `shared/ui/Button` folosit peste tot

**Files:**
- Modify: `src/shared/ui/Button.astro`, `src/shared/ui/Button.css`
- Create: `src/shared/ui/Button.test.ts`
- Modify:
  - secțiuni: `src/sections/home/HomeHero.astro` + `.css`, `src/sections/home/TestTeaser.astro` + `.css`, `src/sections/grupe/LevelSection.astro` + `.css`, `src/sections/grupe/TestBand.astro` + `.css`, `src/sections/metoda/ParentBenefits.astro` + `.css`, `src/sections/tabere/TabereHero.astro` + `.css`, `src/sections/tabere/CampIncludes.astro` + `.css`;
  - blog: `src/features/blog/ui/EmaTip.astro` + `EmaTip.css`;
  - pagini: `src/pages/404.astro`.

**Interfaces:**
- Produces:
  - `<Button href: string, variant?: 'primary' | 'sun' | 'navy' | 'outline' | 'outline-light' | 'whatsapp', class?: string>`;
  - clasele globale `.button` și `.button--<variant>`, folosite și de `<level-test>` (Task 6) pe elemente `<button>`.

- [ ] **Step 1: Scrie testul care pică**

`src/shared/ui/Button.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button from './Button.astro';

async function render(props: Record<string, unknown>, label = 'Apasă') {
  const container = await AstroContainer.create();
  return container.renderToString(Button, { props, slots: { default: label } });
}

describe('Button', () => {
  it('renders a primary link by default', async () => {
    expect(await render({ href: '/grupe/' })).toMatch(/<a class="button button--primary" href="\/grupe\/">Apasă<\/a>/);
  });

  it.each(['sun', 'navy', 'outline', 'outline-light', 'whatsapp'])('supports the %s variant', async (variant) => {
    expect(await render({ href: '/', variant })).toContain(`button--${variant}`);
  });

  it('passes an extra class through for layout', async () => {
    expect(await render({ href: '/', class: 'home-hero__primary' })).toMatch(
      /class="button button--primary home-hero__primary"/,
    );
  });
});
```

Run: `npx vitest run src/shared/ui/Button.test.ts`
Expected: FAIL (variantele `navy`, `outline-light` și prop-ul `class` nu există).

- [ ] **Step 2: Extinde `Button`**

`src/shared/ui/Button.astro`:

```astro
---
import './Button.css';

interface Props {
  href: string;
  variant?: 'primary' | 'sun' | 'navy' | 'outline' | 'outline-light' | 'whatsapp';
  class?: string;
}

const { href, variant = 'primary', class: className } = Astro.props;
---
<a class:list={['button', `button--${variant}`, className]} href={href}><slot /></a>
```

`src/shared/ui/Button.css`. Păstrează regulile existente, setează `min-height: 52px` pe `.button` și adaugă:

```css
.button:disabled,
.button[aria-disabled='true'] {
  cursor: not-allowed;
  background: var(--color-photo-bg);
  color: var(--color-navy);
  box-shadow: none;
}

.button--navy {
  background: var(--color-navy);
  color: var(--color-white);
  box-shadow: 0 5px 0 rgb(0 0 0 / 0.25);
}

.button--navy:focus-visible {
  outline-color: var(--color-orange);
}

.button--outline-light {
  color: var(--color-white);
  border: 3px solid currentColor;
}

.button--outline-light:focus-visible {
  outline-color: var(--color-white);
}

button.button {
  border: 0;
  cursor: pointer;
}

button.button--outline,
button.button--outline-light {
  border: 3px solid currentColor;
  background: transparent;
}
```

Run: `npx vitest run src/shared/ui/Button.test.ts`
Expected: PASS

- [ ] **Step 3: Folosește `Button` în locul CTA-urilor scrise de mână**

| Fișier | CTA | Variantă |
|---|---|---|
| `HomeHero.astro` | „Descoperă nivelul copilului” | `sun` |
| `HomeHero.astro` | „Lecție demo gratuită” | `outline-light` |
| `TestTeaser.astro` | „Începe testul” | `sun` |
| `LevelSection.astro` | „Rezervă lecția demo gratuită” | `primary` |
| `LevelSection.astro` | „Nu știi nivelul? Fă testul” | `outline` |
| `TestBand.astro` | „Fă testul de nivel” | `navy` |
| `ParentBenefits.astro` | „Află nivelul copilului” | `primary` |
| `TabereHero.astro` | „Anunță-mă când încep înscrierile” | `navy` |
| `CampIncludes.astro` | „Scrie-ne pe WhatsApp” | `whatsapp` |
| `EmaTip.astro` | „Fă testul” | `sun` |
| `404.astro` | „Mergi la pagina principală” | `primary` |
| `404.astro` | „Fă testul de nivel” | `outline` |

Pentru fiecare rând:
- înlocuiește `<a class="…">` cu `<Button href=… variant=… class="<clasa veche>">`, ca să păstreze `href`-ul și textul exact;
- din CSS-ul secțiunii șterge culoarea, fundalul, umbra, padding-ul, raza, fontul, `min-height` și `display` ale CTA-ului;
- păstrează doar ce ține de așezare: `align-self`, `width: 100%` pe mobil, `margin`, `justify-self`;
- păstrează inelele de focus speciale, de exemplu cel galben al CTA-ului WhatsApp din cardul bleumarin (`CampIncludes.css`), cu selectorul pe clasa păstrată;
- `src/features/blog/ui/EmaTip.astro` importă `@shared/ui/Button.astro`, ceea ce e permis unui feature.

Testele existente ale secțiunilor verifică `href` și textele. Trebuie să rămână verzi fără modificări. Dacă un test verifică o clasă veche, clasa e păstrată prin `class=`.

- [ ] **Step 4: Verifică**

Run: `npm run verify`
Expected: verde.

Run: `git grep -n "box-shadow: 0 [56]px 0 var(--color-\(orange\|sun\)-shadow)" -- src/sections src/features src/pages`
Expected: nicio potrivire. Umbrele de buton rămân doar în `Button.css`.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/ui src/sections src/features/blog/ui src/pages/404.astro
git commit -m "refactor(shared-ui): use the shared Button for every call to action"
```

---

### Task 2: Contractul de eveniment și băncile de întrebări

**Files:**
- Create: `src/shared/contracts/domain-events.ts`, `src/shared/contracts/domain-events.test.ts`
- Create: `src/features/level-test/model/types.ts`, `src/features/level-test/data/questions.ts`, `src/features/level-test/data/questions.test.ts`

**Interfaces:**
- Produces, în `domain-events.ts`:
  - `LEVEL_TEST_COMPLETED = 'level-test.completed'`;
  - `type LevelTestCompletedDetail = { mode: 'level' | 'exam'; level: string; score: number; total: number }`;
  - `createLevelTestCompleted(detail): CustomEvent<LevelTestCompletedDetail>`, cu `bubbles: true` și `composed: true`.
- Produces, în `types.ts`: `SKILLS`, `type Skill`, `SKILL_LABELS`, `type Question` (uniune după `kind`: `'text' | 'color' | 'count' | 'audio'`), `type Bank`.
- Produces, în `questions.ts`: `YOUNG`, `MID`, `TEEN` (fiecare `Bank` cu 12 întrebări), `AGE_BANKS`, `EXAMS`.

- [ ] **Step 1: Scrie testele care pică**

`src/shared/contracts/domain-events.test.ts`:

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createLevelTestCompleted, LEVEL_TEST_COMPLETED } from './domain-events';

describe('domain events', () => {
  it('creates a bubbling level-test.completed event without personal data', () => {
    const event = createLevelTestCompleted({ mode: 'level', level: 'movers', score: 7, total: 12 });
    expect(event.type).toBe(LEVEL_TEST_COMPLETED);
    expect(event.bubbles).toBe(true);
    expect(event.detail).toEqual({ mode: 'level', level: 'movers', score: 7, total: 12 });
  });
});
```

`src/features/level-test/data/questions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../model/types';
import { AGE_BANKS, EXAMS, MID, TEEN, YOUNG } from './questions';

describe('question banks', () => {
  it.each([
    ['YOUNG', YOUNG],
    ['MID', MID],
    ['TEEN', TEEN],
  ])('%s has 12 questions with 3 options and a valid answer', (_name, bank) => {
    expect(bank).toHaveLength(12);
    for (const question of bank) {
      expect(question.options).toHaveLength(3);
      expect([0, 1, 2]).toContain(question.answer);
      expect(SKILLS).toContain(question.skill);
    }
  });

  it('has three listening questions per bank, each with something to say', () => {
    for (const bank of [YOUNG, MID, TEEN]) {
      const audio = bank.filter((question) => question.kind === 'audio');
      expect(audio).toHaveLength(3);
      for (const question of audio) expect(question.say.length).toBeGreaterThan(2);
    }
  });

  it('maps ages and exams to banks like the design', () => {
    expect(AGE_BANKS).toEqual([YOUNG, YOUNG, MID, MID, TEEN]);
    expect(EXAMS.map((exam) => exam.name)).toEqual(['Starters', 'Movers', 'Flyers', 'A2 Key']);
    expect(EXAMS.map((exam) => exam.bank)).toEqual([YOUNG, MID, MID, TEEN]);
  });

  it('keeps typographic apostrophes', () => {
    const texts = [...MID, ...TEEN].flatMap((q) => [q.prompt, ...q.options, 'passage' in q ? (q.passage ?? '') : '']);
    expect(texts.join(' ')).not.toContain("'");
  });
});
```

Run: `npx vitest run src/shared/contracts src/features/level-test`
Expected: FAIL (modulele nu există).

- [ ] **Step 2: Contractul**

`src/shared/contracts/domain-events.ts`:

```ts
export const LEVEL_TEST_COMPLETED = 'level-test.completed';

export type LevelTestCompletedDetail = {
  readonly mode: 'level' | 'exam';
  readonly level: string;
  readonly score: number;
  readonly total: number;
};

export function createLevelTestCompleted(detail: LevelTestCompletedDetail): CustomEvent<LevelTestCompletedDetail> {
  return new CustomEvent(LEVEL_TEST_COMPLETED, { detail, bubbles: true, composed: true });
}
```

- [ ] **Step 3: Tipurile**

`src/features/level-test/model/types.ts`:

```ts
export const SKILLS = ['vocabular', 'gramatica', 'citit', 'ascultare'] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Readonly<Record<Skill, string>> = {
  vocabular: 'Vocabular',
  gramatica: 'Gramatică',
  citit: 'Citit',
  ascultare: 'Ascultare',
};

type QuestionBase = {
  readonly skill: Skill;
  readonly instruction: string;
  readonly prompt: string;
  readonly options: readonly [string, string, string];
  readonly answer: 0 | 1 | 2;
};

export type Question =
  | (QuestionBase & { readonly kind: 'text'; readonly passage?: string })
  | (QuestionBase & { readonly kind: 'color'; readonly color: string })
  | (QuestionBase & { readonly kind: 'count'; readonly count: number })
  | (QuestionBase & { readonly kind: 'audio'; readonly say: string });

export type Bank = readonly Question[];
```

- [ ] **Step 4: Băncile**

`src/features/level-test/data/questions.ts` conține cele 36 de întrebări din `docs/design/test-de-nivel.md` §2.2–2.4, copiate exact.

Corespondențe:

| În design | În cod |
|---|---|
| competență `v` / `g` / `r` / `l` | `vocabular` / `gramatica` / `citit` / `ascultare` |
| tip `text+pasaj` | `kind: 'text'` cu `passage` |
| tip `color` | `kind: 'color'` cu `color` (hex-ul din design) |
| tip `count` | `kind: 'count'` cu `count` |
| tip `audio` | `kind: 'audio'` cu `say` |
| opțiunile A/B/C | `options` în aceeași ordine |
| răspunsul corect | `answer`: indexul 0, 1 sau 2 |

Începutul fișierului (completează la fel restul întrebărilor):

```ts
import type { Bank } from '../model/types';

export const YOUNG: Bank = [
  {
    skill: 'vocabular',
    kind: 'color',
    instruction: 'Privește imaginea',
    prompt: 'What colour is it?',
    color: '#e53935',
    options: ['red', 'blue', 'green'],
    answer: 0,
  },
  {
    skill: 'vocabular',
    kind: 'count',
    instruction: 'Numără stelele',
    prompt: 'How many stars?',
    count: 3,
    options: ['two', 'three', 'four'],
    answer: 1,
  },
  {
    skill: 'ascultare',
    kind: 'audio',
    instruction: 'Ascultă și alege',
    prompt: 'Ce cuvânt ai auzit?',
    say: 'cat',
    options: ['cat', 'dog', 'car'],
    answer: 0,
  },
  // … întrebările 4–12 din §2.2
];

export const MID: Bank = [
  // cele 12 întrebări din §2.3
];

export const TEEN: Bank = [
  // cele 12 întrebări din §2.4
];

export const AGE_BANKS: readonly Bank[] = [YOUNG, YOUNG, MID, MID, TEEN];

export const EXAMS = [
  { name: 'Starters', slug: 'starters', bank: YOUNG },
  { name: 'Movers', slug: 'movers', bank: MID },
  { name: 'Flyers', slug: 'flyers', bank: MID },
  { name: 'A2 Key', slug: 'a2-key', bank: TEEN },
] as const;
```

Opțiunile de la MID #5 și TEEN #7 sunt propoziții întregi, de exemplu `'Yes, he has.'`, `'No, he hasn’t.'`, `'Yes, he is.'`. Prompturile marcate „(RO)” în design sunt în română.

- [ ] **Step 5: Verifică și commit**

Run: `npx vitest run src/shared/contracts src/features/level-test`
Expected: PASS (5 teste)

Run: `npm run verify`
Expected: verde

```powershell
git add src/shared/contracts src/features/level-test
git commit -m "feat(level-test): add question banks and the level-test.completed event"
```

---

### Task 3: Modelul — banca, scorul, recomandarea, descrierea rezultatului

**Files:**
- Create: `src/features/level-test/model/select-bank.ts`, `score-test.ts`, `recommend-level.ts`, `describe-result.ts`, `result-message.ts`
- Test: `src/features/level-test/model/scoring.test.ts`

**Interfaces:**
- Consumes: `Bank`, `Skill`, `SKILLS` (Task 2); `AGE_BANKS`, `EXAMS` (Task 2); `site.levels`, `AGE_GROUPS`, `site.contact.whatsappUrl`.
- Produces:
  - `type Mode = 'level' | 'exam'`;
  - `selectBank(mode: Mode, choice: number): Bank`;
  - `choiceLabels(mode: Mode): readonly string[]`;
  - `scoreTest(bank: Bank, answers: readonly number[]): TestScore`, unde `TestScore = { score; total; bySkill: Record<Skill, { correct; total }> }`;
  - `type RecommendedLevel = LevelSlug | 'b1-preliminary'`;
  - `recommendLevel(ageIndex: number, score: number, total: number): RecommendedLevel`;
  - `type ExamReadiness = 'ready' | 'almost' | 'not-yet'`;
  - `examReadiness(score: number, total: number): ExamReadiness`;
  - `describeResult(mode: Mode, choice: number, score: number, total: number): ResultSummary`, unde `ResultSummary = { kicker; title; description; level: string }`;
  - `resultWhatsappUrl(summary: ResultSummary, score: number, total: number, childName: string): string`.

Pragurile sunt cele din design (`docs/design/test-de-nivel.md` §3.2–3.3), calculate pe procent cu numere întregi: `score * 100 >= percent * total`.

- [ ] **Step 1: Scrie testul care pică**

`src/features/level-test/model/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MID, TEEN, YOUNG } from '../data/questions';
import { describeResult } from './describe-result';
import { examReadiness, recommendLevel } from './recommend-level';
import { resultWhatsappUrl } from './result-message';
import { scoreTest } from './score-test';
import { choiceLabels, selectBank } from './select-bank';

const correct = (bank: typeof YOUNG) => bank.map((question) => question.answer);

describe('selectBank', () => {
  it('picks the bank by age and by exam', () => {
    expect(selectBank('level', 0)).toBe(YOUNG);
    expect(selectBank('level', 3)).toBe(MID);
    expect(selectBank('level', 4)).toBe(TEEN);
    expect(selectBank('exam', 2)).toBe(MID);
    expect(selectBank('exam', 3)).toBe(TEEN);
  });

  it('rejects a choice outside the list', () => {
    expect(() => selectBank('exam', 4)).toThrow(RangeError);
    expect(() => selectBank('level', -1)).toThrow(RangeError);
  });

  it('labels the choices', () => {
    expect(choiceLabels('level')).toEqual(['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani']);
    expect(choiceLabels('exam')).toEqual(['Starters', 'Movers', 'Flyers', 'A2 Key']);
  });
});

describe('scoreTest', () => {
  it('counts correct answers overall and per skill', () => {
    const result = scoreTest(YOUNG, correct(YOUNG));
    expect(result.score).toBe(12);
    expect(result.total).toBe(12);
    expect(result.bySkill).toEqual({
      vocabular: { correct: 5, total: 5 },
      gramatica: { correct: 2, total: 2 },
      citit: { correct: 2, total: 2 },
      ascultare: { correct: 3, total: 3 },
    });
  });

  it('treats missing or wrong answers as incorrect', () => {
    const answers = correct(MID).map((answer, index) => (index < 3 ? (answer + 1) % 3 : answer)).slice(0, 10);
    expect(scoreTest(MID, answers).score).toBe(7);
  });
});

describe('recommendLevel (12 questions)', () => {
  it.each([
    [0, 10, 'starters'],
    [0, 11, 'pre-a1'],
    [1, 5, 'starters'],
    [1, 6, 'pre-a1'],
    [1, 10, 'pre-a1'],
    [1, 11, 'movers'],
    [2, 4, 'pre-a1'],
    [2, 5, 'movers'],
    [2, 8, 'movers'],
    [2, 9, 'flyers'],
    [3, 10, 'flyers'],
    [3, 11, 'a2-key'],
    [4, 4, 'flyers'],
    [4, 5, 'a2-key'],
    [4, 9, 'a2-key'],
    [4, 10, 'b1-preliminary'],
    [0, 0, 'starters'],
    [4, 12, 'b1-preliminary'],
  ])('age %i with %i correct → %s', (age, score, level) => {
    expect(recommendLevel(age, score, 12)).toBe(level);
  });

  it('rejects an unknown age index', () => {
    expect(() => recommendLevel(5, 6, 12)).toThrow(RangeError);
  });
});

describe('examReadiness (12 questions)', () => {
  it.each([
    [5, 'not-yet'],
    [6, 'almost'],
    [9, 'almost'],
    [10, 'ready'],
  ])('%i correct → %s', (score, readiness) => {
    expect(examReadiness(score, 12)).toBe(readiness);
  });
});

describe('describeResult', () => {
  it('describes a recommended level with the site summary', () => {
    expect(describeResult('level', 2, 7, 12)).toEqual({
      kicker: 'Nivelul recomandat',
      title: 'Movers',
      description: 'Propoziții complete, povestit la trecut și conversații scurte.',
      level: 'movers',
    });
  });

  it('describes B1 Preliminary', () => {
    expect(describeResult('level', 4, 11, 12)).toMatchObject({
      title: 'B1 Preliminary',
      description: 'Nivel peste A2 Key. Stabilim împreună la lecția demo programul potrivit.',
      level: 'b1-preliminary',
    });
  });

  it('describes exam readiness', () => {
    expect(describeResult('exam', 1, 10, 12)).toEqual({
      kicker: 'Test pentru examenul Cambridge Movers',
      title: 'Pregătit pentru examen',
      description: 'Rezultat foarte bun. Un curs de pregătire Movers îl ajută să se simtă sigur în ziua examenului.',
      level: 'movers',
    });
    expect(describeResult('exam', 3, 6, 12).title).toBe('Aproape pregătit');
    expect(describeResult('exam', 0, 2, 12).description).toBe(
      'Recomandăm întâi grupa potrivită nivelului actual, apoi pregătirea pentru Starters.',
    );
  });
});

describe('resultWhatsappUrl', () => {
  const summary = describeResult('level', 2, 7, 12);

  it('builds the design message with the child name', () => {
    const url = resultWhatsappUrl(summary, 7, 12, '  Maria Popescu ');
    expect(url.startsWith('https://wa.me/40775630680?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1] ?? '')).toBe(
      'Bună ziua! Maria Popescu a făcut testul pe site: nivelul recomandat – Movers (7/12). Aș dori o lecție demo gratuită.',
    );
  });

  it('falls back to "Copilul meu" without a name', () => {
    expect(decodeURIComponent(resultWhatsappUrl(summary, 7, 12, '   ').split('?text=')[1] ?? '')).toContain(
      'Bună ziua! Copilul meu a făcut testul',
    );
  });
});
```

Run: `npx vitest run src/features/level-test/model`
Expected: FAIL

- [ ] **Step 2: Implementează**

`select-bank.ts`:

```ts
import { AGE_GROUPS } from '@shared/content/site';
import { AGE_BANKS, EXAMS } from '../data/questions';
import type { Bank } from './types';

export type Mode = 'level' | 'exam';

export function choiceLabels(mode: Mode): readonly string[] {
  return mode === 'level' ? AGE_GROUPS : EXAMS.map((exam) => exam.name);
}

export function selectBank(mode: Mode, choice: number): Bank {
  const bank = mode === 'level' ? AGE_BANKS[choice] : EXAMS[choice]?.bank;
  if (!bank) throw new RangeError(`Alegere necunoscută pentru ${mode}: ${choice}`);
  return bank;
}
```

`score-test.ts`:

```ts
import { SKILLS, type Bank, type Skill } from './types';

export type SkillScore = { readonly correct: number; readonly total: number };

export type TestScore = {
  readonly score: number;
  readonly total: number;
  readonly bySkill: Readonly<Record<Skill, SkillScore>>;
};

export function scoreTest(bank: Bank, answers: readonly number[]): TestScore {
  const bySkill = Object.fromEntries(SKILLS.map((skill) => [skill, { correct: 0, total: 0 }])) as Record<
    Skill,
    { correct: number; total: number }
  >;
  let score = 0;
  bank.forEach((question, index) => {
    const isCorrect = answers[index] === question.answer;
    bySkill[question.skill].total += 1;
    if (isCorrect) {
      bySkill[question.skill].correct += 1;
      score += 1;
    }
  });
  return { score, total: bank.length, bySkill };
}
```

`recommend-level.ts`:

```ts
import type { LevelSlug } from '@shared/content/site';

export type RecommendedLevel = LevelSlug | 'b1-preliminary';
export type ExamReadiness = 'ready' | 'almost' | 'not-yet';

const reaches = (score: number, total: number, percent: number) => score * 100 >= percent * total;

export function recommendLevel(ageIndex: number, score: number, total: number): RecommendedLevel {
  const at = (percent: number) => reaches(score, total, percent);
  switch (ageIndex) {
    case 0:
      return at(85) ? 'pre-a1' : 'starters';
    case 1:
      if (!at(50)) return 'starters';
      return at(85) ? 'movers' : 'pre-a1';
    case 2:
    case 3:
      if (!at(40)) return 'pre-a1';
      if (!at(70)) return 'movers';
      return at(90) ? 'a2-key' : 'flyers';
    case 4:
      if (!at(40)) return 'flyers';
      return at(80) ? 'b1-preliminary' : 'a2-key';
    default:
      throw new RangeError(`Vârstă necunoscută: ${ageIndex}`);
  }
}

export function examReadiness(score: number, total: number): ExamReadiness {
  if (reaches(score, total, 80)) return 'ready';
  return reaches(score, total, 50) ? 'almost' : 'not-yet';
}
```

`describe-result.ts`:

```ts
import { site } from '@shared/content/site';
import { EXAMS } from '../data/questions';
import { examReadiness, recommendLevel } from './recommend-level';
import type { Mode } from './select-bank';

export type ResultSummary = {
  readonly kicker: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
};

const B1 = {
  name: 'B1 Preliminary',
  summary: 'Nivel peste A2 Key. Stabilim împreună la lecția demo programul potrivit.',
};

export function describeResult(mode: Mode, choice: number, score: number, total: number): ResultSummary {
  if (mode === 'level') {
    const slug = recommendLevel(choice, score, total);
    const level = slug === 'b1-preliminary' ? B1 : site.levels.find((candidate) => candidate.slug === slug);
    if (!level) throw new Error(`Nivel lipsă din site.levels: ${slug}`);
    return { kicker: 'Nivelul recomandat', title: level.name, description: level.summary, level: slug };
  }
  const exam = EXAMS[choice];
  if (!exam) throw new RangeError(`Examen necunoscut: ${choice}`);
  const readiness = examReadiness(score, total);
  const copy = {
    ready: {
      title: 'Pregătit pentru examen',
      description: `Rezultat foarte bun. Un curs de pregătire ${exam.name} îl ajută să se simtă sigur în ziua examenului.`,
    },
    almost: {
      title: 'Aproape pregătit',
      description: `Baza e solidă. Cu pregătire țintită pe competențele de mai jos, examenul ${exam.name} e la îndemână.`,
    },
    'not-yet': {
      title: 'Mai avem de lucru',
      description: `Recomandăm întâi grupa potrivită nivelului actual, apoi pregătirea pentru ${exam.name}.`,
    },
  }[readiness];
  return { kicker: `Test pentru examenul Cambridge ${exam.name}`, ...copy, level: exam.slug };
}
```

`result-message.ts`:

```ts
import { site } from '@shared/content/site';
import type { ResultSummary } from './describe-result';

export function resultWhatsappUrl(summary: ResultSummary, score: number, total: number, childName: string): string {
  const who = childName.trim().replace(/\s+/g, ' ') || 'Copilul meu';
  const text = `Bună ziua! ${who} a făcut testul pe site: ${summary.kicker.toLowerCase()} – ${summary.title} (${score}/${total}). Aș dori o lecție demo gratuită.`;
  return `${site.contact.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 3: Verifică și commit**

Run: `npx vitest run src/features/level-test/model`
Expected: PASS (toate cele 18 cazuri de prag ±1 trec)

Run: `npm run verify`
Expected: verde

```powershell
git add src/features/level-test/model
git commit -m "feat(level-test): score answers and recommend a level by age"
```

---

### Task 4: Modelul — starea testului, textele Emei, textele diplomei

**Files:**
- Create: `src/features/level-test/model/test-session.ts`, `ema-line.ts`, `diploma-content.ts`
- Test: `src/features/level-test/model/session.test.ts`, `src/features/level-test/model/diploma-content.test.ts`

**Interfaces:**
- Consumes: `selectBank`, `choiceLabels`, `Mode` (Task 3); `Question` (Task 2); `site.contact.city`.
- Produces, în `test-session.ts`:
  - `type TestState`:
    - `{ step: 'mode' }`
    - `{ step: 'setup'; mode; choice: number | null }`
    - `{ step: 'question'; mode; choice: number; answers: readonly number[] }`
    - `{ step: 'result'; mode; choice: number; answers: readonly number[] }`
  - `type TestAction`: `chooseMode` | `chooseOption` | `start` | `answer` | `back` | `restart`;
  - `INITIAL_STATE`;
  - `reduceTest(state, action): TestState`. O acțiune care nu se aplică întoarce aceeași referință de stare;
  - `currentQuestion(state): Question | null`.
- Produces, în `ema-line.ts`: `emaLine(state: TestState, childName: string): string`.
- Produces, în `diploma-content.ts`:
  - `DIPLOMA_SIZE = { width: 1600, height: 1130 }`;
  - `diplomaLine(mode)`;
  - `diplomaFileName(name)`;
  - `formatDiplomaDate(date)`;
  - `fitNameFont(name, measure)`;
  - `starPoints(cx, cy, radius)`;
  - `diplomaTexts(data, measure): DiplomaText[]`;
  - `type DiplomaData = { childName; mode; title; score; total; date: Date }`;
  - `type DiplomaText = { text; font; color; x; y }`.

- [ ] **Step 1: Scrie testele care pică**

`src/features/level-test/model/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { YOUNG } from '../data/questions';
import { emaLine } from './ema-line';
import { currentQuestion, INITIAL_STATE, reduceTest, type TestState } from './test-session';

const play = (state: TestState, ...actions: Parameters<typeof reduceTest>[1][]) => actions.reduce(reduceTest, state);

describe('reduceTest', () => {
  it('walks mode → setup → question → result', () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    expect(state).toEqual({ step: 'question', mode: 'level', choice: 0, answers: [] });
    expect(currentQuestion(state)).toBe(YOUNG[0]);
    for (let index = 0; index < 11; index++) state = reduceTest(state, { type: 'answer', option: 0 });
    expect(state.step).toBe('question');
    state = reduceTest(state, { type: 'answer', option: 2 });
    expect(state.step).toBe('result');
    expect(state.step === 'result' && state.answers).toHaveLength(12);
  });

  it('does not start without a choice', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'exam' });
    expect(reduceTest(setup, { type: 'start' })).toBe(setup);
  });

  it('ignores choices outside the list and invalid answers', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'exam' });
    expect(reduceTest(setup, { type: 'chooseOption', choice: 4 })).toBe(setup);
    const question = play(setup, { type: 'chooseOption', choice: 1 }, { type: 'start' });
    expect(reduceTest(question, { type: 'answer', option: 3 })).toBe(question);
  });

  it('ignores actions that do not belong to the current step', () => {
    expect(reduceTest(INITIAL_STATE, { type: 'answer', option: 0 })).toBe(INITIAL_STATE);
    expect(reduceTest(INITIAL_STATE, { type: 'start' })).toBe(INITIAL_STATE);
  });

  it('goes back from setup to mode and restarts from anywhere', () => {
    const setup = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' });
    expect(reduceTest(setup, { type: 'back' })).toEqual(INITIAL_STATE);
    const question = play(setup, { type: 'chooseOption', choice: 2 }, { type: 'start' });
    expect(reduceTest(question, { type: 'restart' })).toEqual(INITIAL_STATE);
  });
});

describe('emaLine', () => {
  it('follows the design per step', () => {
    expect(emaLine(INITIAL_STATE, '')).toBe('Hei, eu sunt Ema! Alege testul și începem.');
    const setup = reduceTest(INITIAL_STATE, { type: 'chooseMode', mode: 'level' });
    expect(emaLine(setup, '')).toBe('Alege și începem! La final primești o diplomă.');
  });

  it('greets the first question, then encourages, and explains audio', () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    expect(emaLine(state, '')).toBe('Hai să începem! Alege răspunsul potrivit.');
    state = reduceTest(state, { type: 'answer', option: 0 });
    expect(emaLine(state, '')).toBe('Super! Mergem mai departe.');
    state = reduceTest(state, { type: 'answer', option: 0 });
    expect(currentQuestion(state)?.kind).toBe('audio');
    expect(emaLine(state, '')).toBe('Apasă „Ascultă din nou” și alege ce ai auzit.');
  });

  it('asks for the name, then congratulates by name on the result', () => {
    let state = play(INITIAL_STATE, { type: 'chooseMode', mode: 'level' }, { type: 'chooseOption', choice: 0 }, { type: 'start' });
    for (let index = 0; index < 12; index++) state = reduceTest(state, { type: 'answer', option: 0 });
    expect(emaLine(state, '  ')).toBe('Bravo! Scrie numele tău ca să-ți pregătesc diploma.');
    expect(emaLine(state, ' Ana ')).toBe('Bravo, Ana! Diploma ta e gata de descărcat.');
  });
});
```

`src/features/level-test/model/diploma-content.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { diplomaFileName, diplomaTexts, fitNameFont, formatDiplomaDate, starPoints } from './diploma-content';

const measureByLength = (font: string, text: string) => text.length * Number(/(\d+)px/.exec(font)?.[1] ?? 0) * 0.6;

describe('diploma content', () => {
  it('builds a safe file name from the child name', () => {
    expect(diplomaFileName('Maria Popescu')).toBe('diploma-Maria-Popescu.png');
    expect(diplomaFileName('  Ștefan   Țurcanu ')).toBe('diploma-Ștefan-Țurcanu.png');
    expect(diplomaFileName('<script>alert(1)</script>')).toBe('diploma-scriptalert1script.png');
    expect(diplomaFileName('../../etc')).toBe('diploma-etc.png');
    expect(diplomaFileName('   ')).toBe('diploma.png');
  });

  it('formats the date the Romanian way, in Bucharest time', () => {
    expect(formatDiplomaDate(new Date('2026-10-10T22:30:00Z'))).toBe('11.10.2026');
  });

  it('shrinks long names in steps of 4px down to 50px', () => {
    expect(fitNameFont('Ana', measureByLength)).toBe(104);
    const long = 'Maria-Alexandra Popescu-Ionescu Vasilescu';
    const size = fitNameFont(long, measureByLength);
    expect(size % 4).toBe(104 % 4);
    expect(size).toBeLessThan(104);
    expect(measureByLength(`900 ${size}px Nunito`, long)).toBeLessThanOrEqual(1250);
    expect(fitNameFont('x'.repeat(200), measureByLength)).toBe(50);
  });

  it('draws a 12-point star', () => {
    const points = starPoints(800, 230, 70);
    expect(points).toHaveLength(24);
    expect(points[0]).toEqual({ x: 800, y: 160 });
  });

  it('lays out the diploma texts from the design', () => {
    const texts = diplomaTexts(
      { childName: '  Ana  Pop ', mode: 'level', title: 'Movers', score: 7, total: 12, date: new Date('2026-10-11T09:00:00Z') },
      measureByLength,
    ).map((item) => item.text);
    expect(texts).toEqual([
      'DIPLOMĂ',
      'Se acordă lui / ei',
      'Ana Pop',
      'a finalizat testul de nivel',
      'Movers',
      '7 din 12 răspunsuri corecte',
      'Pregătire după metoda Cambridge',
      'English Minds Academy',
      'Cluj-Napoca · 11.10.2026',
      'Semnătura profesorului',
      'Director',
    ]);
  });
});
```

Run: `npx vitest run src/features/level-test/model`
Expected: FAIL

- [ ] **Step 2: `test-session.ts`**

```ts
import type { Question } from './types';
import { choiceLabels, selectBank, type Mode } from './select-bank';

export type TestState =
  | { readonly step: 'mode' }
  | { readonly step: 'setup'; readonly mode: Mode; readonly choice: number | null }
  | { readonly step: 'question'; readonly mode: Mode; readonly choice: number; readonly answers: readonly number[] }
  | { readonly step: 'result'; readonly mode: Mode; readonly choice: number; readonly answers: readonly number[] };

export type TestAction =
  | { readonly type: 'chooseMode'; readonly mode: Mode }
  | { readonly type: 'chooseOption'; readonly choice: number }
  | { readonly type: 'start' }
  | { readonly type: 'answer'; readonly option: number }
  | { readonly type: 'back' }
  | { readonly type: 'restart' };

export const INITIAL_STATE: TestState = { step: 'mode' };

export function reduceTest(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'restart':
      return state.step === 'mode' ? state : INITIAL_STATE;
    case 'chooseMode':
      return state.step === 'mode' ? { step: 'setup', mode: action.mode, choice: null } : state;
    case 'back':
      return state.step === 'setup' ? INITIAL_STATE : state;
    case 'chooseOption': {
      if (state.step !== 'setup') return state;
      const valid = Number.isInteger(action.choice) && action.choice >= 0 && action.choice < choiceLabels(state.mode).length;
      return valid ? { ...state, choice: action.choice } : state;
    }
    case 'start':
      if (state.step !== 'setup' || state.choice === null) return state;
      return { step: 'question', mode: state.mode, choice: state.choice, answers: [] };
    case 'answer': {
      if (state.step !== 'question' || ![0, 1, 2].includes(action.option)) return state;
      const answers = [...state.answers, action.option];
      const done = answers.length >= selectBank(state.mode, state.choice).length;
      return { step: done ? 'result' : 'question', mode: state.mode, choice: state.choice, answers };
    }
  }
}

export function currentQuestion(state: TestState): Question | null {
  if (state.step !== 'question') return null;
  return selectBank(state.mode, state.choice)[state.answers.length] ?? null;
}
```

- [ ] **Step 3: `ema-line.ts`**

```ts
import { currentQuestion, type TestState } from './test-session';

export function emaLine(state: TestState, childName: string): string {
  switch (state.step) {
    case 'mode':
      return 'Hei, eu sunt Ema! Alege testul și începem.';
    case 'setup':
      return 'Alege și începem! La final primești o diplomă.';
    case 'question':
      if (currentQuestion(state)?.kind === 'audio') return 'Apasă „Ascultă din nou” și alege ce ai auzit.';
      return state.answers.length === 0 ? 'Hai să începem! Alege răspunsul potrivit.' : 'Super! Mergem mai departe.';
    case 'result': {
      const name = childName.trim().replace(/\s+/g, ' ');
      return name ? `Bravo, ${name}! Diploma ta e gata de descărcat.` : 'Bravo! Scrie numele tău ca să-ți pregătesc diploma.';
    }
  }
}
```

- [ ] **Step 4: `diploma-content.ts`**

Pozițiile, fonturile și culorile vin din `docs/design/test-de-nivel.md` §4.2.

```ts
import { site } from '@shared/content/site';
import type { Mode } from './select-bank';

export const DIPLOMA_SIZE = { width: 1600, height: 1130 } as const;

export type DiplomaData = {
  readonly childName: string;
  readonly mode: Mode;
  readonly title: string;
  readonly score: number;
  readonly total: number;
  readonly date: Date;
};

export type DiplomaText = {
  readonly text: string;
  readonly font: string;
  readonly color: string;
  readonly x: number;
  readonly y: number;
};

export type Measure = (font: string, text: string) => number;

const NAVY = '#14224a';
const ACCENT = '#c4501a';
const FONT = 'Nunito, sans-serif';
const CENTER = DIPLOMA_SIZE.width / 2;

const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

export function diplomaLine(mode: Mode): string {
  return mode === 'level' ? 'a finalizat testul de nivel' : 'a finalizat testul de pregătire Cambridge';
}

export function diplomaFileName(name: string): string {
  const safe = cleanName(name)
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim()
    .replace(/ +/g, '-');
  return safe ? `diploma-${safe}.png` : 'diploma.png';
}

const dateFormatter = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Bucharest',
});

export function formatDiplomaDate(date: Date): string {
  return dateFormatter.format(date);
}

export function fitNameFont(name: string, measure: Measure): number {
  let size = 104;
  while (size > 50 && measure(`900 ${size}px ${FONT}`, name) > 1250) size -= 4;
  return Math.max(size, 50);
}

export function starPoints(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < 24; index++) {
    const r = index % 2 === 0 ? radius : radius * 0.58;
    const angle = (Math.PI / 12) * index - Math.PI / 2;
    points.push({ x: Math.round((cx + r * Math.cos(angle)) * 100) / 100, y: Math.round((cy + r * Math.sin(angle)) * 100) / 100 });
  }
  return points;
}

export function diplomaTexts(data: DiplomaData, measure: Measure): DiplomaText[] {
  const name = cleanName(data.childName);
  const text = (value: string, font: string, color: string, y: number, x = CENTER): DiplomaText => ({
    text: value,
    font: `${font} ${FONT}`,
    color,
    x,
    y,
  });
  return [
    text('DIPLOMĂ', '800 40px', ACCENT, 370),
    text('Se acordă lui / ei', '700 32px', NAVY, 420),
    text(name, `900 ${fitNameFont(name, measure)}px`, NAVY, 520),
    text(diplomaLine(data.mode), '700 40px', NAVY, 590),
    text(data.title, '900 84px', ACCENT, 700),
    text(`${data.score} din ${data.total} răspunsuri corecte`, '800 34px', NAVY, 770),
    text('Pregătire după metoda Cambridge', '800 24px', ACCENT, 820),
    text('English Minds Academy', '900 44px', NAVY, 900),
    text(`${site.contact.city} · ${formatDiplomaDate(data.date)}`, '700 28px', NAVY, 950),
    text('Semnătura profesorului', '700 24px', NAVY, 995, 355),
    text('Director', '700 24px', NAVY, 995, 1245),
  ];
}
```

În testul `starPoints`, primul punct e vârful de sus (`y = cy - R`). Rotunjirea la două zecimale face comparația exactă.

- [ ] **Step 5: Verifică și commit**

Run: `npx vitest run src/features/level-test/model`
Expected: PASS

Run: `npm run verify`
Expected: verde

```powershell
git add src/features/level-test/model
git commit -m "feat(level-test): add the test state machine, Ema lines and diploma content"
```

---

### Task 5: Diploma — desen pe canvas, PNG și tipărire

**Files:**
- Create: `src/features/level-test/diploma/render-diploma.ts`
- Test: `src/features/level-test/diploma/diploma.test.ts`

**Interfaces:**
- Consumes: `DIPLOMA_SIZE`, `diplomaTexts`, `starPoints`, `diplomaFileName`, `DiplomaData` (Task 4).
- Produces:
  - `drawDiploma(ctx: DiplomaContext, data: DiplomaData): void`. `DiplomaContext` e subsetul de `CanvasRenderingContext2D` folosit, ca să poată fi testat cu un fals;
  - `createDiplomaCanvas(doc: Document, data: DiplomaData): Promise<HTMLCanvasElement>`. Așteaptă `doc.fonts.ready` și aruncă `Error('Canvas 2D indisponibil')` dacă nu există context;
  - `downloadDiploma(doc: Document, canvas: HTMLCanvasElement, childName: string): void`;
  - `printDiploma(win: Window, canvas: HTMLCanvasElement, childName: string): boolean`. Întoarce `false` dacă pop-up-ul e blocat.

- [ ] **Step 1: Scrie testul care pică**

`src/features/level-test/diploma/diploma.test.ts`:

```ts
// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { downloadDiploma, drawDiploma, printDiploma, type DiplomaContext } from './render-diploma';

function fakeContext() {
  const calls: string[] = [];
  const texts: { text: string; font: string }[] = [];
  const ctx = {
    font: '',
    fillStyle: '' as unknown,
    strokeStyle: '' as unknown,
    lineWidth: 0,
    textAlign: 'start',
    createLinearGradient: () => ({ addColorStop: () => calls.push('stop') }),
    fillRect: () => calls.push('fillRect'),
    beginPath: () => calls.push('beginPath'),
    moveTo: () => calls.push('moveTo'),
    lineTo: () => calls.push('lineTo'),
    arcTo: () => calls.push('arcTo'),
    closePath: () => calls.push('closePath'),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    setLineDash: (dash: number[]) => calls.push(`dash:${dash.join(',')}`),
    measureText: (text: string) => ({ width: text.length * 20 }),
    fillText(text: string) {
      texts.push({ text, font: this.font });
    },
  };
  return { ctx: ctx as unknown as DiplomaContext, calls, texts };
}

const data = { childName: '<b>Ana</b>', mode: 'level' as const, title: 'Movers', score: 7, total: 12, date: new Date('2026-10-11T09:00:00Z') };

describe('drawDiploma', () => {
  it('draws the frame, three stars and every text, with the name as plain text', () => {
    const { ctx, calls, texts } = fakeContext();
    drawDiploma(ctx, data);
    expect(calls).toContain('dash:22,16');
    expect(calls.filter((call) => call === 'fill').length).toBeGreaterThanOrEqual(4);
    expect(texts.map((item) => item.text)).toContain('<b>Ana</b>');
    expect(texts.map((item) => item.text)).toContain('7 din 12 răspunsuri corecte');
  });
});

describe('downloadDiploma', () => {
  it('clicks a temporary link with a safe file name', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = () => 'data:image/png;base64,AAA';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    downloadDiploma(document, canvas, 'Ana Pop');
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('diploma-Ana-Pop.png');
    expect(link.href).toBe('data:image/png;base64,AAA');
    expect(link.isConnected).toBe(false);
    click.mockRestore();
  });
});

describe('printDiploma', () => {
  it('returns false when the pop-up is blocked', () => {
    const canvas = document.createElement('canvas');
    const win = { open: () => null } as unknown as Window;
    expect(printDiploma(win, canvas, 'Ana')).toBe(false);
  });

  it('builds the print page with DOM APIs so the name cannot inject markup', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = () => 'data:image/png;base64,AAA';
    const popupDocument = document.implementation.createHTMLDocument('');
    const popup = { document: popupDocument, print: vi.fn(), focus: vi.fn() };
    const win = { open: () => popup } as unknown as Window;
    expect(printDiploma(win, canvas, '</title><script>alert(1)</script>')).toBe(true);
    expect(popupDocument.title).toBe('Diplomă </title><script>alert(1)</script>');
    expect(popupDocument.querySelector('script')).toBeNull();
    expect(popupDocument.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAA');
    expect(popupDocument.querySelector('style')?.textContent).toContain('size: A4 landscape');
  });
});
```

Run: `npx vitest run src/features/level-test/diploma`
Expected: FAIL

- [ ] **Step 2: `render-diploma.ts`**

```ts
import {
  DIPLOMA_SIZE,
  diplomaFileName,
  diplomaTexts,
  starPoints,
  type DiplomaData,
} from '../model/diploma-content';

export type DiplomaContext = Pick<
  CanvasRenderingContext2D,
  | 'font'
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'textAlign'
  | 'createLinearGradient'
  | 'fillRect'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'arcTo'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'setLineDash'
  | 'measureText'
  | 'fillText'
>;

function roundedRect(ctx: DiplomaContext, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function star(ctx: DiplomaContext, cx: number, cy: number, radius: number): void {
  const [first, ...rest] = starPoints(cx, cy, radius);
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const point of rest) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.fillStyle = '#ffc41f';
  ctx.fill();
}

export function drawDiploma(ctx: DiplomaContext, data: DiplomaData): void {
  const { width, height } = DIPLOMA_SIZE;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ec6423');
  gradient.addColorStop(1, '#f39a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  roundedRect(ctx, 70, 70, 1460, 990, 48);
  ctx.fillStyle = '#fff5e6';
  ctx.fill();

  ctx.setLineDash([22, 16]);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffc41f';
  roundedRect(ctx, 100, 100, 1400, 930, 36);
  ctx.stroke();
  ctx.setLineDash([]);

  star(ctx, 800, 230, 70);
  star(ctx, 260, 880, 40);
  star(ctx, 1340, 880, 40);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#14224a';
  for (const [from, to] of [
    [190, 520],
    [1080, 1410],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(from, 960);
    ctx.lineTo(to, 960);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  const measure = (font: string, text: string) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  for (const item of diplomaTexts(data, measure)) {
    ctx.font = item.font;
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
  }
}

export async function createDiplomaCanvas(doc: Document, data: DiplomaData): Promise<HTMLCanvasElement> {
  await doc.fonts?.ready;
  const canvas = doc.createElement('canvas');
  canvas.width = DIPLOMA_SIZE.width;
  canvas.height = DIPLOMA_SIZE.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponibil');
  drawDiploma(ctx, data);
  return canvas;
}

export function downloadDiploma(doc: Document, canvas: HTMLCanvasElement, childName: string): void {
  const link = doc.createElement('a');
  link.download = diplomaFileName(childName);
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function printDiploma(win: Window, canvas: HTMLCanvasElement, childName: string): boolean {
  const popup = win.open('', '_blank');
  if (!popup) return false;
  const doc = popup.document;
  doc.title = `Diplomă ${childName.trim()}`;
  const style = doc.createElement('style');
  style.textContent =
    '@page { size: A4 landscape; margin: 0 } html, body { margin: 0; height: 100% } img { width: 100%; height: 100%; object-fit: contain }';
  const image = doc.createElement('img');
  image.alt = doc.title;
  image.addEventListener('load', () => {
    popup.focus();
    popup.print();
  });
  image.src = canvas.toDataURL('image/png');
  doc.head.append(style);
  doc.body.replaceChildren(image);
  return true;
}
```

- [ ] **Step 3: Verifică și commit**

Run: `npx vitest run src/features/level-test/diploma`
Expected: PASS (4 teste)

Run: `npm run verify`
Expected: verde

```powershell
git add src/features/level-test/diploma
git commit -m "feat(level-test): draw the diploma on canvas and export it as PNG or print"
```

---

### Task 6: Elementul `<level-test>`

**Files:**
- Create: `src/features/level-test/ui/dom.ts`, `src/features/level-test/ui/speech.ts`, `src/features/level-test/ui/views.ts`, `src/features/level-test/ui/level-test.element.ts`
- Test: `src/features/level-test/ui/level-test.element.test.ts`, `src/features/level-test/ui/speech.test.ts`

**Interfaces:**
- Consumes: modelul (Tasks 3–4), diploma (Task 5), `createLevelTestCompleted` (Task 2), clasele `.button*` (Task 1).
- Produces:
  - `class LevelTest extends HTMLElement`;
  - `defineLevelTest()`, pentru eticheta `level-test`;
  - `h(tag, attrs, ...children)`;
  - `createSpeech(win): Speech`, unde `Speech = { available: boolean; speak(text): boolean }`.
- Markup așteptat de la Astro (Task 7):

```html
<level-test>
  <div class="level-test__ema"><div class="ema-portrait …">…</div><p class="level-test__bubble">…</p></div>
  <div class="level-test__card">…fallback fără JS…</div>
</level-test>
```

Elementul înlocuiește doar conținutul lui `.level-test__card` și textul din `.level-test__bubble`.

- [ ] **Step 1: Scrie testele care pică**

`src/features/level-test/ui/speech.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createSpeech } from './speech';

describe('createSpeech', () => {
  it('is unavailable without speechSynthesis', () => {
    const speech = createSpeech({} as Window);
    expect(speech.available).toBe(false);
    expect(speech.speak('cat')).toBe(false);
  });

  it('speaks British English slowly and cancels what was playing', () => {
    const spoken: { text: string; lang: string; rate: number }[] = [];
    const cancel = vi.fn();
    class Utterance {
      lang = '';
      rate = 1;
      constructor(public text: string) {}
    }
    const win = {
      speechSynthesis: { cancel, speak: (u: Utterance) => spoken.push({ text: u.text, lang: u.lang, rate: u.rate }) },
      SpeechSynthesisUtterance: Utterance,
    } as unknown as Window;
    expect(createSpeech(win).speak('cat')).toBe(true);
    expect(cancel).toHaveBeenCalled();
    expect(spoken).toEqual([{ text: 'cat', lang: 'en-GB', rate: 0.85 }]);
  });

  it('reports a failure instead of swallowing it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const win = {
      speechSynthesis: {
        cancel: () => undefined,
        speak: () => {
          throw new Error('no voice');
        },
      },
      SpeechSynthesisUtterance: class {},
    } as unknown as Window;
    expect(createSpeech(win).speak('cat')).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
```

`src/features/level-test/ui/level-test.element.test.ts`:

```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_TEST_COMPLETED } from '@shared/contracts/domain-events';
import { MID, YOUNG } from '../data/questions';
import { defineLevelTest } from './level-test.element';

const MARKUP = `
  <level-test>
    <div class="level-test__ema"><p class="level-test__bubble">Hei!</p></div>
    <div class="level-test__card"><h2>Fără JS</h2></div>
  </level-test>`;

const card = () => document.querySelector('.level-test__card')!;
const bubble = () => document.querySelector('.level-test__bubble')!.textContent;
const button = (name: string) =>
  [...card().querySelectorAll('button')].find((item) => item.textContent?.replace(/\s+/g, ' ').includes(name))!;
const optionButtons = () => [...card().querySelectorAll<HTMLButtonElement>('.level-test__option')];

function mount() {
  const holder = document.createElement('div');
  holder.innerHTML = MARKUP;
  document.body.replaceChildren(...holder.childNodes);
}

function answerAll(bank: typeof YOUNG, pick: (index: number) => number) {
  bank.forEach((_question, index) => optionButtons()[pick(index)]!.click());
}

describe('<level-test>', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', undefined);
    defineLevelTest();
    mount();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('replaces the no-JS fallback with the mode choice and focuses the heading', () => {
    expect(card().textContent).not.toContain('Fără JS');
    const heading = card().querySelector('h2')!;
    expect(heading.textContent).toBe('Ce fel de test vrei să facă copilul?');
    expect(document.activeElement).not.toBe(heading);
    expect(button('Test de nivel')).toBeTruthy();
    expect(button('Test pentru examen Cambridge')).toBeTruthy();
    expect(bubble()).toBe('Hei, eu sunt Ema! Alege testul și începem.');
  });

  it('keeps start disabled until an age is picked, with aria-pressed on the choice', () => {
    button('Test de nivel').click();
    expect(document.activeElement).toBe(card().querySelector('h2'));
    expect(card().querySelector('h2')!.textContent).toBe('Câți ani are copilul?');
    expect(button('Începe testul').disabled).toBe(true);
    button('9–10 ani').click();
    expect(button('9–10 ani').getAttribute('aria-pressed')).toBe('true');
    expect(button('5–6 ani').getAttribute('aria-pressed')).toBe('false');
    expect(button('Începe testul').disabled).toBe(false);
  });

  it('shows a question with progress, three named options and focuses the prompt', () => {
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    const prompt = card().querySelector('h2')!;
    expect(prompt.textContent).toBe(MID[0]!.prompt);
    expect(document.activeElement).toBe(prompt);
    const progress = card().querySelector('[role="progressbar"]')!;
    expect(progress.getAttribute('aria-valuenow')).toBe('1');
    expect(progress.getAttribute('aria-valuemax')).toBe('12');
    expect(card().textContent).toContain('1 / 12');
    expect(optionButtons().map((item) => item.textContent?.trim().slice(1).trim())).toEqual([...MID[0]!.options]);
  });

  it('falls back to text for listening questions when speech is unavailable', () => {
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    optionButtons()[0]!.click();
    optionButtons()[0]!.click();
    expect(card().textContent).toContain('Browserul tău nu poate reda sunetul. Citește propoziția:');
    expect(card().textContent).toContain('My brother is twelve years old.');
    expect(button('Ascultă din nou')).toBeUndefined();
  });

  it('speaks listening questions when speech is available', () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        constructor(public text: string) {}
      },
    );
    mount();
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    optionButtons()[0]!.click();
    optionButtons()[0]!.click();
    expect(speak).toHaveBeenCalledTimes(1);
    button('Ascultă din nou').click();
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('shows the result, emits level-test.completed once and asks for the name', () => {
    const events: CustomEvent[] = [];
    document.addEventListener(LEVEL_TEST_COMPLETED, (event) => events.push(event as CustomEvent));
    button('Test de nivel').click();
    button('9–10 ani').click();
    button('Începe testul').click();
    answerAll(MID, (index) => MID[index]!.answer);
    expect(card().querySelector('h2')!.textContent).toBe('A2 Key');
    expect(card().textContent).toContain('Nivelul recomandat');
    expect(card().textContent).toContain('12/12');
    expect(events).toHaveLength(1);
    expect(events[0]!.detail).toEqual({ mode: 'level', level: 'a2-key', score: 12, total: 12 });
    expect(bubble()).toBe('Bravo! Scrie numele tău ca să-ți pregătesc diploma.');
    expect(button('Scrie numele ca să descarci').disabled).toBe(true);
  });

  it('updates the diploma preview, Ema and WhatsApp link as the name is typed, as text only', () => {
    button('Test pentru examen Cambridge').click();
    button('Starters').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 0);
    const input = card().querySelector<HTMLInputElement>('input[name="childName"]')!;
    input.value = '<img src=x onerror=alert(1)>';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(card().querySelector('.level-test__diploma-name')!.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(card().querySelector('img')).toBeNull();
    expect(bubble()).toContain('Bravo, <img src=x onerror=alert(1)>!');
    expect(button('Descarcă diploma (PNG)').disabled).toBe(false);
    expect(document.activeElement).toBe(input);
    const whatsapp = card().querySelector<HTMLAnchorElement>('a.button--whatsapp')!;
    expect(decodeURIComponent(whatsapp.href)).toContain('<img src=x onerror=alert(1)> a făcut testul pe site');
  });

  it('shows a clear message when the diploma cannot be drawn', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    button('Test de nivel').click();
    button('5–6 ani').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 0);
    const input = card().querySelector<HTMLInputElement>('input[name="childName"]')!;
    input.value = 'Ana';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    button('Descarcă diploma (PNG)').click();
    await vi.waitFor(() =>
      expect(card().querySelector('[role="alert"]')?.textContent).toBe(
        'Nu am putut pregăti diploma. Încearcă din nou sau fă o captură de ecran.',
      ),
    );
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('restarts and keeps the typed name', () => {
    button('Test de nivel').click();
    button('5–6 ani').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 1);
    const input = card().querySelector<HTMLInputElement>('input[name="childName"]')!;
    input.value = 'Ana';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    button('Fă un alt test').click();
    expect(card().querySelector('h2')!.textContent).toBe('Ce fel de test vrei să facă copilul?');
    button('Test de nivel').click();
    button('5–6 ani').click();
    button('Începe testul').click();
    answerAll(YOUNG, () => 1);
    expect(card().querySelector<HTMLInputElement>('input[name="childName"]')!.value).toBe('Ana');
  });

  it('does not enhance twice when reconnected', () => {
    const element = document.querySelector('level-test')!;
    button('Test de nivel').click();
    element.remove();
    document.body.append(element);
    expect(card().querySelector('h2')!.textContent).toBe('Câți ani are copilul?');
  });
});
```

Run: `npx vitest run src/features/level-test/ui`
Expected: FAIL

- [ ] **Step 2: `dom.ts` și `speech.ts`**

`src/features/level-test/ui/dom.ts`:

```ts
type Attributes = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    if (name === 'class') element.className = String(value);
    else element.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) if (child !== null && child !== undefined && child !== false) element.append(child);
  return element;
}
```

`append` cu un `string` creează un nod text, deci textul nu este interpretat ca HTML.

`src/features/level-test/ui/speech.ts`:

```ts
export type Speech = {
  readonly available: boolean;
  speak(text: string): boolean;
};

type SpeechWindow = Window & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance };

export function createSpeech(win: Window): Speech {
  const speechWindow = win as SpeechWindow;
  const synth = speechWindow.speechSynthesis;
  const Utterance = speechWindow.SpeechSynthesisUtterance;
  const available = Boolean(synth && Utterance);
  return {
    available,
    speak(text) {
      if (!synth || !Utterance) return false;
      try {
        const utterance = new Utterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.85;
        synth.cancel();
        synth.speak(utterance);
        return true;
      } catch (error) {
        console.warn('[level-test] speechSynthesis a eșuat', error);
        return false;
      }
    },
  };
}
```

- [ ] **Step 3: `views.ts`**

Funcțiile primesc starea și handler-ele și întorc noduri. Folosesc doar `h()`. Texte exacte: `docs/design/test-de-nivel.md` §1.2–1.5 și §4.1.

```ts
import type { ResultSummary } from '../model/describe-result';
import { diplomaLine, formatDiplomaDate } from '../model/diploma-content';
import type { TestScore } from '../model/score-test';
import { choiceLabels, type Mode } from '../model/select-bank';
import { SKILL_LABELS, SKILLS, type Question } from '../model/types';
import { h } from './dom';

export type Handlers = {
  chooseMode(mode: Mode): void;
  chooseOption(choice: number): void;
  start(): void;
  back(): void;
  answer(option: number): void;
  replay(): void;
  restart(): void;
  nameInput(value: string): void;
  download(): void;
  print(): void;
};

const heading = (text: string, className = 'level-test__title') => h('h2', { class: className, tabindex: -1 }, text);

export function modeView(on: Handlers): Node {
  const card = (title: string, description: string) =>
    h(
      'button',
      { type: 'button', class: 'level-test__mode' },
      h('span', { class: 'level-test__eyebrow' }, '12 întrebări · 5 minute'),
      h('span', { class: 'level-test__mode-title' }, title),
      h('span', { class: 'level-test__mode-text' }, description),
    );
  const level = card(
    'Test de nivel',
    'Aflăm grupa potrivită. Întrebările se adaptează vârstei, cu imagini și audio pentru cei mici.',
  );
  const exam = card(
    'Test pentru examen Cambridge',
    'Verificăm cât de pregătit e copilul pentru Starters, Movers, Flyers sau A2 Key.',
  );
  level.addEventListener('click', () => on.chooseMode('level'));
  exam.addEventListener('click', () => on.chooseMode('exam'));
  return h(
    'div',
    { class: 'level-test__step' },
    heading('Ce fel de test vrei să facă copilul?'),
    h('div', { class: 'level-test__modes' }, level, exam),
  );
}

export function setupView(mode: Mode, choice: number | null, on: Handlers): Node {
  const labelId = 'level-test-choice-label';
  const choices = choiceLabels(mode).map((label, index) => {
    const item = h(
      'button',
      { type: 'button', class: 'level-test__choice', 'aria-pressed': String(index === choice) },
      label,
    );
    item.addEventListener('click', () => on.chooseOption(index));
    return item;
  });
  const start = h('button', { type: 'button', class: 'button button--primary', disabled: choice === null }, 'Începe testul');
  start.addEventListener('click', on.start);
  const back = h('button', { type: 'button', class: 'level-test__link' }, 'Înapoi');
  back.addEventListener('click', on.back);
  return h(
    'div',
    { class: 'level-test__step' },
    heading(mode === 'level' ? 'Câți ani are copilul?' : 'Pentru ce examen se pregătește?'),
    h('p', { class: 'level-test__label', id: labelId }, mode === 'level' ? 'Vârsta' : 'Examenul Cambridge'),
    h('div', { class: 'level-test__choices', role: 'group', 'aria-labelledby': labelId }, ...choices),
    h('div', { class: 'level-test__actions' }, start, back),
  );
}

function mediaView(question: Question, speechAvailable: boolean, on: Handlers): Node | null {
  switch (question.kind) {
    case 'color':
      return h('div', {
        class: 'level-test__color',
        role: 'img',
        'aria-label': 'Cerc colorat',
        style: `--swatch: ${question.color}`,
      });
    case 'count':
      return h(
        'div',
        { class: 'level-test__stars', role: 'img', 'aria-label': `${question.count} stele` },
        ...Array.from({ length: question.count }, () => h('span', { class: 'level-test__star' })),
      );
    case 'audio': {
      if (!speechAvailable) {
        return h(
          'div',
          { class: 'level-test__passage' },
          h('p', { class: 'level-test__note' }, 'Browserul tău nu poate reda sunetul. Citește propoziția:'),
          h('p', { lang: 'en' }, question.say),
        );
      }
      const play = h(
        'button',
        { type: 'button', class: 'level-test__play' },
        h('span', { class: 'level-test__play-icon', 'aria-hidden': 'true' }),
        'Ascultă din nou',
      );
      play.addEventListener('click', on.replay);
      return play;
    }
    case 'text':
      return question.passage ? h('p', { class: 'level-test__passage', lang: 'en' }, question.passage) : null;
  }
}

export function questionView(question: Question, index: number, total: number, speechAvailable: boolean, on: Handlers): Node {
  const options = question.options.map((option, optionIndex) => {
    const item = h(
      'button',
      { type: 'button', class: 'level-test__option' },
      h('span', { class: 'level-test__letter', 'aria-hidden': 'true' }, 'ABC'[optionIndex] ?? ''),
      h('span', {}, option),
    );
    item.addEventListener('click', () => on.answer(optionIndex));
    return item;
  });
  return h(
    'div',
    { class: 'level-test__step' },
    h(
      'div',
      { class: 'level-test__meta' },
      h('span', { class: 'level-test__chip' }, SKILL_LABELS[question.skill]),
      h('span', { class: 'level-test__count' }, `${index + 1} / ${total}`),
    ),
    h(
      'div',
      {
        class: 'level-test__progress',
        role: 'progressbar',
        'aria-label': 'Progres',
        'aria-valuemin': 1,
        'aria-valuemax': total,
        'aria-valuenow': index + 1,
      },
      h('span', { class: 'level-test__progress-fill', style: `width: ${((index + 1) / total) * 100}%` }),
    ),
    h('p', { class: 'level-test__eyebrow' }, question.instruction),
    mediaView(question, speechAvailable, on),
    heading(question.prompt, 'level-test__question'),
    h('div', { class: 'level-test__options' }, ...options),
  );
}

export type ResultViewInput = {
  readonly mode: Mode;
  readonly summary: ResultSummary;
  readonly score: TestScore;
  readonly childName: string;
  readonly whatsappUrl: string;
  readonly date: Date;
};

export function resultView(input: ResultViewInput, on: Handlers): Node {
  const { summary, score } = input;
  const skills = SKILLS.map((skill) => {
    const { correct, total } = score.bySkill[skill];
    const percent = total === 0 ? 0 : (correct / total) * 100;
    return h(
      'li',
      { class: `level-test__skill level-test__skill--${skill}` },
      h('span', { class: 'level-test__skill-label' }, SKILL_LABELS[skill]),
      h('span', { class: 'level-test__skill-score' }, `${correct}/${total}`),
      h('span', { class: 'level-test__bar', 'aria-hidden': 'true' }, h('span', { style: `width: ${percent}%` })),
    );
  });

  const nameField = h('input', {
    class: 'level-test__name-input',
    id: 'level-test-child-name',
    name: 'childName',
    type: 'text',
    autocomplete: 'off',
    placeholder: 'Numele și prenumele copilului',
    maxlength: 60,
  });
  nameField.value = input.childName;
  nameField.addEventListener('input', () => on.nameInput(nameField.value));

  const download = h('button', { type: 'button', class: 'button button--sun level-test__download' });
  download.addEventListener('click', on.download);
  const print = h('button', { type: 'button', class: 'button level-test__print' }, 'Tipărește / salvează PDF (A4)');
  print.addEventListener('click', on.print);

  const restart = h('button', { type: 'button', class: 'level-test__link' }, 'Fă un alt test');
  restart.addEventListener('click', on.restart);

  return h(
    'div',
    { class: 'level-test__step' },
    h(
      'div',
      { class: 'level-test__result-head' },
      h('p', { class: 'level-test__eyebrow' }, summary.kicker),
      heading(summary.title, 'level-test__result-title'),
      h('p', { class: 'level-test__result-text' }, summary.description),
    ),
    h(
      'div',
      { class: 'level-test__result-grid' },
      h(
        'section',
        { class: 'level-test__skills', 'aria-labelledby': 'level-test-skills' },
        h(
          'div',
          { class: 'level-test__skills-head' },
          h('h3', { id: 'level-test-skills' }, 'Rezultat pe competențe'),
          h('span', { class: 'level-test__total' }, `${score.score}/${score.total}`),
        ),
        h('ul', { role: 'list' }, ...skills),
      ),
      h(
        'section',
        { class: 'level-test__diploma', 'aria-label': 'Diplomă' },
        h('label', { class: 'level-test__name-label', for: 'level-test-child-name' }, 'Cui se decernează diploma?'),
        nameField,
        h(
          'div',
          { class: 'level-test__preview', 'aria-hidden': 'true' },
          h('span', { class: 'level-test__preview-star' }),
          h('span', { class: 'level-test__preview-kicker' }, 'Diplomă'),
          h('span', { class: 'level-test__preview-small' }, 'Se acordă lui / ei'),
          h('span', { class: 'level-test__diploma-name' }),
          h('span', { class: 'level-test__preview-line' }, diplomaLine(input.mode)),
          h('span', { class: 'level-test__preview-title' }, summary.title),
          h('span', { class: 'level-test__preview-small' }, 'Pregătire după metoda Cambridge'),
          h('span', { class: 'level-test__preview-small' }, `English Minds Academy · ${formatDiplomaDate(input.date)}`),
        ),
        download,
        print,
        h('p', { class: 'level-test__diploma-error', role: 'alert' }),
      ),
    ),
    h(
      'div',
      { class: 'level-test__cta' },
      h(
        'div',
        {},
        h('h3', {}, 'Următorul pas: lecția demo gratuită'),
        h('p', {}, 'Trimitem rezultatul pe WhatsApp și stabilim ziua lecției.'),
      ),
      h('a', { class: 'button button--whatsapp', href: input.whatsappUrl }, 'Trimite rezultatul pe WhatsApp'),
    ),
    restart,
  );
}
```

- [ ] **Step 4: `level-test.element.ts`**

```ts
import { createLevelTestCompleted } from '@shared/contracts/domain-events';
import { createDiplomaCanvas, downloadDiploma, printDiploma } from '../diploma/render-diploma';
import { describeResult } from '../model/describe-result';
import { emaLine } from '../model/ema-line';
import { resultWhatsappUrl } from '../model/result-message';
import { scoreTest } from '../model/score-test';
import { selectBank } from '../model/select-bank';
import { currentQuestion, INITIAL_STATE, reduceTest, type TestAction, type TestState } from '../model/test-session';
import { createSpeech, type Speech } from './speech';
import { modeView, questionView, resultView, setupView, type Handlers } from './views';

const DIPLOMA_ERROR = 'Nu am putut pregăti diploma. Încearcă din nou sau fă o captură de ecran.';

export class LevelTest extends HTMLElement {
  private state: TestState = INITIAL_STATE;
  private childName = '';
  private speech: Speech = createSpeech(window);
  private readonly handlers: Handlers = {
    chooseMode: (mode) => this.dispatch({ type: 'chooseMode', mode }),
    chooseOption: (choice) => this.dispatch({ type: 'chooseOption', choice }),
    start: () => this.dispatch({ type: 'start' }),
    back: () => this.dispatch({ type: 'back' }),
    answer: (option) => this.dispatch({ type: 'answer', option }),
    replay: () => this.speakCurrent(),
    restart: () => this.dispatch({ type: 'restart' }),
    nameInput: (value) => this.updateName(value),
    download: () => void this.exportDiploma('download'),
    print: () => void this.exportDiploma('print'),
  };

  connectedCallback(): void {
    if (this.dataset.enhanced === 'true') return;
    if (!this.cardRegion()) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      }
      return;
    }
    this.speech = createSpeech(window);
    this.dataset.enhanced = 'true';
    this.render({ focus: false });
  }

  private cardRegion(): HTMLElement | null {
    return this.querySelector<HTMLElement>(':scope > .level-test__card');
  }

  private dispatch(action: TestAction): void {
    const previous = this.state;
    this.state = reduceTest(this.state, action);
    if (this.state === previous) return;
    const stepChanged = previous.step !== this.state.step;
    const isOptionChange = action.type === 'chooseOption';
    this.render({ focus: !isOptionChange || stepChanged, focusChoice: isOptionChange });
    if (this.state.step === 'question') this.speakCurrent();
    if (this.state.step === 'result' && previous.step !== 'result') this.announceResult();
  }

  private speakCurrent(): void {
    const question = currentQuestion(this.state);
    if (question?.kind === 'audio') this.speech.speak(question.say);
  }

  private resultData() {
    if (this.state.step !== 'result') return null;
    const bank = selectBank(this.state.mode, this.state.choice);
    const score = scoreTest(bank, this.state.answers);
    const summary = describeResult(this.state.mode, this.state.choice, score.score, score.total);
    return { mode: this.state.mode, score, summary };
  }

  private announceResult(): void {
    const data = this.resultData();
    if (!data) return;
    this.dispatchEvent(
      createLevelTestCompleted({ mode: data.mode, level: data.summary.level, score: data.score.score, total: data.score.total }),
    );
  }

  private render({ focus, focusChoice = false }: { focus: boolean; focusChoice?: boolean }): void {
    const region = this.cardRegion();
    if (!region) return;
    const bubble = this.querySelector('.level-test__bubble');
    if (bubble) bubble.textContent = emaLine(this.state, this.childName);

    const state = this.state;
    let view: Node;
    if (state.step === 'mode') view = modeView(this.handlers);
    else if (state.step === 'setup') view = setupView(state.mode, state.choice, this.handlers);
    else if (state.step === 'question') {
      const bank = selectBank(state.mode, state.choice);
      const question = bank[state.answers.length];
      if (!question) return;
      view = questionView(question, state.answers.length, bank.length, this.speech.available, this.handlers);
    } else {
      const data = this.resultData();
      if (!data) return;
      view = resultView(
        {
          ...data,
          childName: this.childName,
          whatsappUrl: resultWhatsappUrl(data.summary, data.score.score, data.score.total, this.childName),
          date: new Date(),
        },
        this.handlers,
      );
    }
    region.replaceChildren(view);
    if (state.step === 'result') this.refreshDiploma();
    if (focusChoice && state.step === 'setup' && state.choice !== null) {
      region.querySelectorAll<HTMLButtonElement>('.level-test__choice')[state.choice]?.focus();
    } else if (focus) {
      region.querySelector<HTMLElement>('h2')?.focus();
    }
  }

  private updateName(value: string): void {
    this.childName = value;
    const bubble = this.querySelector('.level-test__bubble');
    if (bubble) bubble.textContent = emaLine(this.state, this.childName);
    this.refreshDiploma();
  }

  private refreshDiploma(): void {
    const region = this.cardRegion();
    const data = this.resultData();
    if (!region || !data) return;
    const hasName = this.childName.trim().length > 0;
    const name = region.querySelector('.level-test__diploma-name');
    if (name) {
      name.textContent = hasName ? this.childName.trim() : 'Numele copilului';
      name.classList.toggle('is-empty', !hasName);
    }
    const download = region.querySelector<HTMLButtonElement>('.level-test__download');
    if (download) {
      download.disabled = !hasName;
      download.textContent = hasName ? 'Descarcă diploma (PNG)' : 'Scrie numele ca să descarci';
    }
    const print = region.querySelector<HTMLButtonElement>('.level-test__print');
    if (print) print.hidden = !hasName;
    const whatsapp = region.querySelector<HTMLAnchorElement>('a.button--whatsapp');
    if (whatsapp) whatsapp.href = resultWhatsappUrl(data.summary, data.score.score, data.score.total, this.childName);
  }

  private async exportDiploma(kind: 'download' | 'print'): Promise<void> {
    const data = this.resultData();
    const region = this.cardRegion();
    if (!data || !region || !this.childName.trim()) return;
    const error = region.querySelector('.level-test__diploma-error');
    if (error) error.textContent = '';
    try {
      const canvas = await createDiplomaCanvas(document, {
        childName: this.childName,
        mode: data.mode,
        title: data.summary.title,
        score: data.score.score,
        total: data.score.total,
        date: new Date(),
      });
      if (kind === 'print' && printDiploma(window, canvas, this.childName)) return;
      downloadDiploma(document, canvas, this.childName);
    } catch (cause) {
      console.error('[level-test] diploma nu a putut fi generată', cause);
      if (error) error.textContent = DIPLOMA_ERROR;
    }
  }
}

export function defineLevelTest(): void {
  if (!customElements.get('level-test')) customElements.define('level-test', LevelTest);
}
```

Note:
- La alegerea vârstei sau a examenului (`chooseOption`), focusul rămâne pe butonul ales, nu sare pe titlu. În toate celelalte cazuri trece pe titlul nou (`h2`, `tabindex="-1"`).
- În testul „replaces the no-JS fallback…”, la montarea inițială focusul nu se mută (`focus: false`), ca pagina să nu sară la încărcare.
- happy-dom nu are canvas 2D: `getContext` întoarce `null`. Testul de eroare se bazează pe asta și o forțează explicit.

- [ ] **Step 5: Verifică și commit**

Run: `npx vitest run src/features/level-test`
Expected: PASS

Run: `npm run verify`
Expected: verde

```powershell
git add src/features/level-test/ui
git commit -m "feat(level-test): add the level-test element with audio fallback and diploma export"
```

---

### Task 7: Componenta Astro, stilurile și pagina `/test-de-nivel/`

**Files:**
- Create: `src/features/level-test/ui/LevelTest.astro`, `src/features/level-test/ui/level-test.css`, `src/features/level-test/index.ts`
- Create: `src/pages/test-de-nivel.astro`
- Test: `src/features/level-test/ui/LevelTest.test.ts`
- Modify: `tests/pages/pages.test.ts`

**Interfaces:**
- Consumes: `defineLevelTest` (Task 6); `EmaPortrait`, `WhatsAppButton` (shared); clasele `.button*` (Task 1).
- Produces: `@features/level-test` exportă `LevelTest`.

Sursa vizuală: `docs/design/test-de-nivel.md` §1 și §5. Pagina are fundal crem, zona testului degradeul hero, iar cardul e crem cu `max-width: 880px`.

- [ ] **Step 1: Scrie testul care pică**

`src/features/level-test/ui/LevelTest.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LevelTest from './LevelTest.astro';

describe('LevelTest.astro', () => {
  it('renders Ema, the bubble and a useful fallback without JavaScript', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LevelTest);
    expect(html).toContain('<level-test');
    expect(html).toContain('class="level-test__bubble"');
    expect(html).toContain('Hei, eu sunt Ema! Alege testul și începem.');
    expect(html).toContain('class="level-test__card"');
    expect(html).toContain('Testul pornește când JavaScript e activat în browser.');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toMatch(/<img[^>]*class="ema-portrait__img"/);
  });
});
```

Adaugă `'test-de-nivel/index.html'` în `PAGES` din `tests/pages/pages.test.ts`.

Run: `npx vitest run src/features/level-test/ui/LevelTest.test.ts`
Expected: FAIL

- [ ] **Step 2: Componenta**

`src/features/level-test/ui/LevelTest.astro`:

```astro
---
import EmaPortrait from '@shared/ui/EmaPortrait.astro';
import WhatsAppButton from '@shared/ui/WhatsAppButton.astro';
import './level-test.css';
---
<level-test class="level-test">
  <div class="level-test__ema">
    <EmaPortrait size="sm" alt="" />
    <p class="level-test__bubble">Hei, eu sunt Ema! Alege testul și începem.</p>
  </div>
  <div class="level-test__card">
    <div class="level-test__step">
      <h2 class="level-test__title">Ce fel de test vrei să facă copilul?</h2>
      <p class="level-test__fallback">
        Testul pornește când JavaScript e activat în browser. Până atunci, scrie-ne pe WhatsApp și îți spunem grupa
        potrivită.
      </p>
      <WhatsAppButton label="Scrie-ne pe WhatsApp" />
    </div>
  </div>
</level-test>

<script>
  import { defineLevelTest } from './level-test.element';
  defineLevelTest();
</script>
```

`src/features/level-test/index.ts`:

```ts
export { default as LevelTest } from './ui/LevelTest.astro';
```

- [ ] **Step 3: Stilurile**

`src/features/level-test/ui/level-test.css`. Valorile vin din `docs/design/test-de-nivel.md` §1 și §5. Constrângerile de contrast se aplică.

```css
.level-test {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: min(880px, 100%);
  margin-inline: auto;
}

.level-test__ema {
  display: flex;
  align-items: center;
  gap: 14px;
}

.level-test__ema .ema-portrait {
  --ema-size: 76px;
  --ema-ring: 5px;
}

.level-test__bubble {
  margin: 0;
  padding: 14px 18px;
  border-radius: 20px 20px 20px 4px;
  background: var(--color-white);
  color: var(--color-navy);
  font-weight: 800;
  font-size: clamp(1rem, 2vw, 1.1875rem);
  line-height: 1.3;
}

.level-test__card {
  min-height: 480px;
  padding: clamp(22px, 4vw, 44px);
  border-radius: 32px;
  background: var(--color-cream);
  color: var(--color-navy);
  box-shadow: 0 24px 48px rgb(120 40 0 / 0.25);
}

.level-test__step {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.level-test__title,
.level-test__question,
.level-test__result-title {
  margin: 0;
  outline-offset: 6px;
}

.level-test__title {
  font-size: clamp(1.75rem, 4.6vw, 3rem);
  line-height: 1.05;
}

.level-test__question {
  font-size: clamp(1.625rem, 4vw, 2.5rem);
  line-height: 1.1;
}

.level-test__eyebrow {
  margin: 0;
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 1.25rem;
  text-transform: uppercase;
  color: var(--color-text-accent);
}

.level-test__fallback {
  margin: 0;
  font-size: 1.125rem;
}

.level-test__modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 14px;
}

.level-test__mode,
.level-test__choice,
.level-test__option {
  border: 3px solid var(--color-navy);
  background: var(--color-white);
  color: var(--color-navy);
  font-family: var(--font-body);
  cursor: pointer;
}

.level-test__mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 26px;
  border-radius: 26px;
  box-shadow: 0 6px 0 var(--color-navy);
  text-align: left;
}

.level-test__mode-title {
  font-weight: 900;
  font-size: 1.625rem;
}

.level-test__mode-text {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.45;
}

.level-test__mode:hover,
.level-test__option:hover,
.level-test__choice[aria-pressed='true'] {
  background: var(--color-sun);
}

.level-test__label {
  margin: 0;
  font-weight: 800;
  font-size: 0.9375rem;
}

.level-test__choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(130px, 100%), 1fr));
  gap: 10px;
}

.level-test__choice {
  min-height: 56px;
  padding: 16px 8px;
  border-radius: 18px;
  box-shadow: 0 5px 0 var(--color-navy);
  font-weight: 900;
  font-size: var(--text-button);
}

.level-test__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
}

.level-test__link {
  padding: 8px 4px;
  border: 0;
  background: none;
  color: var(--color-navy);
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 0.9375rem;
  text-decoration: underline;
  cursor: pointer;
}

.level-test__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.level-test__chip {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-peach);
  color: var(--color-text-accent);
  font-weight: 900;
  font-size: 0.875rem;
}

.level-test__count {
  font-weight: 900;
  font-size: 0.9375rem;
}

.level-test__progress {
  height: 10px;
  border-radius: 99px;
  background: var(--color-cream-border);
  overflow: hidden;
}

.level-test__progress-fill {
  display: block;
  height: 100%;
  background: var(--color-orange);
}

.level-test__play {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 14px;
  padding: 14px 26px 14px 14px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-navy);
  color: var(--color-white);
  font-family: var(--font-body);
  font-weight: 900;
  font-size: var(--text-button);
  cursor: pointer;
}

.level-test__play:focus-visible {
  outline-color: var(--color-orange);
}

.level-test__play-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-sun);
}

.level-test__play-icon::after {
  content: '';
  width: 16px;
  height: 18px;
  margin-left: 4px;
  background: var(--color-navy);
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.level-test__color {
  width: 150px;
  aspect-ratio: 1;
  border: 6px solid var(--color-white);
  border-radius: 50%;
  background: var(--swatch);
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.12);
}

.level-test__stars {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.level-test__star {
  width: 64px;
  height: 64px;
  background: var(--color-sun);
  clip-path: polygon(50% 0, 64.5% 24.9%, 93.3% 25%, 79% 50%, 93.3% 75%, 64.5% 75.1%, 50% 100%, 35.5% 75.1%, 6.7% 75%, 21% 50%, 6.7% 25%, 35.5% 24.9%);
}

.level-test__passage {
  margin: 0;
  padding: 18px 20px;
  border-radius: 18px;
  background: var(--color-white);
  box-shadow: 0 2px 0 var(--color-cream-border);
  font-weight: 700;
  font-size: 1.1875rem;
  line-height: 1.5;
}

.level-test__passage p {
  margin: 0;
}

.level-test__note {
  font-size: 1rem;
  color: var(--color-text-accent);
}

.level-test__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: 12px;
}

.level-test__option {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 14px 16px;
  border-radius: 20px;
  box-shadow: 0 5px 0 var(--color-navy);
  font-weight: 900;
  font-size: 1.25rem;
  text-align: left;
}

.level-test__letter {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-navy);
  color: var(--color-white);
  font-size: 0.9375rem;
}

.level-test__result-title {
  font-size: clamp(2.125rem, 5.5vw, 3.5rem);
  line-height: 1;
}

.level-test__result-text {
  max-width: 620px;
  margin: 0;
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.5;
}

.level-test__result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 18px;
  align-items: start;
}

.level-test__skills {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  background: var(--color-white);
  box-shadow: 0 2px 0 var(--color-cream-border);
}

.level-test__skills-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.level-test__skills h3 {
  margin: 0;
  font-size: 1.25rem;
}

.level-test__total {
  font-weight: 900;
  font-size: 1.125rem;
  color: var(--color-text-accent);
}

.level-test__skills ul {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.level-test__skill {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  font-weight: 800;
  font-size: 0.9375rem;
}

.level-test__bar {
  grid-column: 1 / -1;
  height: 12px;
  border-radius: 99px;
  background: #f5e8d6;
  overflow: hidden;
}

.level-test__bar span {
  display: block;
  height: 100%;
}

.level-test__skill--vocabular .level-test__bar span {
  background: var(--color-sun);
}

.level-test__skill--gramatica .level-test__bar span {
  background: var(--color-orange);
}

.level-test__skill--citit .level-test__bar span {
  background: var(--color-navy);
}

.level-test__skill--ascultare .level-test__bar span {
  background: #25a55f;
}

.level-test__diploma {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 24px;
  background: var(--color-orange);
}

.level-test__name-label {
  color: var(--color-white);
  font-weight: 900;
  font-size: var(--text-button);
}

.level-test__name-input {
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-radius: 14px;
  color: var(--color-navy);
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 1.0625rem;
}

.level-test__name-input:focus-visible,
.level-test__diploma .button:focus-visible {
  outline-color: var(--color-white);
}

.level-test__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 20px;
  border: 3px dashed var(--color-sun);
  border-radius: 16px;
  background: var(--color-cream);
  text-align: center;
}

.level-test__preview-star {
  width: 40px;
  height: 40px;
  background: var(--color-sun);
  clip-path: polygon(50% 0, 64.5% 24.9%, 93.3% 25%, 79% 50%, 93.3% 75%, 64.5% 75.1%, 50% 100%, 35.5% 75.1%, 6.7% 75%, 21% 50%, 6.7% 25%, 35.5% 24.9%);
}

.level-test__preview-kicker {
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 1.125rem;
  text-transform: uppercase;
  color: var(--color-text-accent);
}

.level-test__preview-small {
  font-weight: 700;
  font-size: 0.8125rem;
}

.level-test__diploma-name {
  font-weight: 900;
  font-size: 1.875rem;
  line-height: 1;
  overflow-wrap: anywhere;
}

.level-test__diploma-name.is-empty {
  color: #8a7558;
}

.level-test__preview-line {
  font-weight: 700;
  font-size: 0.875rem;
}

.level-test__preview-title {
  font-weight: 900;
  font-size: 1.25rem;
  color: var(--color-text-accent);
}

.level-test__print {
  background: var(--color-white);
  color: var(--color-navy);
}

.level-test__diploma-error {
  margin: 0;
  color: var(--color-white);
  font-weight: 800;
  font-size: var(--text-button);
}

.level-test__diploma-error:empty {
  display: none;
}

.level-test__cta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
  background: var(--color-navy);
  color: var(--color-white);
}

.level-test__cta h3 {
  margin: 0 0 6px;
  font-size: 1.375rem;
}

.level-test__cta p {
  max-width: 460px;
  margin: 0;
  font-size: 1rem;
}

.level-test__cta .button:focus-visible {
  outline-color: var(--color-sun);
}
```

`.level-test__diploma-error` are `role="alert"`. `display: none` cât timp e gol e acceptabil, pentru că o regiune `role="alert"` anunță conținutul care apare. Dacă recenzia cere altfel, folosește tehnica „visually-hidden” de la filtrul de blog.

Culoarea `#8a7558` (numele gol în previzualizare) înlocuiește `#b9a58a` din design, care avea contrast 2.2:1 pe crem.

- [ ] **Step 4: Pagina**

`src/pages/test-de-nivel.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { LevelTest } from '@features/level-test';
import Footer from '@shared/ui/Footer.astro';
import Header from '@shared/ui/Header.astro';
---
<BaseLayout
  title="Test de nivel"
  description="Test de engleză gratuit pentru copii de 5–14 ani: 12 întrebări adaptate vârstei, cu audio, nivelul recomandat și diplomă la final."
>
  <Header active="test" />
  <main id="continut" class="level-test-page">
    <h1 class="visually-hidden">Test de nivel la engleză pentru copii</h1>
    <LevelTest />
  </main>
  <Footer />
</BaseLayout>

<style>
  .level-test-page {
    padding: 40px var(--gutter) 80px;
    background: var(--gradient-hero);
  }
</style>
```

- [ ] **Step 5: Rulează și verifică**

Run: `npx vitest run src/features/level-test`
Expected: PASS

Run: `npm run verify`
Expected: verde, inclusiv `test:dist` cu pagina nouă (o singură `h1`, descriere, `alt` pe imagini).

Verificare manuală (`npm run preview`, la 360, 768 și 1280px):
- un test complet de nivel;
- un test pentru examen;
- audio-ul pornește la întrebările de ascultare;
- diploma se descarcă ca PNG, iar tipărirea deschide dialogul A4 landscape;
- butonul WhatsApp deschide mesajul cu rezultatul;
- Tab ajunge la fiecare buton, cu focus vizibil;
- nu apare derulare orizontală.

- [ ] **Step 6: Commit**

```powershell
git add src/features/level-test src/pages/test-de-nivel.astro tests/pages/pages.test.ts
git commit -m "feat(level-test): add the level test page"
```

---

## După acest plan

1. **Etapa 4, formularul:**
   - `<lead-form source="test">` apare sub rezultat;
   - formularul ascultă `level-test.completed` și precompletează `testLevel`;
   - încep cu cerințele notate în planul fundației.
2. **Testul E2E Playwright „Test → diplomă → formular”** (spec §9) se scrie în etapa 7, după formular.
3. **Înainte de lansare:** o persoană verifică întrebările audio pe telefoane reale (iOS Safari, Android Chrome), pentru că vocea `en-GB` depinde de sistemul de operare.
