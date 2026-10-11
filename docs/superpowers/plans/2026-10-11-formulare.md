# Formular de rezervare (etapa 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Părintele lasă nume + telefon (+ vârsta copilului) din pagina principală, din pagina testului și din landing-ul `/lectie-demo/`; contactul se salvează în MySQL, vine pe email, apoi se deschide WhatsApp cu mesajul completat.

**Architecture:** O schemă Valibot comună (`src/shared/contracts/lead.schema.ts`) validează în browser și pe server. Browserul: feature nou `src/features/lead-capture/` (model pur, `api/lead.client.ts`, Web Component `<lead-form>`). Serverul: `POST /api/lead` în `server/handle-request.ts`, orchestrat de `server/leads/submit-lead.ts` prin porturi (repository, rate limit, notificare, ceas, logger) cu adaptoare MySQL (mysql2) și SMTP (nodemailer); `server/entry.node.ts` le leagă. Un job separat șterge datele expirate.

**Tech Stack:** Astro 7.3.8 (static), TypeScript ~6, Web Components light DOM, Valibot 1.5.0, mysql2 3.24.4, nodemailer 10.0.10, Vitest 5 (+ happy-dom), esbuild, MariaDB 10.11 în CI.

**Spec:** `docs/superpowers/specs/2026-10-09-site-englishminds-design.md` (§3 flux, §4 structură, §6 date și GDPR, §7 contract HTTP, §8 erori, §9 testare, §10 operare). Design: `design/EnglishMinds Lectie Demo.dc.html`, `docs/design/continut-pagini.md` (secțiunea contact din Site v2 și formularul din pagina Test).

## Global Constraints

- Node: `^22.22.3 || >=24.16.0` (din `package.json`). Astro rămâne `7.3.8`.
- Dependențe noi, versiuni exacte (fără `^`): `valibot@1.5.0`, `mysql2@3.24.4`, `nodemailer@10.0.10` (are tipuri proprii; nu instala `@types/nodemailer`).
- Fără `Co-Authored-By` și fără nicio mențiune Claude/AI în commituri sau PR-uri. Utilizatorul e singurul contribuitor.
- Texte de interfață în română, cu diacritice (ș, ț cu virgulă); codul în engleză.
- Doar `server/config/environment.ts` citește `process.env` (excepții deja configurate în ESLint: `astro.config.ts`, `server/**/*.test.ts`).
- `server/` importă din `src/` doar `src/shared/contracts/`. `src/` nu importă din `server/`.
- Fără `../../`; un singur `../` doar în interiorul aceluiași feature; fără `export *`; fără `catch {}` gol; aliasuri `@shared/*`, `@features/*` etc.
- `features/*/model/` nu folosește `window`, `document`, `fetch`, `sessionStorage` etc.
- Contract HTTP exact ca în spec §7: `201 {ok:true}`, `400 {ok:false,error:'validation',fields:[…]}`, `429 {ok:false,error:'rate_limited'}`, `500 {ok:false,error:'internal'}`.
- Fără date personale în log (fără nume, telefon, IP în clar). IP-ul se stochează doar ca SHA-256 cu salt.
- Contrast: text pe portocaliu ≥19px și ≥700 sau ≥24px; text mic `#b8461a` doar pe alb/crem/piersică; inel de focus navy pe galben/crem/alb, sun sau alb pe navy/portocaliu; text navy pe butonul WhatsApp.
- `npm run verify` verde înainte de fiecare commit.

## Review Focus

1. **Telefonul scris cum îl scriu părinții** (`+40 722 123 456`, `0040722123456`, `0722.123.456`, `(0722) 123 456`, fix `0264 123 456`) → normalizat `+40…`; numerele străine sau greșite → mesaj clar, nu eroare generică. Testat în Task 1.
2. **Dublu tap pe „Rezervă” / rețea lentă** → un singur POST, o singură fereastră WhatsApp. Testat în Task 8.
3. **Serverul sau baza de date picată** → părintele ajunge totuși pe WhatsApp cu mesajul, fără text brut de eroare; serverul răspunde 500 generic. Testat în Task 5 (500) și Task 8 (network/server).
4. **Diacritice în nume** (`Ștefănescu Ana`, `Ţurcan` cu sedilă) → ajung intacte în MySQL și în email. Testat în Task 6 și Task 7.
5. **Fereastră WhatsApp blocată** → părintele vede butoanele „Trimite pe WhatsApp” și „Sună-ne”. Testat în Task 8.

## Decizii (luate de controller; listate pentru utilizator)

1. **Bifă de acord** obligatorie (spec §6–§7), text-șablon de verificat de jurist: „Sunt de acord ca English Minds Academy să mă contacteze telefonic sau pe WhatsApp pentru lecția demo, conform politicii de confidențialitate.” Linkul duce la `/confidentialitate/` (pagina vine în etapa 6).
2. **Etichete vizibile** deasupra câmpurilor (designul are doar placeholder); placeholder-ul rămâne exemplu.
3. **WhatsApp** se deschide într-o fereastră deschisă sincron la trimitere (altfel Safari o blochează după `await`), apoi primește adresa `wa.me` după răspunsul serverului. La `validation`/`rate_limited` fereastra se închide.
4. **Server/rețea picate** → tot WhatsApp (spec §3.6), cu mesaj că rezervarea se finalizează acolo. Evenimentul `lead.submitted` se emite doar la `201`.
5. **`testLevel`** = `level:<slug>` sau `exam:<slug>` (ex. `level:movers`, `exam:a2-key`), pentru că sluguri de nivel și de examen se suprapun. Max 30 de caractere.
6. **Telefon**: doar numere din România (mobil 07…, fix 02…/03…), normalizate E.164.
7. **Limită**: fereastră fixă de o oră, 5 trimiteri pe hash de IP; coloana se numește `hits` (nu `count`).
8. **Teste MySQL**: rulează doar dacă există `TEST_DATABASE_URL`; CI pornește MariaDB 10.11 (cel mai apropiat de hostingurile cPanel). Local, fără bază, se sar.
9. **Migrații**: fișiere SQL importate manual din phpMyAdmin (documentat în `docs/operare/server.md`); fără runner în producție.
10. **Job de ștergere**: al doilea bundle, `dist-server/purge-expired-leads.cjs`, rulat de cron.
11. **UTM**: păstrate în `sessionStorage` (`em-utm`) pe durata vizitei, ca să nu se piardă la navigare; doar funcțional, fără tracking (de confirmat la jurist).
12. **Email**: destinatar din `MAIL_TO` (clientul trebuie să dea adresa); text simplu.
13. **Pagina testului**: formularul apare sub test după rezultat; butonul WhatsApp din rezultat rămâne.
14. **Landing `/lectie-demo/`**: antet propriu fără meniu (logo + telefon), footer fără CTA; fotografia `karina.jpg` (lipsă) e înlocuită cu `teacher-ema`. `?grupa=<slug>` preselectează vârsta.
15. **Fără JavaScript**: formularul rămâne ascuns; se vede un text cu WhatsApp și telefon.
16. **IP-ul clientului**: `TRUST_PROXY=true` pe cPanel/Passenger → primul IP din `X-Forwarded-For`; altfel adresa socketului. De verificat pe staging (spec §13.1).

---

### Task 1: Contracte — vârste, telefon, schema Valibot, evenimentul `lead.submitted`

**Files:**
- Create: `src/shared/contracts/age-groups.ts`, `src/shared/contracts/phone.ts`, `src/shared/contracts/phone.test.ts`, `src/shared/contracts/lead.schema.ts`, `src/shared/contracts/lead.schema.test.ts`
- Modify: `src/shared/content/site.ts` (mută `AGE_GROUPS` / `AgeGroup` în contracte, le re-exportă), `src/shared/contracts/domain-events.ts`, `src/shared/contracts/domain-events.test.ts`, `package.json`, `package-lock.json`

**Interfaces:**
- Produces:
  - `AGE_GROUPS`, `type AgeGroup` din `@shared/contracts/age-groups` (și re-exportate din `@shared/content/site`, ca importurile existente să meargă).
  - `normalizeRoPhone(input: string): string | null` din `@shared/contracts/phone`.
  - Din `@shared/contracts/lead.schema`: `LEAD_SOURCES`, `type LeadSource`, `TEST_LEVEL_PATTERN`, `LeadSchema`, `type Lead`, `type LeadField`, `type LeadRequest` (forma trimisă pe fir, nevalidată), `type LeadValidation`, `validateLead(input: unknown): LeadValidation`.
  - Din `@shared/contracts/domain-events`: `LEAD_SUBMITTED = 'lead.submitted'`, `type LeadSubmittedDetail = { source: LeadSource; ageGroup: AgeGroup | null }`, `createLeadSubmitted(detail)`.

- [ ] **Step 1: Instalează Valibot**

```bash
npm install --save-exact valibot@1.5.0
```

- [ ] **Step 2: Mută vârstele în contracte**

Creează `src/shared/contracts/age-groups.ts`:

```ts
export const AGE_GROUPS = ['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani'] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];
```

În `src/shared/content/site.ts` șterge definițiile `AGE_GROUPS` și `AgeGroup` și pune în locul lor:

```ts
import { AGE_GROUPS, type AgeGroup } from '@shared/contracts/age-groups';

export { AGE_GROUPS, type AgeGroup };
```

(Importul merge sus, cu celelalte importuri; re-exportul rămâne unde erau definițiile.) Rulează `npx vitest run src/shared src/features` — trebuie să rămână verde.

- [ ] **Step 3: Scrie testele pentru telefon (RED)**

`src/shared/contracts/phone.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeRoPhone } from './phone';

describe('normalizeRoPhone', () => {
  it.each([
    '0722123456',
    '0722 123 456',
    '0722.123.456',
    '0722-123-456',
    '(0722) 123 456',
    '+40722123456',
    '+40 722 123 456',
    '+40 (0) 722 123 456',
    '0040722123456',
    '40722123456',
  ])('normalizes %j to +40722123456', (input) => {
    expect(normalizeRoPhone(input)).toBe('+40722123456');
  });

  it('accepts landlines', () => {
    expect(normalizeRoPhone('0264 123 456')).toBe('+40264123456');
    expect(normalizeRoPhone('0364 123 456')).toBe('+40364123456');
  });

  it.each(['', '   ', '123', '0722 123 45', '07221234567', '0822 123 456', '+44 7911 123456', 'abc0722123456', '0722 123 456 ext 2'])(
    'rejects %j',
    (input) => {
      expect(normalizeRoPhone(input)).toBeNull();
    },
  );
});
```

Rulează: `npx vitest run src/shared/contracts/phone.test.ts` → FAIL (modul lipsă).

- [ ] **Step 4: Implementează `phone.ts` (GREEN)**

```ts
const SEPARATORS = /[\s().-]/g;
const RO_PHONE = /^(?:\+40|0040|40)?0?([237]\d{8})$/;

export function normalizeRoPhone(input: string): string | null {
  const match = RO_PHONE.exec(input.replace(SEPARATORS, ''));
  return match ? `+40${match[1]}` : null;
}
```

Rulează din nou → PASS.

- [ ] **Step 5: Scrie testele schemei (RED)**

`src/shared/contracts/lead.schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateLead, type LeadRequest } from './lead.schema';

const valid: LeadRequest = {
  parentName: '  Ana   Pop ',
  phone: '0722 123 456',
  childAgeGroup: '7–8 ani',
  source: 'home',
  testLevel: null,
  consent: true,
  policyVersion: '1',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  website: '',
  elapsedMs: 8400,
};

function fieldsOf(input: unknown): string[] {
  const result = validateLead(input);
  return result.ok ? [] : result.fields;
}

describe('validateLead', () => {
  it('accepts the spec example and normalizes name and phone', () => {
    const result = validateLead(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lead.parentName).toBe('Ana   Pop');
    expect(result.lead.phone).toBe('+40722123456');
    expect(result.lead).not.toHaveProperty('website');
    expect(result.lead).not.toHaveProperty('elapsedMs');
  });

  it('accepts a missing age group and empty UTM', () => {
    expect(validateLead({ ...valid, childAgeGroup: null, utm: { source: null, medium: null, campaign: null } }).ok).toBe(true);
  });

  it.each([
    ['parentName', { parentName: ' A ' }],
    ['parentName', { parentName: 'x'.repeat(101) }],
    ['parentName', { parentName: 'Ana\u0000Pop' }],
    ['phone', { phone: '+44 7911 123456' }],
    ['phone', { phone: '' }],
    ['childAgeGroup', { childAgeGroup: '4 ani' }],
    ['source', { source: 'facebook' }],
    ['consent', { consent: false }],
    ['policyVersion', { policyVersion: '0' }],
    ['utm', { utm: { source: 'x'.repeat(101), medium: null, campaign: null } }],
    ['testLevel', { testLevel: 'level:movers' }],
  ])('reports %s for %j', (field, patch) => {
    expect(fieldsOf({ ...valid, ...patch })).toEqual([field]);
  });

  it('accepts a test level only for the test source, in the level:/exam: format', () => {
    expect(validateLead({ ...valid, source: 'test', testLevel: 'level:movers' }).ok).toBe(true);
    expect(validateLead({ ...valid, source: 'test', testLevel: 'exam:a2-key' }).ok).toBe(true);
    expect(validateLead({ ...valid, source: 'test', testLevel: null }).ok).toBe(true);
    expect(fieldsOf({ ...valid, source: 'test', testLevel: 'movers' })).toEqual(['testLevel']);
    expect(fieldsOf({ ...valid, source: 'test', testLevel: 'level:<script>' })).toEqual(['testLevel']);
  });

  it('lists every invalid field once', () => {
    expect(fieldsOf({ ...valid, parentName: '', phone: '1', consent: false }).sort()).toEqual(['consent', 'parentName', 'phone']);
  });

  it('rejects non-objects without inventing field names', () => {
    expect(validateLead(null)).toEqual({ ok: false, fields: [] });
    expect(validateLead('text')).toEqual({ ok: false, fields: [] });
  });

  it('reports missing fields', () => {
    expect(fieldsOf({}).sort()).toEqual(['childAgeGroup', 'consent', 'parentName', 'phone', 'policyVersion', 'source', 'testLevel', 'utm']);
  });
});
```

Rulează → FAIL.

- [ ] **Step 6: Implementează `lead.schema.ts` (GREEN)**

```ts
import * as v from 'valibot';
import { AGE_GROUPS } from './age-groups';
import { normalizeRoPhone } from './phone';
import { POLICY_VERSION } from './policy';

export const LEAD_SOURCES = ['home', 'landing', 'test'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const TEST_LEVEL_PATTERN = /^(level|exam):[a-z0-9-]{1,24}$/;

const NO_CONTROL_CHARS = /^[^\p{Cc}]*$/u;

const utmValue = v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(100)));

export const LeadSchema = v.pipe(
  v.object({
    parentName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(100), v.regex(NO_CONTROL_CHARS)),
    phone: v.pipe(
      v.string(),
      v.maxLength(30),
      v.check((value) => normalizeRoPhone(value) !== null),
      v.transform((value) => normalizeRoPhone(value) ?? value),
    ),
    childAgeGroup: v.nullable(v.picklist(AGE_GROUPS)),
    source: v.picklist(LEAD_SOURCES),
    testLevel: v.nullable(v.pipe(v.string(), v.regex(TEST_LEVEL_PATTERN))),
    consent: v.literal(true),
    policyVersion: v.literal(POLICY_VERSION),
    utm: v.object({ source: utmValue, medium: utmValue, campaign: utmValue }),
  }),
  v.forward(
    v.partialCheck([['source'], ['testLevel']], (input) => input.source === 'test' || input.testLevel === null),
    ['testLevel'],
  ),
);

export type Lead = v.InferOutput<typeof LeadSchema>;
export type LeadField = keyof Lead;

/** Forma trimisă de browser, încă nevalidată. */
export type LeadRequest = {
  readonly parentName: string;
  readonly phone: string;
  readonly childAgeGroup: string | null;
  readonly source: string;
  readonly testLevel: string | null;
  readonly consent: boolean;
  readonly policyVersion: string;
  readonly utm: { readonly source: string | null; readonly medium: string | null; readonly campaign: string | null };
  readonly website: string;
  readonly elapsedMs: number;
};

export type LeadValidation = { readonly ok: true; readonly lead: Lead } | { readonly ok: false; readonly fields: LeadField[] };

const FIELDS: ReadonlySet<string> = new Set<LeadField>([
  'parentName',
  'phone',
  'childAgeGroup',
  'source',
  'testLevel',
  'consent',
  'policyVersion',
  'utm',
]);

export function validateLead(input: unknown): LeadValidation {
  const result = v.safeParse(LeadSchema, input);
  if (result.success) return { ok: true, lead: result.output };
  const fields = new Set<LeadField>();
  for (const issue of result.issues) {
    const key = issue.path?.[0]?.key;
    if (typeof key === 'string' && FIELDS.has(key)) fields.add(key as LeadField);
  }
  return { ok: false, fields: [...fields] };
}
```

Dacă API-ul Valibot 1.5 diferă (de ex. `partialCheck`/`forward`), adaptează minim cu aceeași semantică și notează în raport. Rulează → PASS.

- [ ] **Step 7: Evenimentul `lead.submitted` (RED → GREEN)**

Adaugă în `src/shared/contracts/domain-events.test.ts`:

```ts
import { LEAD_SUBMITTED, createLeadSubmitted } from './domain-events';

describe('createLeadSubmitted', () => {
  it('builds a bubbling, composed event with only source and age group', () => {
    const event = createLeadSubmitted({ source: 'landing', ageGroup: '9–10 ani' });
    expect(event.type).toBe(LEAD_SUBMITTED);
    expect(LEAD_SUBMITTED).toBe('lead.submitted');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail).toEqual({ source: 'landing', ageGroup: '9–10 ani' });
  });
});
```

(Combină importurile cu cele existente ale fișierului.) Adaugă în `domain-events.ts`:

```ts
import type { AgeGroup } from './age-groups';
import type { LeadSource } from './lead.schema';

export const LEAD_SUBMITTED = 'lead.submitted';

export type LeadSubmittedDetail = {
  readonly source: LeadSource;
  readonly ageGroup: AgeGroup | null;
};

export function createLeadSubmitted(detail: LeadSubmittedDetail): CustomEvent<LeadSubmittedDetail> {
  return new CustomEvent(LEAD_SUBMITTED, { detail, bubbles: true, composed: true });
}
```

- [ ] **Step 8: Verifică și commit**

```bash
npm run verify
git add package.json package-lock.json src/shared
git commit -m "feat(contracts): validate leads with a shared Valibot schema"
```

---

### Task 2: Modelul `lead-capture` — mesaj WhatsApp, rezultat test, UTM, vârsta preselectată

**Files:**
- Create: `src/features/lead-capture/model/whatsapp-message.ts`, `src/features/lead-capture/model/test-result.ts`, `src/features/lead-capture/model/utm.ts`, `src/features/lead-capture/model/age-preselect.ts`, `src/features/lead-capture/model/lead-capture.test.ts`

**Interfaces:**
- Consumes: `site.contact.whatsappUrl`, `site.levels` (`slug`, `name`, `ageGroup`), `TEST_LEVEL_PATTERN`, `AgeGroup`.
- Produces:
  - `type WhatsappLead = { parentName: string; phone: string; childAgeGroup: AgeGroup | null; testResult: string | null }`, `leadWhatsappText(lead): string`, `leadWhatsappUrl(lead): string`.
  - `type TestOutcome = { mode: 'level' | 'exam'; level: string }`, `testLevelCode(outcome): string | null`, `testResultLabel(outcome): string`.
  - `type Utm = { source: string | null; medium: string | null; campaign: string | null }`, `EMPTY_UTM`, `UTM_STORAGE_KEY = 'em-utm'`, `parseUtm(search: string): Utm | null`, `parseStoredUtm(raw: string | null): Utm | null`.
  - `ageGroupForLevel(slug: string): AgeGroup | null`.

- [ ] **Step 1: Teste (RED)**

`src/features/lead-capture/model/lead-capture.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ageGroupForLevel } from './age-preselect';
import { testLevelCode, testResultLabel } from './test-result';
import { EMPTY_UTM, parseStoredUtm, parseUtm } from './utm';
import { leadWhatsappText, leadWhatsappUrl } from './whatsapp-message';

describe('leadWhatsappText', () => {
  const base = { parentName: '  Ana  Pop ', phone: ' 0722  123 456 ', childAgeGroup: null, testResult: null };

  it('introduces the parent with the phone they typed', () => {
    expect(leadWhatsappText(base)).toBe('Bună ziua! Sunt Ana Pop (0722 123 456). Aș dori o lecție demo gratuită.');
  });

  it('mentions the child age group when chosen', () => {
    expect(leadWhatsappText({ ...base, childAgeGroup: '7–8 ani' })).toBe(
      'Bună ziua! Sunt Ana Pop (0722 123 456). Aș dori o lecție demo gratuită pentru copilul meu (7–8 ani).',
    );
  });

  it('mentions the test result instead of the age group', () => {
    expect(leadWhatsappText({ ...base, childAgeGroup: '7–8 ani', testResult: 'grupa recomandată Movers' })).toBe(
      'Bună ziua! Sunt Ana Pop (0722 123 456). Am făcut testul de nivel: grupa recomandată Movers. Aș dori o lecție demo gratuită.',
    );
  });

  it('builds an encoded wa.me link', () => {
    const url = leadWhatsappUrl({ ...base, parentName: 'Ștefan & Co' });
    expect(url.startsWith('https://wa.me/40775630680?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1] ?? '')).toContain('Sunt Ștefan & Co (0722 123 456)');
  });
});

describe('test result', () => {
  it('encodes mode and level for the server', () => {
    expect(testLevelCode({ mode: 'level', level: 'movers' })).toBe('level:movers');
    expect(testLevelCode({ mode: 'exam', level: 'a2-key' })).toBe('exam:a2-key');
    expect(testLevelCode({ mode: 'level', level: 'b1-preliminary' })).toBe('level:b1-preliminary');
    expect(testLevelCode({ mode: 'level', level: 'Not A Slug' })).toBeNull();
  });

  it('labels the result in Romanian', () => {
    expect(testResultLabel({ mode: 'level', level: 'movers' })).toBe('grupa recomandată Movers');
    expect(testResultLabel({ mode: 'level', level: 'b1-preliminary' })).toBe('grupa recomandată B1 Preliminary');
    expect(testResultLabel({ mode: 'exam', level: 'a2-key' })).toBe('test pentru examenul Cambridge A2 Key');
    expect(testResultLabel({ mode: 'level', level: 'necunoscut' })).toBe('grupa recomandată necunoscut');
  });
});

describe('utm', () => {
  it('reads the three UTM parameters, trimmed and capped at 100 characters', () => {
    expect(parseUtm(`?utm_source=%20instagram%20&utm_medium=paid&utm_campaign=${'x'.repeat(120)}&x=1`)).toEqual({
      source: 'instagram',
      medium: 'paid',
      campaign: 'x'.repeat(100),
    });
  });

  it('returns null when no UTM parameter is present or all are empty', () => {
    expect(parseUtm('?grupa=movers')).toBeNull();
    expect(parseUtm('?utm_source=&utm_medium=%20')).toBeNull();
    expect(parseUtm('')).toBeNull();
  });

  it('keeps partial UTM', () => {
    expect(parseUtm('?utm_campaign=demo')).toEqual({ ...EMPTY_UTM, campaign: 'demo' });
  });

  it('reads stored UTM defensively', () => {
    expect(parseStoredUtm(JSON.stringify({ source: 'fb', medium: null, campaign: 'c' }))).toEqual({ source: 'fb', medium: null, campaign: 'c' });
    expect(parseStoredUtm(null)).toBeNull();
    expect(parseStoredUtm('{broken')).toBeNull();
    expect(parseStoredUtm(JSON.stringify({ source: 5 }))).toBeNull();
    expect(parseStoredUtm(JSON.stringify({ source: null, medium: null, campaign: null }))).toBeNull();
  });
});

describe('ageGroupForLevel', () => {
  it('maps a level slug to its age group', () => {
    expect(ageGroupForLevel('movers')).toBe('9–10 ani');
    expect(ageGroupForLevel('a2-key')).toBe('13–14 ani');
  });

  it('ignores unknown slugs', () => {
    expect(ageGroupForLevel('b1-preliminary')).toBeNull();
    expect(ageGroupForLevel('')).toBeNull();
  });
});
```

Rulează `npx vitest run src/features/lead-capture` → FAIL.

- [ ] **Step 2: Implementează (GREEN)**

`whatsapp-message.ts`:

```ts
import type { AgeGroup } from '@shared/contracts/age-groups';
import { site } from '@shared/content/site';

export type WhatsappLead = {
  readonly parentName: string;
  readonly phone: string;
  readonly childAgeGroup: AgeGroup | null;
  readonly testResult: string | null;
};

const tidy = (value: string): string => value.trim().replace(/\s+/g, ' ');

export function leadWhatsappText(lead: WhatsappLead): string {
  const intro = `Bună ziua! Sunt ${tidy(lead.parentName)} (${tidy(lead.phone)}).`;
  if (lead.testResult) return `${intro} Am făcut testul de nivel: ${lead.testResult}. Aș dori o lecție demo gratuită.`;
  if (lead.childAgeGroup) return `${intro} Aș dori o lecție demo gratuită pentru copilul meu (${lead.childAgeGroup}).`;
  return `${intro} Aș dori o lecție demo gratuită.`;
}

export function leadWhatsappUrl(lead: WhatsappLead): string {
  return `${site.contact.whatsappUrl}?text=${encodeURIComponent(leadWhatsappText(lead))}`;
}
```

`test-result.ts`:

```ts
import { TEST_LEVEL_PATTERN } from '@shared/contracts/lead.schema';
import { site } from '@shared/content/site';

export type TestOutcome = {
  readonly mode: 'level' | 'exam';
  readonly level: string;
};

const EXTRA_NAMES: Readonly<Record<string, string>> = { 'b1-preliminary': 'B1 Preliminary' };

function levelName(slug: string): string {
  return site.levels.find((level) => level.slug === slug)?.name ?? EXTRA_NAMES[slug] ?? slug;
}

export function testLevelCode(outcome: TestOutcome): string | null {
  const code = `${outcome.mode}:${outcome.level}`;
  return TEST_LEVEL_PATTERN.test(code) ? code : null;
}

export function testResultLabel(outcome: TestOutcome): string {
  const name = levelName(outcome.level);
  return outcome.mode === 'exam' ? `test pentru examenul Cambridge ${name}` : `grupa recomandată ${name}`;
}
```

`utm.ts`:

```ts
export type Utm = {
  readonly source: string | null;
  readonly medium: string | null;
  readonly campaign: string | null;
};

export const EMPTY_UTM: Utm = Object.freeze({ source: null, medium: null, campaign: null });
export const UTM_STORAGE_KEY = 'em-utm';

const KEYS = ['source', 'medium', 'campaign'] as const;

const clean = (value: string | null): string | null => {
  const trimmed = value?.trim().slice(0, 100) ?? '';
  return trimmed === '' ? null : trimmed;
};

const hasAny = (utm: Utm): boolean => KEYS.some((key) => utm[key] !== null);

export function parseUtm(search: string): Utm | null {
  const params = new URLSearchParams(search);
  const utm: Utm = {
    source: clean(params.get('utm_source')),
    medium: clean(params.get('utm_medium')),
    campaign: clean(params.get('utm_campaign')),
  };
  return hasAny(utm) ? utm : null;
}

export function parseStoredUtm(raw: string | null): Utm | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const read = (key: (typeof KEYS)[number]): string | null | undefined => {
    const value = record[key];
    if (value === null) return null;
    return typeof value === 'string' ? clean(value) : undefined;
  };
  const source = read('source');
  const medium = read('medium');
  const campaign = read('campaign');
  if (source === undefined || medium === undefined || campaign === undefined) return null;
  const utm: Utm = { source, medium, campaign };
  return hasAny(utm) ? utm : null;
}
```

(`catch { return null; }` nu e gol: întoarce explicit „fără UTM”.)

`age-preselect.ts`:

```ts
import type { AgeGroup } from '@shared/contracts/age-groups';
import { site } from '@shared/content/site';

export function ageGroupForLevel(slug: string): AgeGroup | null {
  return site.levels.find((level) => level.slug === slug)?.ageGroup ?? null;
}
```

Rulează → PASS.

- [ ] **Step 3: Verifică și commit**

```bash
npm run verify
git add src/features/lead-capture
git commit -m "feat(lead-capture): build the WhatsApp message, test result and UTM model"
```

---

### Task 3: Clientul HTTP `lead.client.ts`

**Files:**
- Create: `src/features/lead-capture/api/lead.client.ts`, `src/features/lead-capture/api/lead.client.test.ts`

**Interfaces:**
- Consumes: `type LeadRequest` (Task 1).
- Produces: `LEAD_ENDPOINT = '/api/lead'`, `type SubmitLeadResult = { kind: 'ok' } | { kind: 'validation'; fields: string[] } | { kind: 'rate_limited' } | { kind: 'network' } | { kind: 'server' }`, `submitLead(request: LeadRequest, fetchImpl?: typeof fetch, timeoutMs?: number): Promise<SubmitLeadResult>`.

- [ ] **Step 1: Teste (RED)**

```ts
import { describe, expect, it, vi } from 'vitest';
import type { LeadRequest } from '@shared/contracts/lead.schema';
import { LEAD_ENDPOINT, submitLead } from './lead.client';

const request: LeadRequest = {
  parentName: 'Ana Pop',
  phone: '0722 123 456',
  childAgeGroup: null,
  source: 'home',
  testLevel: null,
  consent: true,
  policyVersion: '1',
  utm: { source: null, medium: null, campaign: null },
  website: '',
  elapsedMs: 5000,
};

const reply = (status: number, body: unknown): Response =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('submitLead', () => {
  it('POSTs JSON to the endpoint', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(201, { ok: true }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'ok' });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(LEAD_ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual(request);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('maps 400 to validation with only string field names', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(400, { ok: false, error: 'validation', fields: ['phone', 3, 'consent'] }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'validation', fields: ['phone', 'consent'] });
  });

  it('maps a 400 without a JSON body to validation with no fields', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(400, '<html>'));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'validation', fields: [] });
  });

  it('maps 429 to rate_limited', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(429, { ok: false, error: 'rate_limited' }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'rate_limited' });
  });

  it.each([500, 502, 503, 404])('maps %i to server', async (status) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(status, { ok: false }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'server' });
  });

  it('maps a thrown fetch (offline, timeout) to network', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'network' });
  });

  it('aborts after the timeout', async () => {
    const fetchImpl = vi.fn<typeof fetch>((_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'TimeoutError')));
      }),
    );
    await expect(submitLead(request, fetchImpl, 20)).resolves.toEqual({ kind: 'network' });
  });
});
```

- [ ] **Step 2: Implementează (GREEN)**

```ts
import type { LeadRequest } from '@shared/contracts/lead.schema';

export const LEAD_ENDPOINT = '/api/lead';

export type SubmitLeadResult =
  | { readonly kind: 'ok' }
  | { readonly kind: 'validation'; readonly fields: string[] }
  | { readonly kind: 'rate_limited' }
  | { readonly kind: 'network' }
  | { readonly kind: 'server' };

async function fieldsFrom(response: Response): Promise<string[]> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return [];
  }
  const fields = typeof body === 'object' && body !== null ? (body as { fields?: unknown }).fields : undefined;
  return Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : [];
}

export async function submitLead(
  request: LeadRequest,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 10_000,
): Promise<SubmitLeadResult> {
  let response: Response;
  try {
    response = await fetchImpl(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { kind: 'network' };
  }
  if (response.status === 201) return { kind: 'ok' };
  if (response.status === 429) return { kind: 'rate_limited' };
  if (response.status === 400) return { kind: 'validation', fields: await fieldsFrom(response) };
  return { kind: 'server' };
}
```

- [ ] **Step 3: Verifică și commit**

```bash
npm run verify
git add src/features/lead-capture/api
git commit -m "feat(lead-capture): send leads and map every response to a typed result"
```

---

### Task 4: Configurarea serverului

**Files:**
- Modify: `server/config/environment.ts`, `server/config/environment.test.ts`
- Create: `.env.example`

**Interfaces:**
- Produces:

```ts
export type Environment = Readonly<{
  port: number;
  db: Readonly<{ host: string; port: number; user: string; password: string; database: string }>;
  smtp: Readonly<{ host: string; port: number; user: string; password: string }>;
  mail: Readonly<{ from: string; to: string }>;
  ipHashSalt: string;
  trustProxy: boolean;
}>;
export function readEnvironment(env?: NodeJS.ProcessEnv): Environment;
```

- [ ] **Step 1: Teste (RED)**

Înlocuiește `server/config/environment.test.ts` cu:

```ts
import { describe, expect, it } from 'vitest';
import { readEnvironment } from './environment';

const BASE = {
  PORT: '8080',
  DB_HOST: 'localhost',
  DB_USER: 'em_user',
  DB_PASSWORD: 'secret',
  DB_NAME: 'em_site',
  SMTP_HOST: 'mail.example.ro',
  SMTP_USER: 'site@example.ro',
  SMTP_PASSWORD: 'mail-secret',
  MAIL_FROM: 'site@example.ro',
  MAIL_TO: 'office@example.ro',
  IP_HASH_SALT: 's'.repeat(32),
};

describe('readEnvironment', () => {
  it('reads a complete configuration with defaults', () => {
    expect(readEnvironment(BASE)).toEqual({
      port: 8080,
      db: { host: 'localhost', port: 3306, user: 'em_user', password: 'secret', database: 'em_site' },
      smtp: { host: 'mail.example.ro', port: 465, user: 'site@example.ro', password: 'mail-secret' },
      mail: { from: 'site@example.ro', to: 'office@example.ro' },
      ipHashSalt: 's'.repeat(32),
      trustProxy: false,
    });
  });

  it('defaults PORT to 3000', () => {
    expect(readEnvironment({ ...BASE, PORT: undefined }).port).toBe(3000);
  });

  it('reads optional ports and the proxy flag', () => {
    const env = readEnvironment({ ...BASE, DB_PORT: '3307', SMTP_PORT: '587', TRUST_PROXY: 'true' });
    expect(env.db.port).toBe(3307);
    expect(env.smtp.port).toBe(587);
    expect(env.trustProxy).toBe(true);
  });

  it.each(['abc', '0', '70000', '80.5', ''])('rejects PORT=%j with a clear message', (value) => {
    expect(() => readEnvironment({ ...BASE, PORT: value })).toThrow(`PORT invalid: "${value}"`);
  });

  it('rejects an invalid DB_PORT', () => {
    expect(() => readEnvironment({ ...BASE, DB_PORT: 'x' })).toThrow('DB_PORT invalid: "x"');
  });

  it.each(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'MAIL_TO', 'IP_HASH_SALT'])(
    'requires %s',
    (name) => {
      expect(() => readEnvironment({ ...BASE, [name]: '  ' })).toThrow(`Missing environment variable: ${name}`);
    },
  );

  it('requires a salt of at least 32 characters', () => {
    expect(() => readEnvironment({ ...BASE, IP_HASH_SALT: 'short' })).toThrow('IP_HASH_SALT must have at least 32 characters');
  });

  it.each(['MAIL_FROM', 'MAIL_TO'])('requires an email address in %s', (name) => {
    expect(() => readEnvironment({ ...BASE, [name]: 'office' })).toThrow(`${name} invalid: "office"`);
  });

  it('rejects an unknown TRUST_PROXY value', () => {
    expect(() => readEnvironment({ ...BASE, TRUST_PROXY: 'yes' })).toThrow('TRUST_PROXY invalid: "yes"');
  });

  it('returns a deeply frozen object', () => {
    const env = readEnvironment(BASE);
    expect(Object.isFrozen(env)).toBe(true);
    expect(Object.isFrozen(env.db)).toBe(true);
    expect(Object.isFrozen(env.smtp)).toBe(true);
    expect(Object.isFrozen(env.mail)).toBe(true);
  });
});
```

- [ ] **Step 2: Implementează (GREEN)**

```ts
export type Environment = Readonly<{
  port: number;
  db: Readonly<{ host: string; port: number; user: string; password: string; database: string }>;
  smtp: Readonly<{ host: string; port: number; user: string; password: string }>;
  mail: Readonly<{ from: string; to: string }>;
  ipHashSalt: string;
  trustProxy: boolean;
}>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim() ?? '';
  if (value === '') throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function portOf(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name] ?? String(fallback);
  const port = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} invalid: "${raw}"`);
  }
  return port;
}

function emailOf(env: NodeJS.ProcessEnv, name: string): string {
  const value = required(env, name);
  if (!EMAIL.test(value)) throw new Error(`${name} invalid: "${value}"`);
  return value;
}

function flagOf(env: NodeJS.ProcessEnv, name: string): boolean {
  const raw = env[name]?.trim() ?? '';
  if (raw === '' || raw === 'false') return false;
  if (raw === 'true') return true;
  throw new Error(`${name} invalid: "${raw}"`);
}

export function readEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const ipHashSalt = required(env, 'IP_HASH_SALT');
  if (ipHashSalt.length < 32) throw new Error('IP_HASH_SALT must have at least 32 characters');
  return Object.freeze({
    port: portOf(env, 'PORT', 3000),
    db: Object.freeze({
      host: required(env, 'DB_HOST'),
      port: portOf(env, 'DB_PORT', 3306),
      user: required(env, 'DB_USER'),
      password: required(env, 'DB_PASSWORD'),
      database: required(env, 'DB_NAME'),
    }),
    smtp: Object.freeze({
      host: required(env, 'SMTP_HOST'),
      port: portOf(env, 'SMTP_PORT', 465),
      user: required(env, 'SMTP_USER'),
      password: required(env, 'SMTP_PASSWORD'),
    }),
    mail: Object.freeze({ from: emailOf(env, 'MAIL_FROM'), to: emailOf(env, 'MAIL_TO') }),
    ipHashSalt,
    trustProxy: flagOf(env, 'TRUST_PROXY'),
  });
}
```

Notă: `server/entry.node.test.ts` pornește bundle-ul doar cu `PORT`; după acest task pică. Nu-l repara aici: Task 7 îi dă mediul complet. Ca `npm run verify` să treacă la commit, în acest task adaugă deja în `entry.node.test.ts`, la `spawn`, mediul de test:

```ts
const TEST_ENV = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1',
  SMTP_USER: 'test',
  SMTP_PASSWORD: 'test',
  MAIL_FROM: 'site@example.test',
  MAIL_TO: 'office@example.test',
  IP_HASH_SALT: 'x'.repeat(32),
};
// ...
child = spawn(process.execPath, [outfile], { env: { ...process.env, ...TEST_ENV, PORT: String(port) } });
```

- [ ] **Step 3: `.env.example`**

```dotenv
# Copiază în .env (nu se comite). Pe cPanel: variabile de mediu ale aplicației Node.
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
MAIL_TO=
# Cel puțin 32 de caractere aleatorii; schimbarea lui resetează limitele de trimitere.
IP_HASH_SALT=
# true în spatele proxy-ului cPanel/Passenger (IP-ul vine din X-Forwarded-For)
TRUST_PROXY=false
```

`.gitignore` ignoră `.env.*`; adaugă imediat după linia `.env.*` linia `!.env.example`.

- [ ] **Step 4: Verifică și commit**

```bash
npm run verify
git add server/config server/entry.node.test.ts .env.example .gitignore
git commit -m "feat(server): validate database, mail and proxy settings at startup"
```

---

### Task 5: `POST /api/lead` — orchestrare și rutare, cu fake-uri

**Files:**
- Create: `server/leads/ports.ts`, `server/leads/ip-hash.ts`, `server/leads/submit-lead.ts`, `server/leads/submit-lead.test.ts`, `server/client-ip.ts`, `server/client-ip.test.ts`, `tests/support/lead-fakes.ts`
- Modify: `server/handle-request.ts`, `server/handle-request.test.ts`, `server/entry.node.ts` (doar semnătura nouă, cu adaptoare temporare — vezi Step 7), `tsconfig.json` (alias `@test-support/*`)

**Interfaces:**
- Consumes: `validateLead`, `type Lead`, `type LeadField` (Task 1); `POLICY_VERSION`.
- Produces:

```ts
// server/leads/ports.ts
export type LeadRecord = Lead & { readonly consentAt: Date; readonly createdAt: Date };
export interface LeadRepository { save(record: LeadRecord): Promise<void>; deleteCreatedBefore(cutoff: Date): Promise<number>; }
export interface RateLimiter { hit(key: string, now: Date): Promise<boolean>; deleteWindowsBefore(cutoff: Date): Promise<number>; }
export interface LeadNotifier { notify(record: LeadRecord): Promise<void>; }
export interface Clock { now(): Date; }
export type LogContext = Readonly<Record<string, unknown>>;
export interface Logger { info(message: string, context?: LogContext): void; warn(message: string, context?: LogContext): void; error(message: string, context?: LogContext): void; }
export const systemClock: Clock;
export const consoleLogger: Logger;

// server/leads/ip-hash.ts
export function hashIp(ip: string, salt: string): string; // hex SHA-256, 64 caractere

// server/leads/submit-lead.ts
export const MIN_ELAPSED_MS = 3000;
export type SubmitLeadDeps = { repository: LeadRepository; rateLimiter: RateLimiter; notifier: LeadNotifier; clock: Clock; logger: Logger; hashIp: (ip: string) => string };
export type SubmitLeadOutcome = { status: 201 } | { status: 400; fields: LeadField[] } | { status: 429 } | { status: 500 };
export function isLikelyBot(body: unknown): boolean;
export function submitLead(body: unknown, clientIp: string | null, deps: SubmitLeadDeps): Promise<SubmitLeadOutcome>;

// server/client-ip.ts
export function clientIpOf(forwardedFor: string | string[] | undefined, remoteAddress: string | undefined, trustProxy: boolean): string | null;

// server/handle-request.ts
export type RequestContext = { readonly clientIp: string | null };
export type RequestHandler = (request: Request, context: RequestContext) => Promise<Response>;
export const MAX_BODY_BYTES = 10_000;
export function createRequestHandler(deps: SubmitLeadDeps): RequestHandler;
```

- [ ] **Step 1: Alias pentru fake-uri**

În `tsconfig.json`, la `compilerOptions.paths`, adaugă `"@test-support/*": ["./tests/support/*"]` și `"@server/*": ["./server/*"]` (fake-urile din `tests/support/` importă porturile prin `@server/...`, pentru că `../../` e interzis). `@server/*` e doar pentru `tests/`; regula `src-not-to-server` din dependency-cruiser oprește în continuare `src/` → `server/`. (Vitest primește aliasurile prin `getViteConfig`; dacă nu, adaugă-le și în `vitest.config.ts` și notează în raport.)

- [ ] **Step 2: Porturi, ceas, logger, hash**

`server/leads/ports.ts`:

```ts
import type { Lead } from '@shared/contracts/lead.schema';

export type LeadRecord = Lead & { readonly consentAt: Date; readonly createdAt: Date };

export interface LeadRepository {
  save(record: LeadRecord): Promise<void>;
  deleteCreatedBefore(cutoff: Date): Promise<number>;
}

export interface RateLimiter {
  /** Numără o încercare; întoarce `false` dacă limita ferestrei curente e depășită. */
  hit(key: string, now: Date): Promise<boolean>;
  deleteWindowsBefore(cutoff: Date): Promise<number>;
}

export interface LeadNotifier {
  notify(record: LeadRecord): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export type LogContext = Readonly<Record<string, unknown>>;

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export const systemClock: Clock = { now: () => new Date() };

export const consoleLogger: Logger = {
  info: (message, context) => console.info(message, context ?? {}),
  warn: (message, context) => console.warn(message, context ?? {}),
  error: (message, context) => console.error(message, context ?? {}),
};
```

`server/leads/ip-hash.ts`:

```ts
import { createHash } from 'node:crypto';

export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
```

- [ ] **Step 3: Fake-uri**

`tests/support/lead-fakes.ts`:

```ts
import type { Clock, LeadNotifier, LeadRecord, LeadRepository, LogContext, Logger, RateLimiter } from '@server/leads/ports';

export class FakeLeadRepository implements LeadRepository {
  readonly saved: LeadRecord[] = [];
  failWith: Error | null = null;

  async save(record: LeadRecord): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.saved.push(record);
  }

  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const before = this.saved.length;
    this.saved.splice(0, this.saved.length, ...this.saved.filter((record) => record.createdAt >= cutoff));
    return before - this.saved.length;
  }
}

export class FakeRateLimiter implements RateLimiter {
  readonly keys: string[] = [];
  allow = true;
  failWith: Error | null = null;

  async hit(key: string): Promise<boolean> {
    if (this.failWith) throw this.failWith;
    this.keys.push(key);
    return this.allow;
  }

  async deleteWindowsBefore(): Promise<number> {
    return 0;
  }
}

export class FakeNotifier implements LeadNotifier {
  readonly sent: LeadRecord[] = [];
  failWith: Error | null = null;

  async notify(record: LeadRecord): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(record);
  }
}

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

export class RecordingLogger implements Logger {
  readonly entries: { level: 'info' | 'warn' | 'error'; message: string; context?: LogContext }[] = [];
  info(message: string, context?: LogContext): void {
    this.entries.push({ level: 'info', message, context });
  }
  warn(message: string, context?: LogContext): void {
    this.entries.push({ level: 'warn', message, context });
  }
  error(message: string, context?: LogContext): void {
    this.entries.push({ level: 'error', message, context });
  }
}
```

- [ ] **Step 4: Teste `submit-lead` (RED)**

`server/leads/submit-lead.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { FakeLeadRepository, FakeNotifier, FakeRateLimiter, RecordingLogger, fixedClock } from '@test-support/lead-fakes';
import { isLikelyBot, submitLead, type SubmitLeadDeps } from './submit-lead';

const NOW = '2026-10-11T09:30:00.000Z';

const body = {
  parentName: 'Ștefănescu Ana',
  phone: '0722 123 456',
  childAgeGroup: '7–8 ani',
  source: 'landing',
  testLevel: null,
  consent: true,
  policyVersion: '1',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  website: '',
  elapsedMs: 8400,
};

let repository: FakeLeadRepository;
let rateLimiter: FakeRateLimiter;
let notifier: FakeNotifier;
let logger: RecordingLogger;
let deps: SubmitLeadDeps;

beforeEach(() => {
  repository = new FakeLeadRepository();
  rateLimiter = new FakeRateLimiter();
  notifier = new FakeNotifier();
  logger = new RecordingLogger();
  deps = { repository, rateLimiter, notifier, logger, clock: fixedClock(NOW), hashIp: (ip) => `hash(${ip})` };
});

const logged = (): string => JSON.stringify(logger.entries);

describe('submitLead', () => {
  it('saves a valid lead with server timestamps, notifies and answers 201', async () => {
    await expect(submitLead(body, '203.0.113.7', deps)).resolves.toEqual({ status: 201 });
    expect(repository.saved).toHaveLength(1);
    const record = repository.saved[0];
    expect(record).toMatchObject({ parentName: 'Ștefănescu Ana', phone: '+40722123456', source: 'landing', policyVersion: '1' });
    expect(record?.consentAt.toISOString()).toBe(NOW);
    expect(record?.createdAt.toISOString()).toBe(NOW);
    expect(record).not.toHaveProperty('website');
    expect(notifier.sent).toEqual([record]);
    expect(rateLimiter.keys).toEqual(['hash(203.0.113.7)']);
  });

  it('answers 400 with the invalid fields and touches nothing', async () => {
    await expect(submitLead({ ...body, phone: '123', consent: false }, '1.1.1.1', deps)).resolves.toEqual({
      status: 400,
      fields: expect.arrayContaining(['phone', 'consent']),
    });
    expect(rateLimiter.keys).toEqual([]);
    expect(repository.saved).toEqual([]);
  });

  it('answers 429 when the limit is reached, without saving', async () => {
    rateLimiter.allow = false;
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 429 });
    expect(repository.saved).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });

  it('uses a shared bucket when the client IP is unknown', async () => {
    await submitLead(body, null, deps);
    expect(rateLimiter.keys).toEqual(['hash(unknown)']);
  });

  it.each([
    ['a filled honeypot', { website: 'http://spam.example' }],
    ['a form filled under 3 seconds', { elapsedMs: 2999 }],
    ['a missing elapsedMs', { elapsedMs: undefined }],
    ['a non-numeric elapsedMs', { elapsedMs: '9000' }],
  ])('answers 201 without saving for %s', async (_label, patch) => {
    await expect(submitLead({ ...body, ...patch }, '1.1.1.1', deps)).resolves.toEqual({ status: 201 });
    expect(repository.saved).toEqual([]);
    expect(rateLimiter.keys).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });

  it('answers 500 and logs without personal data when saving fails', async () => {
    repository.failWith = new Error('ER_ACCESS_DENIED');
    await expect(submitLead(body, '203.0.113.7', deps)).resolves.toEqual({ status: 500 });
    expect(logger.entries.some((entry) => entry.level === 'error')).toBe(true);
    expect(logged()).not.toMatch(/Ștefănescu|0722|\+40722|203\.0\.113\.7/);
  });

  it('answers 500 when the rate limiter fails', async () => {
    rateLimiter.failWith = new Error('ECONNREFUSED');
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 500 });
    expect(repository.saved).toEqual([]);
  });

  it('keeps 201 and warns when the email fails after saving', async () => {
    notifier.failWith = new Error('SMTP timeout');
    await expect(submitLead(body, '1.1.1.1', deps)).resolves.toEqual({ status: 201 });
    expect(repository.saved).toHaveLength(1);
    expect(logger.entries.some((entry) => entry.level === 'warn')).toBe(true);
    expect(logged()).not.toMatch(/Ștefănescu|0722/);
  });
});

describe('isLikelyBot', () => {
  it('lets non-objects through to validation', () => {
    expect(isLikelyBot(null)).toBe(false);
    expect(isLikelyBot('x')).toBe(false);
  });

  it('accepts a whitespace-only honeypot as empty', () => {
    expect(isLikelyBot({ website: '  ', elapsedMs: 5000 })).toBe(false);
  });
});
```

- [ ] **Step 5: Implementează `submit-lead.ts` (GREEN)**

```ts
import { validateLead, type LeadField } from '@shared/contracts/lead.schema';
import type { Clock, LeadNotifier, LeadRecord, LeadRepository, Logger, RateLimiter } from './ports';

export const MIN_ELAPSED_MS = 3000;

export type SubmitLeadDeps = {
  readonly repository: LeadRepository;
  readonly rateLimiter: RateLimiter;
  readonly notifier: LeadNotifier;
  readonly clock: Clock;
  readonly logger: Logger;
  readonly hashIp: (ip: string) => string;
};

export type SubmitLeadOutcome =
  | { readonly status: 201 }
  | { readonly status: 400; readonly fields: LeadField[] }
  | { readonly status: 429 }
  | { readonly status: 500 };

const errorName = (error: unknown): string => (error instanceof Error ? `${error.name}: ${error.message}` : String(error));

export function isLikelyBot(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const { website, elapsedMs } = body as Record<string, unknown>;
  if (typeof website === 'string' && website.trim() !== '') return true;
  return typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < MIN_ELAPSED_MS;
}

export async function submitLead(body: unknown, clientIp: string | null, deps: SubmitLeadDeps): Promise<SubmitLeadOutcome> {
  if (isLikelyBot(body)) {
    deps.logger.info('[lead] filtered as automated submission');
    return { status: 201 };
  }
  const validation = validateLead(body);
  if (!validation.ok) return { status: 400, fields: validation.fields };

  const now = deps.clock.now();
  const record: LeadRecord = { ...validation.lead, consentAt: now, createdAt: now };
  try {
    const allowed = await deps.rateLimiter.hit(deps.hashIp(clientIp ?? 'unknown'), now);
    if (!allowed) {
      deps.logger.warn('[lead] rate limited', { source: record.source });
      return { status: 429 };
    }
    await deps.repository.save(record);
  } catch (error) {
    deps.logger.error('[lead] could not save lead', { source: record.source, error: errorName(error) });
    return { status: 500 };
  }

  try {
    await deps.notifier.notify(record);
  } catch (error) {
    deps.logger.warn('[lead] notification failed; lead is saved', { source: record.source, error: errorName(error) });
  }
  deps.logger.info('[lead] saved', { source: record.source });
  return { status: 201 };
}
```

- [ ] **Step 6: IP-ul clientului (RED → GREEN)**

`server/client-ip.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clientIpOf } from './client-ip';

describe('clientIpOf', () => {
  it('uses the socket address when the proxy is not trusted', () => {
    expect(clientIpOf('198.51.100.1', '10.0.0.5', false)).toBe('10.0.0.5');
  });

  it('uses the first forwarded address behind a trusted proxy', () => {
    expect(clientIpOf(' 198.51.100.1 , 10.0.0.1', '127.0.0.1', true)).toBe('198.51.100.1');
    expect(clientIpOf(['198.51.100.2, 10.0.0.1', '10.0.0.9'], '127.0.0.1', true)).toBe('198.51.100.2');
  });

  it('falls back to the socket address when the header is missing or empty', () => {
    expect(clientIpOf(undefined, '127.0.0.1', true)).toBe('127.0.0.1');
    expect(clientIpOf(' , ', '127.0.0.1', true)).toBe('127.0.0.1');
  });

  it('returns null when nothing is known', () => {
    expect(clientIpOf(undefined, undefined, false)).toBeNull();
  });
});
```

`server/client-ip.ts`:

```ts
export function clientIpOf(
  forwardedFor: string | string[] | undefined,
  remoteAddress: string | undefined,
  trustProxy: boolean,
): string | null {
  if (trustProxy && forwardedFor !== undefined) {
    const header = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
    const first = header.split(',').map((part) => part.trim()).find((part) => part !== '');
    if (first) return first;
  }
  return remoteAddress ?? null;
}
```

- [ ] **Step 7: Rutarea (RED → GREEN)**

Înlocuiește `server/handle-request.test.ts` cu:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { FakeLeadRepository, FakeNotifier, FakeRateLimiter, RecordingLogger, fixedClock } from '@test-support/lead-fakes';
import { MAX_BODY_BYTES, createRequestHandler, type RequestHandler } from './handle-request';

const BASE = 'http://localhost';
const context = { clientIp: '203.0.113.7' };
const lead = {
  parentName: 'Ana Pop',
  phone: '0722 123 456',
  childAgeGroup: null,
  source: 'home',
  testLevel: null,
  consent: true,
  policyVersion: '1',
  utm: { source: null, medium: null, campaign: null },
  website: '',
  elapsedMs: 8400,
};

let repository: FakeLeadRepository;
let rateLimiter: FakeRateLimiter;
let handle: RequestHandler;

beforeEach(() => {
  repository = new FakeLeadRepository();
  rateLimiter = new FakeRateLimiter();
  handle = createRequestHandler({
    repository,
    rateLimiter,
    notifier: new FakeNotifier(),
    logger: new RecordingLogger(),
    clock: fixedClock('2026-10-11T09:30:00.000Z'),
    hashIp: (ip) => `hash(${ip})`,
  });
});

const post = (body: string, headers: Record<string, string> = { 'content-type': 'application/json' }): Request =>
  new Request(`${BASE}/api/lead`, { method: 'POST', headers, body });

describe('handle request', () => {
  it('serves /api/health with safe JSON headers', async () => {
    const response = await handle(new Request(`${BASE}/api/health`), context);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.json()).toEqual({ ok: true, policyVersion: '1' });
  });

  it('answers unknown routes with a JSON 404', async () => {
    const response = await handle(new Request(`${BASE}/api/nope`), context);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: 'not_found' });
  });

  it('saves a lead and answers 201', async () => {
    const response = await handle(post(JSON.stringify(lead)), context);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(repository.saved).toHaveLength(1);
    expect(rateLimiter.keys).toEqual(['hash(203.0.113.7)']);
  });

  it('accepts a charset in the content type', async () => {
    const response = await handle(post(JSON.stringify(lead), { 'content-type': 'application/json; charset=utf-8' }), context);
    expect(response.status).toBe(201);
  });

  it('answers 400 with field names for invalid data', async () => {
    const response = await handle(post(JSON.stringify({ ...lead, phone: '1' })), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'validation', fields: ['phone'] });
  });

  it.each([
    ['invalid JSON', post('{nope')],
    ['a form-encoded body', post('parentName=Ana', { 'content-type': 'application/x-www-form-urlencoded' })],
    ['a missing content type', new Request(`${BASE}/api/lead`, { method: 'POST', body: JSON.stringify(lead) })],
    ['an oversized body', post(JSON.stringify({ ...lead, parentName: 'x'.repeat(MAX_BODY_BYTES) }))],
  ])('answers 400 without fields for %s', async (_label, request) => {
    const response = await handle(request, context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'validation', fields: [] });
    expect(repository.saved).toEqual([]);
  });

  it('answers 429 when rate limited', async () => {
    rateLimiter.allow = false;
    const response = await handle(post(JSON.stringify(lead)), context);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, error: 'rate_limited' });
  });

  it('answers a generic 500 when the database fails', async () => {
    repository.failWith = new Error('ER_LOCK_DEADLOCK at db.internal:3306');
    const response = await handle(post(JSON.stringify(lead)), context);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe(JSON.stringify({ ok: false, error: 'internal' }));
  });

  it('answers 405 with Allow for other methods on /api/lead', async () => {
    const response = await handle(new Request(`${BASE}/api/lead`), context);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(await response.json()).toEqual({ ok: false, error: 'method_not_allowed' });
  });
});
```

Înlocuiește `server/handle-request.ts` cu:

```ts
import { POLICY_VERSION } from '@shared/contracts/policy';
import { submitLead, type SubmitLeadDeps } from './leads/submit-lead';

export type RequestContext = { readonly clientIp: string | null };
export type RequestHandler = (request: Request, context: RequestContext) => Promise<Response>;

export const MAX_BODY_BYTES = 10_000;

const INVALID_BODY = Symbol('invalid-body');

export function createRequestHandler(deps: SubmitLeadDeps): RequestHandler {
  return async (request, context) => {
    const { pathname } = new URL(request.url);
    if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/health') {
      return json(200, { ok: true, policyVersion: POLICY_VERSION });
    }
    if (pathname === '/api/lead') {
      if (request.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, { allow: 'POST' });
      return handleLead(request, context, deps);
    }
    return json(404, { ok: false, error: 'not_found' });
  };
}

async function handleLead(request: Request, context: RequestContext, deps: SubmitLeadDeps): Promise<Response> {
  const body = await readJsonBody(request);
  if (body === INVALID_BODY) return json(400, { ok: false, error: 'validation', fields: [] });
  const outcome = await submitLead(body, context.clientIp, deps);
  switch (outcome.status) {
    case 201:
      return json(201, { ok: true });
    case 400:
      return json(400, { ok: false, error: 'validation', fields: outcome.fields });
    case 429:
      return json(429, { ok: false, error: 'rate_limited' });
    case 500:
      return json(500, { ok: false, error: 'internal' });
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!type.startsWith('application/json')) return INVALID_BODY;
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return INVALID_BODY;
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return INVALID_BODY;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return INVALID_BODY;
  }
}

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}
```

În `server/entry.node.ts`, până la Task 7, înlocuiește `handleRequest(toWebRequest(req))` cu un handler creat o dată, cu adaptoare care resping (MySQL/SMTP vin în Task 6–7):

```ts
import { clientIpOf } from './client-ip';
import { createRequestHandler } from './handle-request';
import { hashIp } from './leads/ip-hash';
import { consoleLogger, systemClock } from './leads/ports';

const env = readEnvironment();
const unavailable = (): Promise<never> => Promise.reject(new Error('storage not configured yet'));
const handle = createRequestHandler({
  repository: { save: unavailable, deleteCreatedBefore: unavailable },
  rateLimiter: { hit: unavailable, deleteWindowsBefore: unavailable },
  notifier: { notify: unavailable },
  clock: systemClock,
  logger: consoleLogger,
  hashIp: (ip) => hashIp(ip, env.ipHashSalt),
});
// în createServer:
//   .then(() => handle(toWebRequest(req), { clientIp: clientIpOf(req.headers['x-forwarded-for'], req.socket.remoteAddress, env.trustProxy) }))
// și .listen(env.port, ...)
```

- [ ] **Step 8: Verifică și commit**

```bash
npm run verify
git add tsconfig.json tests/support server
git commit -m "feat(server): accept leads on POST /api/lead with validation, rate limit and bot filter"
```

---

### Task 6: Adaptoarele MySQL — migrații, repository, limită

**Files:**
- Create: `server/db/migrations/001_create_leads.sql`, `server/db/migrations/002_create_rate_limits.sql`, `server/db/pool.ts`, `server/leads/lead.repository.ts`, `server/leads/rate-limit.ts`, `server/leads/rate-limit.test.ts`, `server/leads/mysql.integration.test.ts`, `tests/support/mysql.ts`
- Modify: `.github/workflows/ci.yml`, `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `LeadRepository`, `RateLimiter`, `LeadRecord` (Task 5); `Environment['db']` (Task 4).
- Produces: `createDatabasePool(db: Environment['db']): Pool`, `createMysqlLeadRepository(pool: Pool): LeadRepository`, `RATE_LIMIT_PER_HOUR = 5`, `windowStart(now: Date): Date`, `createMysqlRateLimiter(pool: Pool, limit?: number): RateLimiter`; în `tests/support/mysql.ts`: `testDatabaseUrl(): string | undefined`, `openTestPool(url: string): Promise<Pool>` (aplică migrațiile), `resetTables(pool: Pool): Promise<void>`.

- [ ] **Step 1: Instalează mysql2**

```bash
npm install --save-exact mysql2@3.24.4
```

- [ ] **Step 2: Migrații**

`server/db/migrations/001_create_leads.sql`:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  child_age_group VARCHAR(20) NULL,
  source ENUM('home', 'landing', 'test') NOT NULL,
  test_level VARCHAR(30) NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  consent_at DATETIME NOT NULL,
  policy_version VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`server/db/migrations/002_create_rate_limits.sql`:

```sql
CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash CHAR(64) NOT NULL,
  window_start DATETIME NOT NULL,
  hits INT UNSIGNED NOT NULL,
  PRIMARY KEY (ip_hash, window_start),
  KEY rate_limits_window_start (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;
```

Toate orele se scriu în UTC (pool-ul are `timezone: 'Z'`).

- [ ] **Step 3: `windowStart` (RED → GREEN)**

`server/leads/rate-limit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { windowStart } from './rate-limit';

describe('windowStart', () => {
  it('floors to the start of the UTC hour', () => {
    expect(windowStart(new Date('2026-10-11T09:59:59.999Z')).toISOString()).toBe('2026-10-11T09:00:00.000Z');
    expect(windowStart(new Date('2026-10-11T10:00:00.000Z')).toISOString()).toBe('2026-10-11T10:00:00.000Z');
  });

  it('does not mutate its input', () => {
    const now = new Date('2026-10-11T09:30:00.000Z');
    windowStart(now);
    expect(now.toISOString()).toBe('2026-10-11T09:30:00.000Z');
  });
});
```

`server/db/pool.ts`:

```ts
import { createPool, type Pool } from 'mysql2/promise';
import type { Environment } from '../config/environment';

export function createDatabasePool(db: Environment['db']): Pool {
  return createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    timezone: 'Z',
    connectionLimit: 5,
    connectTimeout: 10_000,
    waitForConnections: true,
  });
}
```

`server/leads/rate-limit.ts`:

```ts
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { RateLimiter } from './ports';

export const RATE_LIMIT_PER_HOUR = 5;

export function windowStart(now: Date): Date {
  const start = new Date(now.getTime());
  start.setUTCMinutes(0, 0, 0);
  return start;
}

export function createMysqlRateLimiter(pool: Pool, limit = RATE_LIMIT_PER_HOUR): RateLimiter {
  return {
    async hit(key, now) {
      const start = windowStart(now);
      await pool.execute(
        'INSERT INTO rate_limits (ip_hash, window_start, hits) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE hits = hits + 1',
        [key, start],
      );
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT hits FROM rate_limits WHERE ip_hash = ? AND window_start = ?', [key, start]);
      return Number(rows[0]?.hits ?? 0) <= limit;
    },
    async deleteWindowsBefore(cutoff) {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM rate_limits WHERE window_start < ?', [cutoff]);
      return result.affectedRows;
    },
  };
}
```

`server/leads/lead.repository.ts`:

```ts
import type { Pool, ResultSetHeader } from 'mysql2/promise';
import type { LeadRepository } from './ports';

export function createMysqlLeadRepository(pool: Pool): LeadRepository {
  return {
    async save(record) {
      await pool.execute(
        `INSERT INTO leads
          (parent_name, phone, child_age_group, source, test_level, utm_source, utm_medium, utm_campaign, consent_at, policy_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.parentName,
          record.phone,
          record.childAgeGroup,
          record.source,
          record.testLevel,
          record.utm.source,
          record.utm.medium,
          record.utm.campaign,
          record.consentAt,
          record.policyVersion,
          record.createdAt,
        ],
      );
    },
    async deleteCreatedBefore(cutoff) {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM leads WHERE created_at < ?', [cutoff]);
      return result.affectedRows;
    },
  };
}
```

- [ ] **Step 4: Suport pentru testele pe MySQL**

`tests/support/mysql.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createPool, type Pool } from 'mysql2/promise';

const MIGRATIONS = resolve(import.meta.dirname, '../../server/db/migrations');

export function testDatabaseUrl(): string | undefined {
  const url = process.env.TEST_DATABASE_URL?.trim();
  return url ? url : undefined;
}

export async function openTestPool(url: string): Promise<Pool> {
  const pool = createPool({ uri: url, timezone: 'Z', connectionLimit: 2 });
  for (const file of readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort()) {
    await pool.query(readFileSync(join(MIGRATIONS, file), 'utf8'));
  }
  return pool;
}

export async function resetTables(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM rate_limits');
}
```

`resolve(import.meta.dirname, '../../server/...')` e o cale de fișier, nu un import, deci regula `../../` (pentru importuri) nu se aplică; dacă ESLint o semnalează totuși, folosește `resolve(process.cwd(), 'server/db/migrations')`. ESLint permite `process.env` doar în `server/**/*.test.ts`: adaugă `tests/support/mysql.ts` la excepția `no-restricted-properties` din `eslint.config.js` și notează în raport.

- [ ] **Step 5: Testele de integrare (RED → GREEN cu bază de date)**

`server/leads/mysql.integration.test.ts`:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { openTestPool, resetTables, testDatabaseUrl } from '@test-support/mysql';
import { createMysqlLeadRepository } from './lead.repository';
import type { LeadRecord } from './ports';
import { createMysqlRateLimiter } from './rate-limit';

const url = testDatabaseUrl();

const record = (createdAt: string): LeadRecord => ({
  parentName: 'Ştefănescu Ţurcan Ana',
  phone: '+40722123456',
  childAgeGroup: '7–8 ani',
  source: 'test',
  testLevel: 'level:movers',
  consent: true,
  policyVersion: '1',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  consentAt: new Date(createdAt),
  createdAt: new Date(createdAt),
});

describe.skipIf(!url)('MySQL adapters', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = await openTestPool(url ?? '');
  });

  afterAll(async () => {
    await pool?.end();
  });

  beforeEach(async () => {
    await resetTables(pool);
  });

  it('saves a lead with diacritics and UTC timestamps intact', async () => {
    await createMysqlLeadRepository(pool).save(record('2026-10-11T09:30:00.000Z'));
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM leads');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      parent_name: 'Ştefănescu Ţurcan Ana',
      phone: '+40722123456',
      child_age_group: '7–8 ani',
      source: 'test',
      test_level: 'level:movers',
      utm_source: 'instagram',
      utm_medium: 'paid',
      utm_campaign: 'demo-toamna',
      policy_version: '1',
    });
    expect((rows[0]?.created_at as Date).toISOString()).toBe('2026-10-11T09:30:00.000Z');
    expect((rows[0]?.consent_at as Date).toISOString()).toBe('2026-10-11T09:30:00.000Z');
  });

  it('deletes only leads created before the cutoff', async () => {
    const repository = createMysqlLeadRepository(pool);
    await repository.save(record('2025-10-11T09:29:59.000Z'));
    await repository.save(record('2025-10-11T09:30:00.000Z'));
    await expect(repository.deleteCreatedBefore(new Date('2025-10-11T09:30:00.000Z'))).resolves.toBe(1);
    const [rows] = await pool.query<RowDataPacket[]>('SELECT created_at FROM leads');
    expect(rows).toHaveLength(1);
  });

  it('allows 5 hits per key and hour, then refuses', async () => {
    const limiter = createMysqlRateLimiter(pool);
    const now = new Date('2026-10-11T09:10:00.000Z');
    const results: boolean[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) results.push(await limiter.hit('a'.repeat(64), now));
    expect(results).toEqual([true, true, true, true, true, false]);
    await expect(limiter.hit('b'.repeat(64), now)).resolves.toBe(true);
    await expect(limiter.hit('a'.repeat(64), new Date('2026-10-11T10:00:00.000Z'))).resolves.toBe(true);
  });

  it('deletes old rate limit windows', async () => {
    const limiter = createMysqlRateLimiter(pool);
    await limiter.hit('a'.repeat(64), new Date('2026-10-10T08:00:00.000Z'));
    await limiter.hit('a'.repeat(64), new Date('2026-10-11T09:00:00.000Z'));
    await expect(limiter.deleteWindowsBefore(new Date('2026-10-10T09:30:00.000Z'))).resolves.toBe(1);
  });
});
```

Local, fără `TEST_DATABASE_URL`, suita se sare. Dacă ai Docker, rulează o dată:

```bash
docker run --rm -d --name em-mariadb -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=em_test -p 3306:3306 mariadb:10.11
TEST_DATABASE_URL=mysql://root:root@127.0.0.1:3306/em_test npx vitest run server/leads/mysql.integration.test.ts
docker stop em-mariadb
```

Dacă nu ai Docker, notează în raport că suita a rulat doar în CI.

- [ ] **Step 6: CI cu MariaDB**

În `.github/workflows/ci.yml`, la jobul `verify`, adaugă (la același nivel cu `runs-on`):

```yaml
    services:
      mariadb:
        image: mariadb:10.11
        env:
          MARIADB_ROOT_PASSWORD: root
          MARIADB_DATABASE: em_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="healthcheck.sh --connect --innodb_initialized"
          --health-interval=5s
          --health-timeout=5s
          --health-retries=20
    env:
      TEST_DATABASE_URL: mysql://root:root@127.0.0.1:3306/em_test
```

- [ ] **Step 7: Verifică și commit**

```bash
npm run verify
git add package.json package-lock.json server/db server/leads tests/support .github/workflows/ci.yml eslint.config.js
git commit -m "feat(server): store leads and rate limits in MySQL"
```

---

### Task 7: Email, job de ștergere, pornirea serverului, bundle

**Files:**
- Create: `server/leads/lead-notification.ts`, `server/leads/lead-notification.test.ts`, `server/jobs/purge.ts`, `server/jobs/purge.test.ts`, `server/jobs/purge-expired-leads.ts`
- Modify: `server/entry.node.ts`, `server/entry.node.test.ts`, `scripts/build-server.mjs`, `astro.config.ts`, `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: porturile (Task 5), adaptoarele MySQL (Task 6), `readEnvironment` (Task 4).
- Produces: `formatLeadEmail(record: LeadRecord): { subject: string; text: string }`, `type MailSender = { sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown> }`, `createSmtpNotifier(env: Pick<Environment, 'smtp' | 'mail'>, sender?: MailSender): LeadNotifier`; `leadCutoff(now: Date): Date`, `rateLimitCutoff(now: Date): Date`, `purgeExpired(deps): Promise<{ leads: number; rateLimits: number }>`; bundle-uri `dist-server/app.cjs` și `dist-server/purge-expired-leads.cjs`.

- [ ] **Step 1: Instalează nodemailer**

```bash
npm install --save-exact nodemailer@10.0.10
```

- [ ] **Step 2: Emailul (RED → GREEN)**

`server/leads/lead-notification.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createSmtpNotifier, formatLeadEmail, type MailSender } from './lead-notification';
import type { LeadRecord } from './ports';

const record: LeadRecord = {
  parentName: 'Ştefănescu Ana',
  phone: '+40722123456',
  childAgeGroup: '7–8 ani',
  source: 'test',
  testLevel: 'level:movers',
  consent: true,
  policyVersion: '1',
  utm: { source: 'instagram', medium: null, campaign: 'demo-toamna' },
  consentAt: new Date('2026-10-11T09:30:00.000Z'),
  createdAt: new Date('2026-10-11T09:30:00.000Z'),
};

describe('formatLeadEmail', () => {
  it('writes a plain Romanian summary with the Bucharest time', () => {
    const { subject, text } = formatLeadEmail(record);
    expect(subject).toBe('Cerere nouă de lecție demo – testul de nivel');
    expect(text).toContain('Părinte: Ştefănescu Ana');
    expect(text).toContain('Telefon: +40722123456');
    expect(text).toContain('Vârsta copilului: 7–8 ani');
    expect(text).toContain('Rezultat test: level:movers');
    expect(text).toContain('UTM: instagram / — / demo-toamna');
    expect(text).toContain('Primită: 11.10.2026, 12:30');
    expect(text).toContain('Acord: politica v1');
    expect(text).toContain('Datele se șterg automat după 12 luni.');
  });

  it('uses dashes for missing values and omits the test line for other sources', () => {
    const { subject, text } = formatLeadEmail({ ...record, source: 'home', testLevel: null, childAgeGroup: null, utm: { source: null, medium: null, campaign: null } });
    expect(subject).toBe('Cerere nouă de lecție demo – pagina principală');
    expect(text).toContain('Vârsta copilului: —');
    expect(text).toContain('UTM: —');
    expect(text).not.toContain('Rezultat test');
  });

  it('keeps the subject free of personal data', () => {
    expect(formatLeadEmail(record).subject).not.toContain('Ana');
  });
});

describe('createSmtpNotifier', () => {
  it('sends the formatted email from and to the configured addresses', async () => {
    const sendMail = vi.fn<MailSender['sendMail']>().mockResolvedValue({});
    const notifier = createSmtpNotifier(
      { smtp: { host: 'h', port: 465, user: 'u', password: 'p' }, mail: { from: 'site@example.ro', to: 'office@example.ro' } },
      { sendMail },
    );
    await notifier.notify(record);
    expect(sendMail).toHaveBeenCalledWith({ from: 'site@example.ro', to: 'office@example.ro', ...formatLeadEmail(record) });
  });

  it('propagates send failures to the caller', async () => {
    const notifier = createSmtpNotifier(
      { smtp: { host: 'h', port: 465, user: 'u', password: 'p' }, mail: { from: 'a@b.ro', to: 'c@d.ro' } },
      { sendMail: () => Promise.reject(new Error('timeout')) },
    );
    await expect(notifier.notify(record)).rejects.toThrow('timeout');
  });
});
```

`server/leads/lead-notification.ts`:

```ts
import { createTransport } from 'nodemailer';
import type { Environment } from '../config/environment';
import type { LeadNotifier, LeadRecord } from './ports';

export type MailSender = {
  sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
};

const SOURCE_LABELS: Readonly<Record<LeadRecord['source'], string>> = {
  home: 'pagina principală',
  landing: 'pagina lecției demo',
  test: 'testul de nivel',
};

const RECEIVED_AT = new Intl.DateTimeFormat('ro-RO', {
  timeZone: 'Europe/Bucharest',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dash = (value: string | null): string => value ?? '—';

export function formatLeadEmail(record: LeadRecord): { subject: string; text: string } {
  const { source, medium, campaign } = record.utm;
  const utm = source || medium || campaign ? `${dash(source)} / ${dash(medium)} / ${dash(campaign)}` : '—';
  const lines = [
    `Părinte: ${record.parentName}`,
    `Telefon: ${record.phone}`,
    `Vârsta copilului: ${dash(record.childAgeGroup)}`,
    ...(record.source === 'test' ? [`Rezultat test: ${dash(record.testLevel)}`] : []),
    `Sursă: ${SOURCE_LABELS[record.source]}`,
    `UTM: ${utm}`,
    `Primită: ${RECEIVED_AT.format(record.createdAt)}`,
    `Acord: politica v${record.policyVersion}`,
    '',
    'Datele se șterg automat după 12 luni.',
  ];
  return { subject: `Cerere nouă de lecție demo – ${SOURCE_LABELS[record.source]}`, text: lines.join('\n') };
}

export function createSmtpNotifier(env: Pick<Environment, 'smtp' | 'mail'>, sender?: MailSender): LeadNotifier {
  const transport: MailSender =
    sender ??
    createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  return {
    async notify(record) {
      await transport.sendMail({ from: env.mail.from, to: env.mail.to, ...formatLeadEmail(record) });
    },
  };
}
```

Dacă `Intl` din Node formatează altfel (ex. „11.10.2026, 12:30” vs „11.10.2026 12:30”), păstrează formatul real și ajustează așteptarea din test; notează în raport.

- [ ] **Step 3: Ștergerea datelor expirate (RED → GREEN)**

`server/jobs/purge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FakeLeadRepository, FakeRateLimiter, RecordingLogger, fixedClock } from '@test-support/lead-fakes';
import { leadCutoff, purgeExpired, rateLimitCutoff } from './purge';

describe('cutoffs', () => {
  it('keeps leads for 12 months and rate limits for 24 hours', () => {
    const now = new Date('2026-10-11T09:30:00.000Z');
    expect(leadCutoff(now).toISOString()).toBe('2025-10-11T09:30:00.000Z');
    expect(rateLimitCutoff(now).toISOString()).toBe('2026-10-10T09:30:00.000Z');
  });

  it('handles the end of February', () => {
    expect(leadCutoff(new Date('2028-02-29T00:00:00.000Z')).toISOString()).toBe('2027-03-01T00:00:00.000Z');
  });
});

describe('purgeExpired', () => {
  it('deletes expired rows and logs the counts', async () => {
    const repository = new FakeLeadRepository();
    const base = { parentName: 'A B', phone: '+40722123456', childAgeGroup: null, source: 'home', testLevel: null, consent: true, policyVersion: '1', utm: { source: null, medium: null, campaign: null } } as const;
    await repository.save({ ...base, consentAt: new Date('2025-10-01T00:00:00.000Z'), createdAt: new Date('2025-10-01T00:00:00.000Z') });
    await repository.save({ ...base, consentAt: new Date('2026-01-01T00:00:00.000Z'), createdAt: new Date('2026-01-01T00:00:00.000Z') });
    const logger = new RecordingLogger();
    const result = await purgeExpired({ repository, rateLimiter: new FakeRateLimiter(), clock: fixedClock('2026-10-11T09:30:00.000Z'), logger });
    expect(result).toEqual({ leads: 1, rateLimits: 0 });
    expect(repository.saved).toHaveLength(1);
    expect(logger.entries).toEqual([{ level: 'info', message: '[purge] expired data deleted', context: { leads: 1, rateLimits: 0 } }]);
  });
});
```

`server/jobs/purge.ts`:

```ts
import type { Clock, LeadRepository, Logger, RateLimiter } from '../leads/ports';

export function leadCutoff(now: Date): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  return cutoff;
}

export function rateLimitCutoff(now: Date): Date {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

export type PurgeDeps = {
  readonly repository: LeadRepository;
  readonly rateLimiter: RateLimiter;
  readonly clock: Clock;
  readonly logger: Logger;
};

export async function purgeExpired(deps: PurgeDeps): Promise<{ leads: number; rateLimits: number }> {
  const now = deps.clock.now();
  const leads = await deps.repository.deleteCreatedBefore(leadCutoff(now));
  const rateLimits = await deps.rateLimiter.deleteWindowsBefore(rateLimitCutoff(now));
  deps.logger.info('[purge] expired data deleted', { leads, rateLimits });
  return { leads, rateLimits };
}
```

(`setUTCFullYear` pe 29 februarie 2028 dă 1 martie 2027 — testul fixează comportamentul.)

`server/jobs/purge-expired-leads.ts` (al doilea punct de intrare, rulat de cron):

```ts
import { readEnvironment } from '../config/environment';
import { createDatabasePool } from '../db/pool';
import { createMysqlLeadRepository } from '../leads/lead.repository';
import { consoleLogger, systemClock } from '../leads/ports';
import { createMysqlRateLimiter } from '../leads/rate-limit';
import { purgeExpired } from './purge';

async function main(): Promise<void> {
  const env = readEnvironment();
  const pool = createDatabasePool(env.db);
  try {
    await purgeExpired({
      repository: createMysqlLeadRepository(pool),
      rateLimiter: createMysqlRateLimiter(pool),
      clock: systemClock,
      logger: consoleLogger,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  consoleLogger.error('[purge] failed', { error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});
```

- [ ] **Step 4: Pornirea reală în `entry.node.ts`**

Înlocuiește adaptoarele temporare din Task 5 cu cele reale:

```ts
import { createDatabasePool } from './db/pool';
import { createSmtpNotifier } from './leads/lead-notification';
import { createMysqlLeadRepository } from './leads/lead.repository';
import { createMysqlRateLimiter } from './leads/rate-limit';
// ...
const env = readEnvironment();
const pool = createDatabasePool(env.db);
const handle = createRequestHandler({
  repository: createMysqlLeadRepository(pool),
  rateLimiter: createMysqlRateLimiter(pool),
  notifier: createSmtpNotifier(env),
  clock: systemClock,
  logger: consoleLogger,
  hashIp: (ip) => hashIp(ip, env.ipHashSalt),
});
```

Restul fișierului (conversia `IncomingMessage` → `Request`, `clientIpOf`, tratarea erorilor neprinse) rămâne.

- [ ] **Step 5: Două bundle-uri**

`scripts/build-server.mjs`:

```js
import { build } from 'esbuild';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { outdir: { type: 'string', default: 'dist-server' } } });

await build({
  entryPoints: {
    app: 'server/entry.node.ts',
    'purge-expired-leads': 'server/jobs/purge-expired-leads.ts',
  },
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outdir: values.outdir,
  outExtension: { '.js': '.cjs' },
  tsconfig: 'tsconfig.json',
  logLevel: 'warning',
});
```

În `server/entry.node.test.ts`: construiește cu `['scripts/build-server.mjs', '--outdir', dir]` și pornește `join(dir, 'app.cjs')`. Adaugă testele (baza de date din `TEST_ENV` e pe portul 1, deci refuză imediat):

```ts
  it('answers a valid lead with a generic 500 when the database is unreachable', async () => {
    const response = await fetch(`${base}/api/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Ana Pop',
        phone: '0722 123 456',
        childAgeGroup: null,
        source: 'home',
        testLevel: null,
        consent: true,
        policyVersion: '1',
        utm: { source: null, medium: null, campaign: null },
        website: '',
        elapsedMs: 8400,
      }),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: 'internal' });
  });

  it('answers a honeypot submission with 201 without touching the database', async () => {
    const response = await fetch(`${base}/api/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ website: 'spam', elapsedMs: 9000 }),
    });
    expect(response.status).toBe(201);
  });

  it('bundles the purge job', () => {
    expect(existsSync(join(dir, 'purge-expired-leads.cjs'))).toBe(true);
  });
```

(Adaugă `existsSync` la importul din `node:fs`.) Testul „unknown POST → 404” rămâne.

- [ ] **Step 6: Proxy pentru `astro dev` și script de pornire locală**

În `astro.config.ts`, la obiectul de configurare, adaugă:

```ts
  vite: {
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
  },
```

În `package.json` → `scripts` adaugă `"dev:server": "npm run build:server && node --env-file=.env dist-server/app.cjs"`.

- [ ] **Step 7: Verifică și commit**

```bash
npm run verify
git add package.json package-lock.json server scripts/build-server.mjs astro.config.ts
git commit -m "feat(server): email new leads, purge expired data and wire MySQL at startup"
```

---

### Task 8: Web Component `<lead-form>`

**Files:**
- Create: `src/features/lead-capture/ui/LeadForm.astro`, `src/features/lead-capture/ui/lead-form.css`, `src/features/lead-capture/ui/lead-form.element.ts`, `src/features/lead-capture/ui/lead-form.element.test.ts`, `src/features/lead-capture/ui/LeadForm.test.ts`, `src/features/lead-capture/ui/UtmCapture.astro`, `src/features/lead-capture/ui/utm-capture.ts`, `src/features/lead-capture/index.ts`

**Interfaces:**
- Consumes: Task 1 (`validateLead`, `LeadRequest`, `LeadField`, `LeadSource`, `AGE_GROUPS`, `POLICY_VERSION`, `LEVEL_TEST_COMPLETED`, `createLeadSubmitted`), Task 2 (model), Task 3 (`submitLead`).
- Produces:
  - `src/features/lead-capture/index.ts`: `export { default as LeadForm } from './ui/LeadForm.astro';` și `export { default as UtmCapture } from './ui/UtmCapture.astro';`
  - `LeadForm.astro` props: `source: LeadSource; tone?: 'navy' | 'cream'` (implicit `'cream'`); `title?: string; headingLevel?: 2 | 3` (implicit 2); `subtitle?: string; submitLabel?: string` (implicit „Rezervă locul acum”); `showAgeGroups?: boolean` (implicit true); `hidden?: boolean` (implicit false).
  - `<lead-form>`: `LeadForm` class, `defineLeadForm()`; emite `lead.submitted` (bubbles) doar la 201.
  - `captureUtm(): void` (în `utm-capture.ts`).

- [ ] **Step 1: Markup-ul Astro**

`LeadForm.astro`:

```astro
---
import { AGE_GROUPS } from '@shared/contracts/age-groups';
import type { LeadSource } from '@shared/contracts/lead.schema';
import { site } from '@shared/content/site';
import WhatsAppButton from '@shared/ui/WhatsAppButton.astro';
import '@shared/ui/Button.css';
import './lead-form.css';

interface Props {
  source: LeadSource;
  tone?: 'navy' | 'cream';
  title?: string;
  headingLevel?: 2 | 3;
  subtitle?: string;
  submitLabel?: string;
  showAgeGroups?: boolean;
  hidden?: boolean;
}

const {
  source,
  tone = 'cream',
  title,
  headingLevel = 2,
  subtitle,
  submitLabel = 'Rezervă locul acum',
  showAgeGroups = true,
  hidden = false,
} = Astro.props;
const Heading = headingLevel === 2 ? 'h2' : 'h3';
const id = (part: string): string => `lead-${source}-${part}`;
const { contact } = site;
const submitVariant = tone === 'navy' ? 'button--sun' : 'button--primary';
const callVariant = tone === 'navy' ? 'button--outline-light' : 'button--outline';
---
<lead-form class:list={['lead-form', `lead-form--${tone}`]} data-source={source} data-phone-display={contact.phoneDisplay} hidden={hidden}>
  <div class="lead-form__fallback">
    <p>Formularul are nevoie de JavaScript. Scrie-ne pe WhatsApp sau sună-ne la <a href={`tel:${contact.phoneE164}`}>{contact.phoneDisplay}</a>.</p>
    <WhatsAppButton label="Scrie-ne pe WhatsApp" />
  </div>
  <form class="lead-form__form" novalidate hidden aria-labelledby={title ? id('title') : undefined}>
    {title && <Heading class="lead-form__title" id={id('title')}>{title}</Heading>}
    {subtitle && <p class="lead-form__subtitle">{subtitle}</p>}
    <div class="lead-form__row">
      <div class="lead-form__field">
        <label for={id('parentName')}>Numele părintelui</label>
        <input id={id('parentName')} name="parentName" type="text" autocomplete="name" maxlength="100" placeholder="ex. Ana Pop" aria-describedby={id('parentName-error')} />
        <p class="lead-form__error" id={id('parentName-error')} data-error-for="parentName"></p>
      </div>
      <div class="lead-form__field">
        <label for={id('phone')}>Telefon</label>
        <input id={id('phone')} name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="ex. 0722 123 456" aria-describedby={id('phone-error')} />
        <p class="lead-form__error" id={id('phone-error')} data-error-for="phone"></p>
      </div>
    </div>
    {showAgeGroups && (
      <fieldset class="lead-form__ages" aria-describedby={id('childAgeGroup-error')}>
        <legend>Vârsta copilului <span class="lead-form__optional">(opțional)</span></legend>
        <div class="lead-form__pills">
          {AGE_GROUPS.map((age) => (
            <label class="lead-form__pill">
              <input type="radio" name="childAgeGroup" value={age} />
              <span>{age}</span>
            </label>
          ))}
        </div>
        <p class="lead-form__error" id={id('childAgeGroup-error')} data-error-for="childAgeGroup"></p>
      </fieldset>
    )}
    <div class="lead-form__trap" aria-hidden="true">
      <label for={id('website')}>Nu completa acest câmp</label>
      <input id={id('website')} name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>
    <div class="lead-form__consent">
      <input id={id('consent')} name="consent" type="checkbox" aria-describedby={id('consent-error')} />
      <label for={id('consent')}>Sunt de acord ca English Minds Academy să mă contacteze telefonic sau pe WhatsApp pentru lecția demo, conform <a href="/confidentialitate/">politicii de confidențialitate</a>.</label>
      <p class="lead-form__error" id={id('consent-error')} data-error-for="consent"></p>
    </div>
    <button class:list={['button', submitVariant, 'lead-form__submit']} type="submit">{submitLabel}</button>
    <p class="lead-form__alert" role="alert"></p>
    <p class="lead-form__status" role="status"></p>
    <p class="lead-form__note">Nu plătești nimic. Te contactăm doar pentru lecția demo.</p>
  </form>
  <div class="lead-form__done" hidden tabindex="-1">
    <p class="lead-form__done-title">Mulțumim, <span data-name></span>!</p>
    <p class="lead-form__done-text" data-done-text></p>
    <div class="lead-form__done-actions">
      <a class="button button--whatsapp" data-whatsapp href={contact.whatsappUrl} target="_blank" rel="noopener">Trimite pe WhatsApp</a>
      <a class:list={['button', callVariant]} href={`tel:${contact.phoneE164}`}>Sună-ne</a>
    </div>
  </div>
</lead-form>

<script>
  import { defineLeadForm } from './lead-form.element';
  defineLeadForm();
</script>
```

- [ ] **Step 2: Testul de markup (Container API)**

`src/features/lead-capture/ui/LeadForm.test.ts` (urmează stilul `src/sections/home/home.test.ts` pentru `experimental_AstroContainer`):

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LeadForm from './LeadForm.astro';

const render = async (props: Record<string, unknown>): Promise<string> =>
  (await AstroContainer.create()).renderToString(LeadForm, { props });

describe('LeadForm.astro', () => {
  it('renders a hidden form, a no-JS fallback and labelled fields', async () => {
    const html = await render({ source: 'landing', title: 'Rezervă locul acum' });
    expect(html).toContain('data-source="landing"');
    expect(html).toMatch(/<form[^>]*class="lead-form__form"[^>]*hidden/);
    expect(html).toContain('Formularul are nevoie de JavaScript');
    expect(html).toContain('href="https://wa.me/40775630680"');
    expect(html).toContain('<label for="lead-landing-parentName">Numele părintelui</label>');
    expect(html).toContain('<label for="lead-landing-phone">Telefon</label>');
    expect(html).toContain('aria-describedby="lead-landing-phone-error"');
    expect(html).toContain('href="/confidentialitate/"');
    expect(html).toContain('name="website"');
    expect(html.match(/name="childAgeGroup"/g)).toHaveLength(5);
    expect(html).toMatch(/<h2[^>]*id="lead-landing-title"[^>]*>Rezervă locul acum<\/h2>/);
  });

  it('can drop the age groups, use an h3 and start hidden', async () => {
    const html = await render({ source: 'test', showAgeGroups: false, headingLevel: 3, title: 'T', hidden: true });
    expect(html).not.toContain('name="childAgeGroup"');
    expect(html).toMatch(/<h3[^>]*>T<\/h3>/);
    expect(html).toMatch(/<lead-form[^>]*\shidden/);
  });

  it('uses the sun button on navy and the orange one on cream', async () => {
    expect(await render({ source: 'home', tone: 'navy' })).toContain('button--sun lead-form__submit');
    expect(await render({ source: 'landing' })).toContain('button--primary lead-form__submit');
  });
});
```

- [ ] **Step 3: Testele elementului (RED)**

`src/features/lead-capture/ui/lead-form.element.test.ts`:

```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEAD_SUBMITTED, createLevelTestCompleted } from '@shared/contracts/domain-events';
import type { SubmitLeadResult } from '../api/lead.client';
import { submitLead } from '../api/lead.client';
import { defineLeadForm } from './lead-form.element';

vi.mock('../api/lead.client', () => ({ submitLead: vi.fn() }));
const submitMock = vi.mocked(submitLead);

const AGES = ['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani'];

function markup(source: string, { ages = true, hidden = false } = {}): string {
  const id = (part: string) => `lead-${source}-${part}`;
  return `
  <lead-form class="lead-form" data-source="${source}" data-phone-display="+40 775 630 680" ${hidden ? 'hidden' : ''}>
    <div class="lead-form__fallback"><p>Formularul are nevoie de JavaScript.</p></div>
    <form class="lead-form__form" novalidate hidden>
      <input id="${id('parentName')}" name="parentName" />
      <p class="lead-form__error" data-error-for="parentName"></p>
      <input id="${id('phone')}" name="phone" />
      <p class="lead-form__error" data-error-for="phone"></p>
      ${ages ? `<fieldset>${AGES.map((age) => `<label><input type="radio" name="childAgeGroup" value="${age}"><span>${age}</span></label>`).join('')}<p class="lead-form__error" data-error-for="childAgeGroup"></p></fieldset>` : ''}
      <input name="website" />
      <input id="${id('consent')}" name="consent" type="checkbox" />
      <p class="lead-form__error" data-error-for="consent"></p>
      <button class="lead-form__submit" type="submit">Rezervă</button>
      <p class="lead-form__alert" role="alert"></p>
      <p class="lead-form__status" role="status"></p>
    </form>
    <div class="lead-form__done" hidden tabindex="-1">
      <p>Mulțumim, <span data-name></span>!</p>
      <p data-done-text></p>
      <a data-whatsapp href="https://wa.me/40775630680">WhatsApp</a>
    </div>
  </lead-form>`;
}

type FakePopup = { opener: unknown; location: { replace: ReturnType<typeof vi.fn> }; close: ReturnType<typeof vi.fn> };
let popup: FakePopup | null;
let openSpy: ReturnType<typeof vi.spyOn>;
let now = 0;

function mount(source = 'home', options?: { ages?: boolean; hidden?: boolean }): HTMLElement {
  document.body.innerHTML = markup(source, options);
  return document.querySelector('lead-form') as HTMLElement;
}

const el = <T extends Element>(selector: string): T => document.querySelector(selector) as T;
const input = (name: string): HTMLInputElement => el(`[name="${name}"]`);

function fill({ name = 'Ana Pop', phone = '0722 123 456', consent = true, age }: { name?: string; phone?: string; consent?: boolean; age?: string } = {}): void {
  input('parentName').value = name;
  input('phone').value = phone;
  input('consent').checked = consent;
  if (age) (el(`input[value="${age}"]`) as HTMLInputElement).checked = true;
}

const submit = (): void => {
  el<HTMLFormElement>('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

beforeEach(() => {
  defineLeadForm();
  now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  popup = { opener: window, location: { replace: vi.fn() }, close: vi.fn() };
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => popup as unknown as Window);
  submitMock.mockReset();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('<lead-form>', () => {
  it('shows the form, removes the fallback and enhances once', () => {
    const host = mount();
    expect(el<HTMLFormElement>('form').hidden).toBe(false);
    expect(document.querySelector('.lead-form__fallback')).toBeNull();
    expect(host.dataset.enhanced).toBe('true');
    const form = el('form');
    host.remove();
    document.body.append(host);
    expect(el('form')).toBe(form);
  });

  it('flags empty required fields, focuses the first and sends nothing', async () => {
    mount();
    submit();
    await flush();
    expect(el('[data-error-for="parentName"]').textContent).toBe('Scrie numele tău (cel puțin 2 litere).');
    expect(el('[data-error-for="phone"]').textContent).toBe('Scrie un număr de telefon din România, de exemplu 0722 123 456.');
    expect(el('[data-error-for="consent"]').textContent).toBe('Bifează acordul ca să te putem contacta.');
    expect(input('parentName').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input('parentName'));
    expect(submitMock).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('clears a field error while the parent types', async () => {
    mount();
    submit();
    await flush();
    input('phone').value = '07';
    input('phone').dispatchEvent(new Event('input', { bubbles: true }));
    expect(el('[data-error-for="phone"]').textContent).toBe('');
    expect(input('phone').hasAttribute('aria-invalid')).toBe(false);
  });

  it('opens the WhatsApp window before the request, saves, then shows thanks and emits lead.submitted', async () => {
    let resolve: (value: SubmitLeadResult) => void = () => undefined;
    submitMock.mockReturnValue(new Promise((done) => (resolve = done)));
    sessionStorage.setItem('em-utm', JSON.stringify({ source: 'instagram', medium: 'paid', campaign: 'demo' }));
    const host = mount('landing');
    const events: unknown[] = [];
    document.addEventListener(LEAD_SUBMITTED, (event) => events.push((event as CustomEvent).detail), { once: true });
    now = 4200;
    fill({ age: '9–10 ani' });
    submit();
    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect(popup?.opener).toBeNull();
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock.mock.calls[0]?.[0]).toEqual({
      parentName: 'Ana Pop',
      phone: '0722 123 456',
      childAgeGroup: '9–10 ani',
      source: 'landing',
      testLevel: null,
      consent: true,
      policyVersion: '1',
      utm: { source: 'instagram', medium: 'paid', campaign: 'demo' },
      website: '',
      elapsedMs: 4200,
    });
    expect(el<HTMLButtonElement>('.lead-form__submit').disabled).toBe(true);
    expect(el('.lead-form__status').textContent).toBe('Se trimite…');

    resolve({ kind: 'ok' });
    await flush();
    const url = popup?.location.replace.mock.calls[0]?.[0] as string;
    expect(decodeURIComponent(url)).toContain('Sunt Ana Pop (0722 123 456). Aș dori o lecție demo gratuită pentru copilul meu (9–10 ani).');
    expect(el<HTMLFormElement>('form').hidden).toBe(true);
    expect(el<HTMLElement>('.lead-form__done').hidden).toBe(false);
    expect(el('[data-name]').textContent).toBe('Ana Pop');
    expect(el('[data-done-text]').textContent).toBe('Ți-am deschis WhatsApp cu mesajul completat. Trimite-l și te sunăm să stabilim ziua lecției.');
    expect(el<HTMLAnchorElement>('[data-whatsapp]').href).toBe(url);
    expect(document.activeElement).toBe(el('.lead-form__done'));
    expect(events).toEqual([{ source: 'landing', ageGroup: '9–10 ani' }]);
    expect(host.contains(document.activeElement)).toBe(true);
  });

  it('sends only once on a double submit', async () => {
    submitMock.mockReturnValue(new Promise(() => undefined));
    mount();
    fill();
    submit();
    submit();
    await flush();
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('shows WhatsApp and call buttons when the window is blocked', async () => {
    openSpy.mockReturnValue(null);
    submitMock.mockResolvedValue({ kind: 'ok' });
    mount();
    fill();
    submit();
    await flush();
    expect(el('[data-done-text]').textContent).toBe('Am primit datele tale și te sunăm în curând. Dacă vrei, scrie-ne și pe WhatsApp.');
    expect(el<HTMLAnchorElement>('[data-whatsapp]').href).toContain('https://wa.me/40775630680?text=');
  });

  it.each(['network', 'server'] as const)('still sends the parent to WhatsApp on a %s failure, without emitting', async (kind) => {
    submitMock.mockResolvedValue({ kind });
    const events: unknown[] = [];
    const listener = (event: Event): void => {
      events.push(event);
    };
    document.addEventListener(LEAD_SUBMITTED, listener);
    mount();
    fill();
    submit();
    await flush();
    document.removeEventListener(LEAD_SUBMITTED, listener);
    expect(popup?.location.replace).toHaveBeenCalledTimes(1);
    expect(el('[data-done-text]').textContent).toBe('Nu am putut salva cererea pe site. Trimite mesajul din WhatsApp și rezervarea se finalizează acolo.');
    expect(events).toEqual([]);
  });

  it('closes the window and shows field errors on a server validation answer', async () => {
    submitMock.mockResolvedValue({ kind: 'validation', fields: ['phone'] });
    mount();
    fill();
    submit();
    await flush();
    expect(popup?.close).toHaveBeenCalled();
    expect(el('[data-error-for="phone"]').textContent).toContain('0722 123 456');
    expect(el<HTMLFormElement>('form').hidden).toBe(false);
    expect(el<HTMLButtonElement>('.lead-form__submit').disabled).toBe(false);
  });

  it('shows a general alert when the server rejects unknown fields', async () => {
    submitMock.mockResolvedValue({ kind: 'validation', fields: ['utm'] });
    mount();
    fill();
    submit();
    await flush();
    expect(el('.lead-form__alert').textContent).toBe('Verifică datele și încearcă din nou.');
  });

  it('closes the window and explains the hourly limit', async () => {
    submitMock.mockResolvedValue({ kind: 'rate_limited' });
    mount();
    fill();
    submit();
    await flush();
    expect(popup?.close).toHaveBeenCalled();
    expect(el('.lead-form__alert').textContent).toBe(
      'Ai trimis deja mai multe cereri în ultima oră. Scrie-ne pe WhatsApp sau sună-ne la +40 775 630 680.',
    );
  });

  it('prefers UTM from the current address over the stored one', async () => {
    submitMock.mockResolvedValue({ kind: 'ok' });
    sessionStorage.setItem('em-utm', JSON.stringify({ source: 'old', medium: null, campaign: null }));
    window.history.replaceState({}, '', '/?utm_source=google&utm_campaign=toamna');
    mount();
    fill();
    submit();
    await flush();
    expect(submitMock.mock.calls[0]?.[0].utm).toEqual({ source: 'google', medium: null, campaign: 'toamna' });
  });

  it('preselects the age group from ?grupa=', () => {
    window.history.replaceState({}, '', '/lectie-demo/?grupa=movers');
    mount('landing');
    expect((el('input[value="9–10 ani"]') as HTMLInputElement).checked).toBe(true);
  });

  it('on the test page, appears after the test and sends the result', async () => {
    submitMock.mockResolvedValue({ kind: 'ok' });
    const host = mount('test', { ages: false, hidden: true });
    expect(host.hidden).toBe(true);
    document.body.append(document.createElement('div'));
    document.body.lastElementChild?.dispatchEvent(createLevelTestCompleted({ mode: 'level', level: 'movers', score: 9, total: 12 }));
    expect(host.hidden).toBe(false);
    fill();
    submit();
    await flush();
    expect(submitMock.mock.calls[0]?.[0]).toMatchObject({ source: 'test', testLevel: 'level:movers', childAgeGroup: null });
    expect(decodeURIComponent(popup?.location.replace.mock.calls[0]?.[0] as string)).toContain('Am făcut testul de nivel: grupa recomandată Movers.');
  });

  it('stops listening for test results once removed', () => {
    const host = mount('test', { ages: false, hidden: true });
    host.remove();
    document.dispatchEvent(createLevelTestCompleted({ mode: 'exam', level: 'a2-key', score: 9, total: 12 }));
    expect(host.hidden).toBe(true);
  });
});
```

Rulează `npx vitest run src/features/lead-capture/ui` → FAIL.

- [ ] **Step 4: Implementează elementul (GREEN)**

`src/features/lead-capture/ui/lead-form.element.ts`:

```ts
import type { AgeGroup } from '@shared/contracts/age-groups';
import { LEVEL_TEST_COMPLETED, createLeadSubmitted, type LevelTestCompletedDetail } from '@shared/contracts/domain-events';
import { validateLead, type LeadField, type LeadRequest, type LeadSource } from '@shared/contracts/lead.schema';
import { POLICY_VERSION } from '@shared/contracts/policy';
import { submitLead } from '../api/lead.client';
import { ageGroupForLevel } from '../model/age-preselect';
import { testLevelCode, testResultLabel, type TestOutcome } from '../model/test-result';
import { EMPTY_UTM, UTM_STORAGE_KEY, parseStoredUtm, parseUtm, type Utm } from '../model/utm';
import { leadWhatsappUrl } from '../model/whatsapp-message';

const FIELD_ORDER: readonly LeadField[] = ['parentName', 'phone', 'childAgeGroup', 'consent'];
const FIELD_ERRORS: Partial<Record<LeadField, string>> = {
  parentName: 'Scrie numele tău (cel puțin 2 litere).',
  phone: 'Scrie un număr de telefon din România, de exemplu 0722 123 456.',
  childAgeGroup: 'Alege vârsta din listă.',
  consent: 'Bifează acordul ca să te putem contacta.',
};
const GENERAL_ERROR = 'Verifică datele și încearcă din nou.';
const SENDING = 'Se trimite…';
const DONE_OPENED = 'Ți-am deschis WhatsApp cu mesajul completat. Trimite-l și te sunăm să stabilim ziua lecției.';
const DONE_BLOCKED = 'Am primit datele tale și te sunăm în curând. Dacă vrei, scrie-ne și pe WhatsApp.';
const DONE_UNSAVED = 'Nu am putut salva cererea pe site. Trimite mesajul din WhatsApp și rezervarea se finalizează acolo.';
const rateLimitedMessage = (phone: string): string =>
  `Ai trimis deja mai multe cereri în ultima oră. Scrie-ne pe WhatsApp sau sună-ne la ${phone}.`;

export class LeadForm extends HTMLElement {
  private startedAt = 0;
  private submitting = false;
  private testOutcome: TestOutcome | null = null;

  private readonly onTestCompleted = (event: Event): void => {
    const { mode, level } = (event as CustomEvent<LevelTestCompletedDetail>).detail;
    this.testOutcome = { mode, level };
    this.hidden = false;
  };

  connectedCallback(): void {
    if (this.source === 'test') document.addEventListener(LEVEL_TEST_COMPLETED, this.onTestCompleted);
    if (this.dataset.enhanced === 'true') return;
    this.enhance();
    if (this.dataset.enhanced !== 'true' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhance(), { once: true });
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener(LEVEL_TEST_COMPLETED, this.onTestCompleted);
  }

  private get source(): LeadSource {
    const source = this.dataset.source;
    return source === 'landing' || source === 'test' ? source : 'home';
  }

  private enhance(): void {
    if (this.dataset.enhanced === 'true') return;
    const form = this.querySelector<HTMLFormElement>('form.lead-form__form');
    if (!form) return;
    this.querySelector('.lead-form__fallback')?.remove();
    form.hidden = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit(form).catch((error: unknown) => console.error('[lead-form] trimiterea a eșuat', error));
    });
    form.addEventListener('input', (event) => this.clearError(form, event.target));
    form.addEventListener('change', (event) => this.clearError(form, event.target));
    this.preselectAge(form);
    this.startedAt = performance.now();
    this.dataset.enhanced = 'true';
  }

  private preselectAge(form: HTMLFormElement): void {
    const slug = new URLSearchParams(window.location.search).get('grupa');
    const age = slug ? ageGroupForLevel(slug) : null;
    if (!age) return;
    for (const radio of form.querySelectorAll<HTMLInputElement>('input[name="childAgeGroup"]')) {
      if (radio.value === age) radio.checked = true;
    }
  }

  private utm(): Utm {
    const fromAddress = parseUtm(window.location.search);
    if (fromAddress) return fromAddress;
    try {
      return parseStoredUtm(sessionStorage.getItem(UTM_STORAGE_KEY)) ?? EMPTY_UTM;
    } catch (error) {
      console.warn('[lead-form] UTM indisponibil', error);
      return EMPTY_UTM;
    }
  }

  private request(form: HTMLFormElement): LeadRequest {
    const data = new FormData(form);
    const text = (name: string): string => {
      const value = data.get(name);
      return typeof value === 'string' ? value : '';
    };
    const age = text('childAgeGroup');
    return {
      parentName: text('parentName'),
      phone: text('phone'),
      childAgeGroup: age === '' ? null : age,
      source: this.source,
      testLevel: this.source === 'test' && this.testOutcome ? testLevelCode(this.testOutcome) : null,
      consent: data.get('consent') !== null,
      policyVersion: POLICY_VERSION,
      utm: this.utm(),
      website: text('website'),
      elapsedMs: Math.round(performance.now() - this.startedAt),
    };
  }

  private async submit(form: HTMLFormElement): Promise<void> {
    if (this.submitting) return;
    const request = this.request(form);
    this.clearAll(form);
    const local = validateLead(request);
    if (!local.ok) {
      this.showFieldErrors(form, local.fields);
      return;
    }
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    const ageGroup: AgeGroup | null = local.lead.childAgeGroup;
    const whatsappUrl = leadWhatsappUrl({
      parentName: request.parentName,
      phone: request.phone,
      childAgeGroup: ageGroup,
      testResult: this.source === 'test' && this.testOutcome ? testResultLabel(this.testOutcome) : null,
    });
    this.setSubmitting(form, true);
    try {
      const result = await submitLead(request);
      if (result.kind === 'ok' || result.kind === 'network' || result.kind === 'server') {
        popup?.location.replace(whatsappUrl);
        const text = result.kind !== 'ok' ? DONE_UNSAVED : popup ? DONE_OPENED : DONE_BLOCKED;
        this.showDone(form, local.lead.parentName, whatsappUrl, text);
        if (result.kind === 'ok') this.dispatchEvent(createLeadSubmitted({ source: this.source, ageGroup }));
        return;
      }
      popup?.close();
      if (result.kind === 'validation') this.showFieldErrors(form, result.fields);
      else this.showAlert(form, rateLimitedMessage(this.dataset.phoneDisplay ?? ''));
    } finally {
      this.setSubmitting(form, false);
    }
  }

  private setSubmitting(form: HTMLFormElement, submitting: boolean): void {
    this.submitting = submitting;
    const button = form.querySelector<HTMLButtonElement>('.lead-form__submit');
    if (button) button.disabled = submitting;
    form.toggleAttribute('aria-busy', submitting);
    const status = form.querySelector('.lead-form__status');
    if (status) status.textContent = submitting ? SENDING : '';
  }

  private showFieldErrors(form: HTMLFormElement, fields: readonly string[]): void {
    const known = FIELD_ORDER.filter((field) => fields.includes(field));
    if (known.length === 0) {
      this.showAlert(form, GENERAL_ERROR);
      return;
    }
    let first: HTMLInputElement | null = null;
    for (const field of known) {
      const message = form.querySelector(`[data-error-for="${field}"]`);
      if (message) message.textContent = FIELD_ERRORS[field] ?? GENERAL_ERROR;
      const control = form.querySelector<HTMLInputElement>(`[name="${field}"]`);
      control?.setAttribute('aria-invalid', 'true');
      first ??= control;
    }
    first?.focus();
  }

  private showAlert(form: HTMLFormElement, message: string): void {
    const alert = form.querySelector('.lead-form__alert');
    if (alert) alert.textContent = message;
  }

  private clearError(form: HTMLFormElement, target: EventTarget | null): void {
    if (!(target instanceof HTMLInputElement) || target.name === '') return;
    for (const control of form.querySelectorAll(`[name="${target.name}"]`)) control.removeAttribute('aria-invalid');
    const message = form.querySelector(`[data-error-for="${target.name}"]`);
    if (message) message.textContent = '';
  }

  private clearAll(form: HTMLFormElement): void {
    for (const message of form.querySelectorAll('[data-error-for], .lead-form__alert')) message.textContent = '';
    for (const control of form.querySelectorAll('[aria-invalid]')) control.removeAttribute('aria-invalid');
  }

  private showDone(form: HTMLFormElement, name: string, whatsappUrl: string, text: string): void {
    const done = this.querySelector<HTMLElement>('.lead-form__done');
    if (!done) return;
    const nameSlot = done.querySelector('[data-name]');
    if (nameSlot) nameSlot.textContent = name;
    const textSlot = done.querySelector('[data-done-text]');
    if (textSlot) textSlot.textContent = text;
    done.querySelector<HTMLAnchorElement>('[data-whatsapp]')?.setAttribute('href', whatsappUrl);
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }
}

export function defineLeadForm(): void {
  if (!customElements.get('lead-form')) customElements.define('lead-form', LeadForm);
}
```

Notă: `this.hidden = false` pe pagina testului e singura dată când elementul își schimbă vizibilitatea; focusul nu se mută (părintele e încă pe rezultat). Dacă happy-dom nu suportă un API folosit (ex. `toggleAttribute`, `opener` setabil), adaptează minim și notează.

- [ ] **Step 5: Captarea UTM**

`src/features/lead-capture/ui/utm-capture.ts`:

```ts
import { UTM_STORAGE_KEY, parseUtm } from '../model/utm';

export function captureUtm(): void {
  const utm = parseUtm(window.location.search);
  if (!utm) return;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch (error) {
    console.warn('[lead-capture] UTM nu a putut fi păstrat', error);
  }
}
```

Test în `lead-form.element.test.ts` (sau fișier separat `utm-capture.test.ts`, tot cu `// @vitest-environment happy-dom`):

```ts
import { captureUtm } from './utm-capture';

describe('captureUtm', () => {
  it('stores UTM from the address for the rest of the visit', () => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/?utm_source=meta&utm_medium=paid');
    captureUtm();
    expect(JSON.parse(sessionStorage.getItem('em-utm') ?? 'null')).toEqual({ source: 'meta', medium: 'paid', campaign: null });
  });

  it('keeps the stored UTM when the address has none', () => {
    sessionStorage.setItem('em-utm', '{"source":"meta","medium":null,"campaign":null}');
    window.history.replaceState({}, '', '/grupe/');
    captureUtm();
    expect(sessionStorage.getItem('em-utm')).toBe('{"source":"meta","medium":null,"campaign":null}');
  });
});
```

`src/features/lead-capture/ui/UtmCapture.astro`:

```astro
<script>
  import { captureUtm } from './utm-capture';
  captureUtm();
</script>
```

`src/features/lead-capture/index.ts`:

```ts
export { default as LeadForm } from './ui/LeadForm.astro';
export { default as UtmCapture } from './ui/UtmCapture.astro';
```

- [ ] **Step 6: Stiluri**

`src/features/lead-capture/ui/lead-form.css`:

```css
lead-form {
  display: block;
  width: 100%;
  max-width: 640px;
}

.lead-form__fallback {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.lead-form__fallback p {
  margin: 0;
}

.lead-form__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lead-form__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1.1;
}

.lead-form__subtitle {
  margin: -8px 0 0;
  font-weight: 700;
}

.lead-form__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 16px;
}

.lead-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lead-form label,
.lead-form legend {
  font-weight: 800;
  font-size: 0.9375rem;
}

.lead-form input[type='text'],
.lead-form input[type='tel'] {
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  border: 2px solid var(--color-navy);
  border-radius: 14px;
  background: var(--color-white);
  color: var(--color-navy);
  font: inherit;
  font-size: 1.0625rem;
  font-weight: 700;
}

.lead-form input[aria-invalid='true'] {
  border-width: 3px;
}

.lead-form__error {
  min-height: 0;
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
}

.lead-form__error:empty,
.lead-form__alert:empty,
.lead-form__status:empty {
  display: none;
}

.lead-form__ages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  border: 0;
}

.lead-form__optional {
  font-weight: 600;
}

.lead-form__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lead-form__pill {
  position: relative;
}

.lead-form__pill input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.lead-form__pill span {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 2px solid currentColor;
  border-radius: var(--radius-pill);
  font-weight: 800;
  cursor: pointer;
}

.lead-form__pill input:focus-visible + span {
  outline: 3px solid var(--color-navy);
  outline-offset: 3px;
}

.lead-form__trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.lead-form__consent {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  align-items: start;
}

.lead-form__consent input {
  width: 22px;
  height: 22px;
  margin: 2px 0 0;
  accent-color: var(--color-orange);
}

.lead-form__consent label {
  font-weight: 600;
  font-size: 0.9375rem;
}

.lead-form__consent .lead-form__error {
  grid-column: 2;
}

.lead-form__submit {
  align-self: stretch;
  justify-content: center;
}

.lead-form__alert,
.lead-form__status,
.lead-form__note {
  margin: 0;
}

.lead-form__alert {
  font-weight: 800;
}

.lead-form__note {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.lead-form__done {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 22px;
}

.lead-form__done-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
}

.lead-form__done-text {
  margin: 0;
  font-weight: 700;
}

.lead-form__done-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* Pe crem / alb (landing, pagina testului) */
.lead-form--cream {
  color: var(--color-navy);
}

.lead-form--cream .lead-form__error,
.lead-form--cream .lead-form__alert,
.lead-form--cream .lead-form__subtitle {
  color: var(--color-text-accent);
}

.lead-form--cream .lead-form__pill input:checked + span {
  background: var(--color-navy);
  color: var(--color-white);
}

.lead-form--cream .lead-form__consent a {
  color: var(--color-text-accent);
}

.lead-form--cream .lead-form__done {
  background: var(--color-white);
}

/* Pe navy (pagina principală) */
.lead-form--navy {
  color: var(--color-white);
}

.lead-form--navy :focus-visible,
.lead-form--navy .lead-form__pill input:focus-visible + span {
  outline-color: var(--color-sun);
}

.lead-form--navy input[type='text'],
.lead-form--navy input[type='tel'] {
  border-color: var(--color-white);
}

.lead-form--navy .lead-form__error,
.lead-form--navy .lead-form__alert {
  color: var(--color-sun);
}

.lead-form--navy .lead-form__pill span {
  border-color: var(--color-sun);
}

.lead-form--navy .lead-form__pill input:checked + span {
  background: var(--color-sun);
  color: var(--color-navy);
}

.lead-form--navy .lead-form__consent a {
  color: var(--color-sun);
}

.lead-form--navy .lead-form__done {
  background: var(--color-sun);
  color: var(--color-navy);
}

.lead-form--navy .lead-form__done :focus-visible {
  outline-color: var(--color-navy);
}

.lead-form--navy .lead-form__done .button--outline-light {
  border-color: var(--color-navy);
  color: var(--color-navy);
}
```

Verifică perechile de culori față de regulile de contrast din Global Constraints; notează orice ajustare.

- [ ] **Step 7: Verifică și commit**

```bash
npm run verify
git add src/features/lead-capture
git commit -m "feat(lead-capture): add the lead form element with WhatsApp handoff"
```

---

### Task 9: Formularul în pagini, landing `/lectie-demo/`, documentație de operare

**Files:**
- Modify: `src/pages/index.astro`, `src/pages/test-de-nivel.astro`, `src/layouts/BaseLayout.astro`, `tests/pages/pages.test.ts`, `src/sections/home/HomeContact.css` (doar dacă formularul are nevoie de lățime)
- Create: `src/pages/lectie-demo.astro`, `src/sections/lectie-demo/LandingHeader.astro`, `src/sections/lectie-demo/LandingHero.astro`, `src/sections/lectie-demo/LandingSteps.astro`, `src/sections/lectie-demo/LandingPhotos.astro`, `src/sections/lectie-demo/LandingBand.astro`, `src/sections/lectie-demo/lectie-demo.css`, `src/sections/lectie-demo/lectie-demo.test.ts`, `docs/operare/server.md`, `docs/operare/date-personale.md`

**Interfaces:**
- Consumes: `LeadForm`, `UtmCapture` din `@features/lead-capture`; `site` (contact, offer), `EmaPortrait`, `Photo`, `Badge`, `Logo`, `Footer`, `WhatsAppButton`.

- [ ] **Step 1: UTM pe toate paginile**

În `BaseLayout.astro`: `import { UtmCapture } from '@features/lead-capture';` și `<UtmCapture />` ca ultim copil din `<body>`. Dacă regulile de graniță nu permit `layouts → features` prin index (ar trebui să permită, conform spec §4), oprește-te și raportează.

- [ ] **Step 2: Pagina principală**

În `src/pages/index.astro`:

```astro
<HomeContact>
  <LeadForm source="home" tone="navy" />
</HomeContact>
```

(cu `import { LeadForm } from '@features/lead-capture';`). Fără titlu: secțiunea are deja `h2` „Rezervă lecția demo gratuită”. Copia din `HomeContact` trece automat pe „Lasă-ne un număr de telefon…”. Butonul WhatsApp din `.home-contact__actions` rămâne.

- [ ] **Step 3: Pagina testului**

În `src/pages/test-de-nivel.astro`, după `<LevelTest />`:

```astro
<section class="level-test-page__lead" aria-label="Rezervare lecție demo">
  <LeadForm source="test" tone="cream" title="Rezervă lecția demo gratuită" headingLevel={2} showAgeGroups={false} hidden />
</section>
```

și în `<style>`:

```css
.level-test-page__lead {
  max-width: 720px;
  margin: 32px auto 0;
}

.level-test-page__lead lead-form:not([hidden]) {
  display: block;
  padding: clamp(24px, 3vw, 40px);
  border-radius: 32px;
  background: var(--color-cream);
  box-shadow: 0 24px 48px rgb(120 40 0 / 0.25);
}
```

- [ ] **Step 4: Landing `/lectie-demo/`**

Copia exactă (din `design/EnglishMinds Lectie Demo.dc.html`):
- Antet: `Logo` + link `tel:+40775630680` „+40 775 630 680”. Fără meniu.
- Hero: `Badge` „Cluj-Napoca · 5–14 ani”; `h1` „Lecție demo gratuită de engleză”; paragraf „Copilul tău participă la o lecție reală, după metoda Cambridge. Tu afli la ce nivel este și ce grupă i se potrivește.”; `EmaPortrait size="sm"` + bulă „Hei, eu sunt Ema! Te aștept la lecție.”
- Card formular (fundal `--color-cream`, `border-radius: 32px`, `padding: clamp(24px, 3vw, 40px)`, umbră `0 24px 48px rgb(120 40 0 / 0.25)`): `<LeadForm source="landing" tone="cream" title="Rezervă locul acum" subtitle={site.offer.detail} submitLabel="Rezervă lecția gratuită" />`.
- Pași (`h2` vizual ascuns „Cum se desfășoară”; trei carduri, numărul în Barlow Condensed 40px `--color-orange` — cifra are ≥24px, deci contrastul pe crem e permis):
  1. „Completezi formularul” / „Durează 30 de secunde.”
  2. „Te sunăm” / „Stabilim împreună ziua și ora potrivită.”
  3. „Copilul vine la lecție” / „La final îți spunem nivelul și grupa recomandată.”
- Fotografii (raport 4/5, `border-radius: 24px`): `class` „Lecție”, `group` „Elevii academiei”, `teacher-ema` „Profesoară la curs”, `hands` „Copii la curs”.
- Bandă navy: `${site.offer.label}: ${site.offer.headline}` („Ofertă pre-sale 2026: 4 + 1 lună cadou”), adresa `${site.contact.street}, ${site.contact.city}`, `<WhatsAppButton label="Scrie-ne pe WhatsApp" />`.
- `Footer showCta={false}`.

`src/pages/lectie-demo.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import LandingBand from '@sections/lectie-demo/LandingBand.astro';
import LandingHeader from '@sections/lectie-demo/LandingHeader.astro';
import LandingHero from '@sections/lectie-demo/LandingHero.astro';
import LandingPhotos from '@sections/lectie-demo/LandingPhotos.astro';
import LandingSteps from '@sections/lectie-demo/LandingSteps.astro';
import Footer from '@shared/ui/Footer.astro';
---
<BaseLayout
  title="Lecție demo gratuită"
  description="Rezervă o lecție demo gratuită de engleză pentru copilul tău (5–14 ani), după metoda Cambridge, în Cluj-Napoca. Afli nivelul și grupa potrivită."
>
  <LandingHeader />
  <main id="continut">
    <LandingHero />
    <LandingSteps />
    <LandingPhotos />
    <LandingBand />
  </main>
  <Footer showCta={false} />
</BaseLayout>
```

Fiecare secțiune importă `./lectie-demo.css` (un singur fișier pentru toată pagina). `LandingHero.astro` importă `LeadForm` din `@features/lead-capture` (`sections → features` prin index e permis). Layout:
- Mobil (implicit): o coloană — text, Ema, card formular.
- `@media (min-width: 1100px)`: hero pe două coloane (`grid-template-columns: 1.1fr 1fr`), cardul formular în dreapta; pașii pe 3 coloane; fotografiile pe 4 coloane (2 coloane sub 1100px).
- Hero pe `--gradient-hero` cu text alb: `h1` `clamp(2.25rem, 6vw, 4rem)` weight 900 (≥24px, OK pe portocaliu); paragraful 1.1875rem (19px) weight 700 (OK pe portocaliu).
- Linkul de telefon din antet: navy pe crem, weight 800.
- Bandă navy cu text alb; inelul de focus pe navy: `outline-color: var(--color-sun)`.
- Fără lățimi fixe peste 360px; `padding-inline: var(--gutter)`.

`src/sections/lectie-demo/lectie-demo.test.ts` (Container API, ca în `src/sections/home/home.test.ts`): randează fiecare secțiune și verifică textele de mai sus, că `LandingHero` conține `data-source="landing"` și `<h1`, că `LandingHeader` nu conține `site-header__nav` și conține `href="tel:+40775630680"`, că `LandingPhotos` are 4 imagini cu `alt` nevid.

- [ ] **Step 5: Verificări pe HTML-ul construit**

În `tests/pages/pages.test.ts`: adaugă `'lectie-demo/index.html'` în `PAGES` și:

```ts
  it('every lead form page ships its form with the right source', () => {
    expect(read('index.html')).toMatch(/<lead-form[^>]*data-source="home"/);
    expect(read('lectie-demo/index.html')).toMatch(/<lead-form[^>]*data-source="landing"/);
    expect(read('test-de-nivel/index.html')).toMatch(/<lead-form[^>]*data-source="test"[^>]*hidden|<lead-form[^>]*hidden[^>]*data-source="test"/);
  });

  it('the landing page has no main navigation and keeps the phone and WhatsApp', () => {
    const html = read('lectie-demo/index.html');
    expect(html).not.toContain('site-header__nav');
    expect(html).toContain('href="tel:+40775630680"');
    expect(html).toContain('href="https://wa.me/40775630680"');
  });
```

(Dacă clasa meniului din `Header.astro` are alt nume, folosește-l pe cel real.)

- [ ] **Step 6: Documentație de operare**

`docs/operare/server.md` — în română, concis:
1. Variabilele de mediu (lista din `.env.example`, ce înseamnă fiecare; `TRUST_PROXY=true` pe cPanel/Passenger).
2. Baza de date: în phpMyAdmin, importă în ordine `server/db/migrations/001_create_leads.sql`, `002_create_rate_limits.sql`.
3. Publicare: `npm run build:server` → urcă `dist-server/app.cjs` în folderul aplicației Node (punct de pornire `app.cjs`), repornire prin `tmp/restart.txt`.
4. Cron zilnic: `node /calea/aplicatiei/purge-expired-leads.cjs` (cu aceleași variabile de mediu).
5. Local: copiază `.env.example` în `.env`, `npm run dev:server` în alt terminal decât `npm run dev` (proxy `/api` → 3000).
6. De verificat pe staging: rutarea `/api/lead` pe același domeniu (spec §13.1) și că IP-ul din `X-Forwarded-For` e al vizitatorului.

`docs/operare/date-personale.md` — procedura pentru cereri GDPR din phpMyAdmin, cu SQL parametrizat manual:
- acces/export: `SELECT * FROM leads WHERE phone = '+407XXXXXXXX';` (normalizează numărul în formatul `+40…`), export CSV din phpMyAdmin;
- ștergere: `DELETE FROM leads WHERE phone = '+407XXXXXXXX';`;
- păstrare: jobul zilnic șterge contactele mai vechi de 12 luni și limitele mai vechi de 24 de ore;
- ce NU se stochează (spec §6): numele copilului, răspunsurile la test, IP-ul în clar, user-agent-ul.

- [ ] **Step 7: Verifică și commit**

```bash
npm run verify
git add src tests docs/operare
git commit -m "feat(lead-capture): add the booking form to home, test and the demo landing page"
```

Verificare manuală (o face utilizatorul; notează în raport că nu a rulat): 360 / 768 / 1280px pe `/`, `/test-de-nivel/` (după un test complet), `/lectie-demo/?grupa=movers`; trimitere cu serverul local pornit și oprit; Tab prin formular cu focus vizibil.
