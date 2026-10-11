# Consimțământ, taguri și evenimentul Lead — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Banner de cookies (vanilla-cookieconsent v3) cu Google Consent Mode v2, încărcarea GA4 / Google Ads / Meta Pixel doar după acord și transformarea `lead.submitted` în evenimentul „Lead”.

**Architecture:** Feature nou `src/features/consent/`. Logica pură stă în `model/`: ID-uri, semnale Consent Mode, plan de încărcare, conversia Lead. Toate întorc liste de apeluri `TagCall`. `src/core/analytics/track.ts` execută aceste apeluri pe `window.gtag` / `window.fbq` și adaugă scripturile. `<cookie-consent>` leagă biblioteca de model. Un script inline pus primul în `<head>` trimite `consent default = denied` înaintea oricărui tag. Tagurile (gtag.js, fbevents.js) nu apar în HTML static; se adaugă din JS doar după acord (Consent Mode „basic”).

**Tech Stack:** Astro 7 static, Web Components light DOM, TypeScript ~6, Vitest 5 + happy-dom, vanilla-cookieconsent 3.1.0 (pin exact).

**Spec:** `docs/superpowers/specs/2026-10-09-site-englishminds-design.md` (§2 Cookies/Măsurare, §3 pasul 4, §4 `features/consent`, `core/analytics/track.ts`, §6 Cookies, §9 banner, §13 riscul 4, §14 etapa 5)

## Global Constraints

- Fără `Co-Authored-By` sau mențiuni Claude în commituri și PR-uri.
- Dependențe noi doar cu versiune exactă: `vanilla-cookieconsent@3.1.0`.
- Aliasuri `@features/`, `@shared/`, `@core/`; fără `../../`, fără `export *`, fără `catch {}` gol.
- Un feature nu importă alt feature; `consent` ascultă `LEAD_SUBMITTED` din `@shared/contracts/domain-events`.
- `model/` nu atinge `window`, `document`, rețeaua sau Astro.
- `shared/` și `core/` nu importă din `features/`.
- Categorii: `necessary` (doar preferința), `analytics` = GA4, `marketing` = Meta Pixel + Google Ads.
- Implicit toate semnalele Consent Mode sunt `denied`. Butoanele „Accept toate” și „Refuz” au aceeași greutate vizuală. Preferința se schimbă din footer.
- Fără nume sau telefon în evenimentele trimise la Google/Meta.
- Contrast: text mic `#b8461a` doar pe alb/cream/peach. Focus navy pe fundal alb/cream.
- Commituri Conventional, în engleză, la imperativ: `feat(consent): …`.
- `npm run verify` verde la final de task.

## Review Focus

1. **Vizitator care revine cu acord dat:** `onConsent` rulează la fiecare pagină. Fiecare script trebuie adăugat o singură dată, iar `config` nu se repetă dacă `onChange` vine după cu aceeași alegere. Testul e în Task 3: onConsent + onChange.
2. **Upgrade din footer** (doar statistici → toate): se încarcă Pixel și Ads, dar GA4 nu primește alt `config`. Testul e în Task 1 (`planTags` cu `previous`).
3. **Refuz:** zero scripturi adăugate, zero apeluri gtag/fbq. Nici `lead.submitted` nu trimite nimic. Testele sunt în Task 1 și Task 3.
4. **ID-uri încă `TODO` sau greșite:** nu se încarcă nimic și nu apare nicio eroare. Testul e în Task 1 (`parseTrackingIds`).
5. **Retragerea acordului de marketing:** se trimite `fbq('consent','revoke')` și `consent update` cu `denied` înainte de reload. Testul e în Task 1.

---

### Task 1: Model consimțământ + ID-uri de tracking

**Files:**
- Modify: `src/shared/content/site.ts` (cheie nouă `tracking`)
- Create: `src/core/analytics/track.ts` (doar tipurile `TagSink`, `TagCall` în acest task; funcțiile vin în Task 2)
- Create: `src/features/consent/model/tracking-ids.ts`
- Create: `src/features/consent/model/consent-signals.ts`
- Create: `src/features/consent/model/tag-plan.ts`
- Create: `src/features/consent/model/lead-conversion.ts`
- Create: `src/features/consent/model/consent-defaults.ts`
- Test: `src/features/consent/model/consent.test.ts`

**Interfaces:**
- Consumes: `LeadSubmittedDetail` din `@shared/contracts/domain-events` (`{ source: LeadSource; ageGroup: AgeGroup | null }`).
- Produces:
  - `TagCall = { readonly sink: 'gtag' | 'fbq'; readonly args: readonly unknown[] }`, în `@core/analytics/track`.
  - `TrackingIds`, `parseTrackingIds(raw: unknown): TrackingIds`.
  - `ConsentChoice`, `NO_CONSENT`, `toConsentSignals(choice)`.
  - `planTags(ids, choice, previous, now): TagPlan`, `GTAG_URL`, `FBEVENTS_SRC`.
  - `leadConversionCalls(detail, ids, granted): TagCall[]`.
  - `consentDefaultsScript(): string`.

- [ ] **Step 1: ID-urile în `site.ts`**

Adaugă în obiectul `site`, după `company`:

```ts
  tracking: {
    ga4MeasurementId: 'TODO: ID GA4 (G-…)',
    metaPixelId: 'TODO: ID Meta Pixel',
    googleAdsId: 'TODO: ID Google Ads (AW-…)',
    googleAdsLeadLabel: 'TODO: eticheta conversiei Lead din Google Ads',
  },
```

Marcajele `TODO` fac build-ul de producție să eșueze până le dă clientul (același mecanism ca restul câmpurilor).

- [ ] **Step 2: Tipurile din core**

`src/core/analytics/track.ts`:

```ts
export type TagSink = 'gtag' | 'fbq';

export type TagCall = {
  readonly sink: TagSink;
  readonly args: readonly unknown[];
};
```

- [ ] **Step 3: Scrie testele (eșuează)**

`src/features/consent/model/consent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { consentDefaultsScript } from './consent-defaults';
import { NO_CONSENT, toConsentSignals } from './consent-signals';
import { leadConversionCalls } from './lead-conversion';
import { FBEVENTS_SRC, GTAG_URL, planTags } from './tag-plan';
import { parseTrackingIds, type TrackingIds } from './tracking-ids';

const RAW = {
  ga4MeasurementId: 'G-ABC123XYZ',
  metaPixelId: '123456789012345',
  googleAdsId: 'AW-1234567890',
  googleAdsLeadLabel: 'AbC-dEf_123',
};
const IDS = parseTrackingIds(RAW);
const ALL = { analytics: true, marketing: true };
const STATS = { analytics: true, marketing: false };
const NOW = new Date('2026-10-12T10:00:00Z');

describe('parseTrackingIds', () => {
  it('keeps well-formed ids and builds the Ads send_to', () => {
    expect(IDS).toEqual({
      ga4: 'G-ABC123XYZ',
      metaPixel: '123456789012345',
      googleAds: 'AW-1234567890',
      adsLeadSendTo: 'AW-1234567890/AbC-dEf_123',
    });
  });

  it('turns TODO markers and malformed ids into null', () => {
    expect(
      parseTrackingIds({
        ga4MeasurementId: 'TODO: ID GA4 (G-…)',
        metaPixelId: '12ab',
        googleAdsId: 'AW-12',
        googleAdsLeadLabel: 'x',
      }),
    ).toEqual({ ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
  });

  it('drops the conversion when only the label is wrong', () => {
    expect(parseTrackingIds({ ...RAW, googleAdsLeadLabel: 'bad label!' })).toMatchObject({
      googleAds: 'AW-1234567890',
      adsLeadSendTo: null,
    });
  });

  it('survives non-object input', () => {
    expect(parseTrackingIds(null)).toEqual({ ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
    expect(parseTrackingIds('G-ABC123XYZ')).toEqual({ ga4: null, metaPixel: null, googleAds: null, adsLeadSendTo: null });
  });
});

describe('toConsentSignals', () => {
  it('maps analytics to analytics_storage and marketing to the three ad signals', () => {
    expect(toConsentSignals(NO_CONSENT)).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(toConsentSignals(STATS)).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(toConsentSignals({ analytics: false, marketing: true })).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});

describe('planTags', () => {
  it('does nothing on refusal', () => {
    expect(planTags(IDS, NO_CONSENT, NO_CONSENT, NOW)).toEqual({ gtagSrc: null, loadPixel: false, calls: [] });
  });

  it('loads everything once on accept all', () => {
    const plan = planTags(IDS, ALL, NO_CONSENT, NOW);
    expect(plan.gtagSrc).toBe(`${GTAG_URL}?id=G-ABC123XYZ`);
    expect(plan.loadPixel).toBe(true);
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(ALL)] },
      { sink: 'gtag', args: ['js', NOW] },
      { sink: 'gtag', args: ['config', 'G-ABC123XYZ'] },
      { sink: 'gtag', args: ['config', 'AW-1234567890'] },
      { sink: 'fbq', args: ['consent', 'grant'] },
      { sink: 'fbq', args: ['init', '123456789012345'] },
      { sink: 'fbq', args: ['track', 'PageView'] },
    ]);
  });

  it('repeats nothing when the same choice arrives again', () => {
    const plan = planTags(IDS, ALL, ALL, NOW);
    expect(plan.gtagSrc).toBeNull();
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls).toEqual([{ sink: 'gtag', args: ['consent', 'update', toConsentSignals(ALL)] }]);
  });

  it('adds only marketing when upgrading from statistics', () => {
    const plan = planTags(IDS, ALL, STATS, NOW);
    expect(plan.gtagSrc).toBeNull();
    expect(plan.loadPixel).toBe(true);
    expect(plan.calls).not.toContainEqual({ sink: 'gtag', args: ['config', 'G-ABC123XYZ'] });
    expect(plan.calls).toContainEqual({ sink: 'gtag', args: ['config', 'AW-1234567890'] });
  });

  it('uses the Ads id to load gtag.js when only marketing is accepted', () => {
    const plan = planTags(IDS, { analytics: false, marketing: true }, NO_CONSENT, NOW);
    expect(plan.gtagSrc).toBe(`${GTAG_URL}?id=AW-1234567890`);
    expect(plan.calls).not.toContainEqual({ sink: 'gtag', args: ['config', 'G-ABC123XYZ'] });
  });

  it('revokes marketing and denies the signals when marketing is withdrawn', () => {
    const plan = planTags(IDS, STATS, ALL, NOW);
    expect(plan.loadPixel).toBe(false);
    expect(plan.calls).toEqual([
      { sink: 'gtag', args: ['consent', 'update', toConsentSignals(STATS)] },
      { sink: 'fbq', args: ['consent', 'revoke'] },
    ]);
  });

  it('loads nothing when the ids are missing, whatever the choice', () => {
    const none: TrackingIds = parseTrackingIds({});
    expect(planTags(none, ALL, NO_CONSENT, NOW)).toEqual({ gtagSrc: null, loadPixel: false, calls: [] });
  });

  it('exposes the Meta script url', () => {
    expect(FBEVENTS_SRC).toBe('https://connect.facebook.net/en_US/fbevents.js');
  });
});

describe('leadConversionCalls', () => {
  const detail = { source: 'home', ageGroup: '7–8 ani' } as const;

  it('sends nothing without consent', () => {
    expect(leadConversionCalls(detail, IDS, NO_CONSENT)).toEqual([]);
  });

  it('sends the GA4 event only with statistics consent', () => {
    expect(leadConversionCalls(detail, IDS, STATS)).toEqual([
      {
        sink: 'gtag',
        args: ['event', 'generate_lead', { send_to: 'G-ABC123XYZ', lead_source: 'home', age_group: '7–8 ani' }],
      },
    ]);
  });

  it('sends the Ads conversion and the Meta Lead with marketing consent', () => {
    expect(leadConversionCalls(detail, IDS, { analytics: false, marketing: true })).toEqual([
      { sink: 'gtag', args: ['event', 'conversion', { send_to: 'AW-1234567890/AbC-dEf_123' }] },
      { sink: 'fbq', args: ['track', 'Lead', { content_name: 'home' }] },
    ]);
  });

  it('leaves out a missing age group', () => {
    const [call] = leadConversionCalls({ source: 'test', ageGroup: null }, IDS, STATS);
    expect(call?.args[2]).toEqual({ send_to: 'G-ABC123XYZ', lead_source: 'test' });
  });
});

describe('consentDefaultsScript', () => {
  it('queues consent default=denied as an arguments object before anything else', () => {
    const win: { dataLayer?: unknown[]; gtag?: unknown } = {};
    new Function('window', consentDefaultsScript())(win);
    expect(typeof win.gtag).toBe('function');
    const [first, second] = (win.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
    expect(first).toEqual(['consent', 'default', toConsentSignals(NO_CONSENT)]);
    expect(second).toEqual(['set', 'ads_data_redaction', true]);
  });

  it('keeps an existing dataLayer', () => {
    const win: { dataLayer: unknown[] } = { dataLayer: ['earlier'] };
    new Function('window', consentDefaultsScript())(win);
    expect(win.dataLayer[0]).toBe('earlier');
    expect(win.dataLayer).toHaveLength(3);
  });
});
```

- [ ] **Step 4: Rulează testul și confirmă că eșuează**

Run: `npx vitest run src/features/consent/model`
Expected: FAIL (modulele lipsesc).

- [ ] **Step 5: Implementează**

`src/features/consent/model/tracking-ids.ts`:

```ts
export type TrackingIds = {
  readonly ga4: string | null;
  readonly metaPixel: string | null;
  readonly googleAds: string | null;
  readonly adsLeadSendTo: string | null;
};

const GA4 = /^G-[A-Z0-9]{4,20}$/;
const META_PIXEL = /^\d{10,20}$/;
const GOOGLE_ADS = /^AW-\d{6,15}$/;
const ADS_LABEL = /^[A-Za-z0-9_-]{4,40}$/;

function pick(raw: unknown, key: string, pattern: RegExp): string | null {
  if (raw === null || typeof raw !== 'object') return null;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === 'string' && pattern.test(value) ? value : null;
}

export function parseTrackingIds(raw: unknown): TrackingIds {
  const googleAds = pick(raw, 'googleAdsId', GOOGLE_ADS);
  const label = pick(raw, 'googleAdsLeadLabel', ADS_LABEL);
  return {
    ga4: pick(raw, 'ga4MeasurementId', GA4),
    metaPixel: pick(raw, 'metaPixelId', META_PIXEL),
    googleAds,
    adsLeadSendTo: googleAds && label ? `${googleAds}/${label}` : null,
  };
}
```

`src/features/consent/model/consent-signals.ts`:

```ts
export type ConsentChoice = {
  readonly analytics: boolean;
  readonly marketing: boolean;
};

export const NO_CONSENT: ConsentChoice = { analytics: false, marketing: false };

type Signal = 'granted' | 'denied';

export type ConsentSignals = {
  readonly analytics_storage: Signal;
  readonly ad_storage: Signal;
  readonly ad_user_data: Signal;
  readonly ad_personalization: Signal;
};

const signal = (granted: boolean): Signal => (granted ? 'granted' : 'denied');

export function toConsentSignals(choice: ConsentChoice): ConsentSignals {
  return {
    analytics_storage: signal(choice.analytics),
    ad_storage: signal(choice.marketing),
    ad_user_data: signal(choice.marketing),
    ad_personalization: signal(choice.marketing),
  };
}
```

`src/features/consent/model/tag-plan.ts`:

```ts
import type { TagCall } from '@core/analytics/track';
import { toConsentSignals, type ConsentChoice } from './consent-signals';
import type { TrackingIds } from './tracking-ids';

export const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';
export const FBEVENTS_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

export type TagPlan = {
  readonly gtagSrc: string | null;
  readonly loadPixel: boolean;
  readonly calls: readonly TagCall[];
};

const gtag = (...args: unknown[]): TagCall => ({ sink: 'gtag', args });
const fbq = (...args: unknown[]): TagCall => ({ sink: 'fbq', args });

function gtagId(ids: TrackingIds, choice: ConsentChoice): string | null {
  if (choice.analytics && ids.ga4) return ids.ga4;
  if (choice.marketing && ids.googleAds) return ids.googleAds;
  return null;
}

const pixelOn = (ids: TrackingIds, choice: ConsentChoice): boolean => Boolean(ids.metaPixel && choice.marketing);

export function planTags(ids: TrackingIds, choice: ConsentChoice, previous: ConsentChoice, now: Date): TagPlan {
  const calls: TagCall[] = [];
  const gtagNow = gtagId(ids, choice);
  const gtagBefore = gtagId(ids, previous);
  const gtagSrc = gtagNow && !gtagBefore ? `${GTAG_URL}?id=${gtagNow}` : null;

  if (gtagNow || gtagBefore) calls.push(gtag('consent', 'update', toConsentSignals(choice)));
  if (gtagSrc) calls.push(gtag('js', now));
  if (ids.ga4 && choice.analytics && !previous.analytics) calls.push(gtag('config', ids.ga4));
  if (ids.googleAds && choice.marketing && !previous.marketing) calls.push(gtag('config', ids.googleAds));

  const pixelNow = pixelOn(ids, choice);
  const pixelBefore = pixelOn(ids, previous);
  if (pixelNow && !pixelBefore) {
    calls.push(fbq('consent', 'grant'), fbq('init', ids.metaPixel), fbq('track', 'PageView'));
  }
  if (!pixelNow && pixelBefore) calls.push(fbq('consent', 'revoke'));

  return { gtagSrc, loadPixel: pixelNow && !pixelBefore, calls };
}
```

`src/features/consent/model/lead-conversion.ts`:

```ts
import type { TagCall } from '@core/analytics/track';
import type { LeadSubmittedDetail } from '@shared/contracts/domain-events';
import type { ConsentChoice } from './consent-signals';
import type { TrackingIds } from './tracking-ids';

export function leadConversionCalls(
  detail: LeadSubmittedDetail,
  ids: TrackingIds,
  granted: ConsentChoice,
): TagCall[] {
  const calls: TagCall[] = [];
  if (granted.analytics && ids.ga4) {
    const params = { send_to: ids.ga4, lead_source: detail.source };
    calls.push({
      sink: 'gtag',
      args: ['event', 'generate_lead', detail.ageGroup ? { ...params, age_group: detail.ageGroup } : params],
    });
  }
  if (granted.marketing && ids.adsLeadSendTo) {
    calls.push({ sink: 'gtag', args: ['event', 'conversion', { send_to: ids.adsLeadSendTo }] });
  }
  if (granted.marketing && ids.metaPixel) {
    calls.push({ sink: 'fbq', args: ['track', 'Lead', { content_name: detail.source }] });
  }
  return calls;
}
```

`src/features/consent/model/consent-defaults.ts`:

```ts
import { NO_CONSENT, toConsentSignals } from './consent-signals';

/**
 * Inline script for the top of <head>. gtag must push the `arguments` object, not an array,
 * otherwise gtag.js ignores the command.
 */
export function consentDefaultsScript(): string {
  const denied = JSON.stringify(toConsentSignals(NO_CONSENT));
  return [
    'window.dataLayer=window.dataLayer||[];',
    'window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};',
    `window.gtag('consent','default',${denied});`,
    "window.gtag('set','ads_data_redaction',true);",
  ].join('');
}
```

- [ ] **Step 6: Rulează testele**

Run: `npx vitest run src/features/consent/model src/shared/content`
Expected: PASS. Dacă `site.test.ts` sau `find-todo-markers` au un test care numără marcajele `TODO`, actualizează-l pentru cele 4 câmpuri noi.

- [ ] **Step 7: Verify + commit**

Run: `npm run lint && npm run check && npm run deps`

```bash
git add src/shared/content/site.ts src/core/analytics/track.ts src/features/consent/model
git commit -m "feat(consent): add the consent model, tag plan and Lead conversion mapping"
```

---

### Task 2: Executorul de taguri din `core/analytics`

**Files:**
- Modify: `src/core/analytics/track.ts`
- Test: `src/core/analytics/track.test.ts`

**Interfaces:**
- Consumes: `TagCall`, `TagSink` (Task 1).
- Produces:
  - `TrackingWindow` (tip structural `{ dataLayer?, gtag?, fbq?, _fbq? }`).
  - `sendTagCalls(target: TrackingWindow, calls: readonly TagCall[]): void`.
  - `ensureFbq(target: TrackingWindow): void`.
  - `appendScript(doc: Document, src: string): void`.

- [ ] **Step 1: Scrie testele (eșuează)**

`src/core/analytics/track.test.ts`:

```ts
// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "disableJavaScriptFileLoading": true, "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendScript, ensureFbq, sendTagCalls, type TrackingWindow } from './track';

afterEach(() => {
  document.head.innerHTML = '';
});

describe('sendTagCalls', () => {
  it('calls each sink with its arguments, in order', () => {
    const order: string[] = [];
    const target: TrackingWindow = {
      gtag: vi.fn((...args: unknown[]) => order.push(`gtag:${String(args[0])}`)),
      fbq: vi.fn((...args: unknown[]) => order.push(`fbq:${String(args[0])}`)),
    };
    sendTagCalls(target, [
      { sink: 'gtag', args: ['consent', 'update', {}] },
      { sink: 'fbq', args: ['init', '1'] },
      { sink: 'gtag', args: ['config', 'G-X'] },
    ]);
    expect(order).toEqual(['gtag:consent', 'fbq:init', 'gtag:config']);
    expect(target.fbq).toHaveBeenCalledWith('init', '1');
  });

  it('skips a sink that is missing, e.g. blocked by an ad blocker', () => {
    expect(() => sendTagCalls({}, [{ sink: 'fbq', args: ['track', 'Lead'] }])).not.toThrow();
  });
});

describe('ensureFbq', () => {
  it('installs a queueing stub like the official Meta snippet', () => {
    const target: TrackingWindow = {};
    ensureFbq(target);
    target.fbq?.('init', '123');
    const stub = target.fbq as unknown as { queue: unknown[][]; loaded: boolean; version: string };
    expect(stub.queue).toEqual([['init', '123']]);
    expect(stub.loaded).toBe(true);
    expect(stub.version).toBe('2.0');
    expect(target._fbq).toBe(target.fbq);
  });

  it('keeps an existing fbq', () => {
    const existing = vi.fn();
    const target: TrackingWindow = { fbq: existing };
    ensureFbq(target);
    expect(target.fbq).toBe(existing);
  });
});

describe('appendScript', () => {
  it('adds one async script to head and never duplicates it', () => {
    appendScript(document, 'https://example.test/a.js');
    appendScript(document, 'https://example.test/a.js');
    const scripts = document.head.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute('src')).toBe('https://example.test/a.js');
    expect(scripts[0]?.async).toBe(true);
  });
});
```

Dacă happy-dom 20 nu recunoaște opțiunile din docblock și încearcă totuși să descarce scriptul, verifică numele exact al setărilor în `node_modules/happy-dom/lib/browser/types/IBrowserSettings.d.ts` și folosește-le. Nu înlocui testul cu un mock pentru `document`.

- [ ] **Step 2: Rulează testul și confirmă că eșuează**

Run: `npx vitest run src/core/analytics`
Expected: FAIL (funcțiile lipsesc).

- [ ] **Step 3: Implementează**

`src/core/analytics/track.ts`, complet:

```ts
export type TagSink = 'gtag' | 'fbq';

export type TagCall = {
  readonly sink: TagSink;
  readonly args: readonly unknown[];
};

type TagFunction = (...args: unknown[]) => void;

export type TrackingWindow = {
  dataLayer?: unknown[];
  gtag?: TagFunction;
  fbq?: TagFunction;
  _fbq?: TagFunction;
};

type FbqStub = TagFunction & {
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: TagFunction;
  callMethod?: TagFunction;
};

/** Runs calls already filtered by consent; a missing sink (ad blocker) is skipped. */
export function sendTagCalls(target: TrackingWindow, calls: readonly TagCall[]): void {
  for (const call of calls) {
    const fn = target[call.sink];
    if (typeof fn === 'function') fn(...call.args);
  }
}

export function ensureFbq(target: TrackingWindow): void {
  if (typeof target.fbq === 'function') return;
  const stub = ((...args: unknown[]) => {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  }) as FbqStub;
  stub.queue = [];
  stub.loaded = true;
  stub.version = '2.0';
  stub.push = stub;
  target.fbq = stub;
  target._fbq = stub;
}

export function appendScript(doc: Document, src: string): void {
  if (Array.from(doc.scripts).some((script) => script.getAttribute('src') === src)) return;
  const script = doc.createElement('script');
  script.async = true;
  script.src = src;
  doc.head.append(script);
}
```

- [ ] **Step 4: Rulează testele**

Run: `npx vitest run src/core/analytics src/features/consent`
Expected: PASS.

- [ ] **Step 5: Verify + commit**

Run: `npm run lint && npm run check && npm run deps`

```bash
git add src/core/analytics
git commit -m "feat(analytics): run consented tag calls and load tag scripts once"
```

---

### Task 3: Bannerul `<cookie-consent>`

**Files:**
- Modify: `package.json`, `package-lock.json` (`vanilla-cookieconsent` exact `3.1.0` în `dependencies`)
- Create: `src/features/consent/ui/consent-config.ts`
- Create: `src/features/consent/ui/cookie-consent.element.ts`
- Create: `src/features/consent/ui/CookieConsent.astro`
- Create: `src/features/consent/ui/ConsentDefaults.astro`
- Create: `src/features/consent/ui/cookie-consent.css`
- Create: `src/features/consent/index.ts`
- Test: `src/features/consent/ui/cookie-consent.element.test.ts`
- Test: `src/features/consent/ui/ConsentDefaults.test.ts`

**Interfaces:**
- Consumes: everything Task 1 and Task 2 produce. `LEAD_SUBMITTED`, `LeadSubmittedDetail` from `@shared/contracts/domain-events`. `site.tracking` from `@shared/content/site`.
- Produces:
  - `export { default as ConsentDefaults } from './ui/ConsentDefaults.astro'` and `export { default as CookieConsent } from './ui/CookieConsent.astro'` in `index.ts`.
  - `defineCookieConsent()`.
  - `COOKIE_REVISION`.
  - `buildConsentConfig(handlers)`.
  - The element reads its ids from the `data-tracking` attribute (the JSON of `site.tracking`), so tests can pass valid ids.

- [ ] **Step 1: Instalează dependența**

Run: `npm install --save-exact vanilla-cookieconsent@3.1.0`
Verifică în `package.json`: `"vanilla-cookieconsent": "3.1.0"` (fără `^`).

- [ ] **Step 2: Scrie testele (eșuează)**

`src/features/consent/ui/cookie-consent.element.test.ts`:

```ts
// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "disableJavaScriptFileLoading": true, "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as CookieConsentApi from 'vanilla-cookieconsent';
import { createLeadSubmitted } from '@shared/contracts/domain-events';
import { FBEVENTS_SRC, GTAG_URL } from '../model/tag-plan';

const lib = vi.hoisted(() => ({
  config: null as CookieConsentApi.CookieConsentConfig | null,
  accepted: new Set<string>(),
}));

vi.mock('vanilla-cookieconsent', () => ({
  run: vi.fn(async (config: CookieConsentApi.CookieConsentConfig) => {
    lib.config = config;
  }),
  acceptedCategory: vi.fn((name: string) => lib.accepted.has(name)),
}));

const { run } = await import('vanilla-cookieconsent');
const { defineCookieConsent } = await import('./cookie-consent.element');
const { COOKIE_REVISION } = await import('./consent-config');

const TRACKING = {
  ga4MeasurementId: 'G-ABC123XYZ',
  metaPixelId: '123456789012345',
  googleAdsId: 'AW-1234567890',
  googleAdsLeadLabel: 'AbC-dEf_123',
};

type TestWindow = Window & { dataLayer: unknown[]; gtag: (...args: unknown[]) => void; fbq?: unknown; _fbq?: unknown };
const win = window as unknown as TestWindow;

function mount(): HTMLElement {
  const el = document.createElement('cookie-consent');
  el.dataset.tracking = JSON.stringify(TRACKING);
  document.body.append(el);
  return el;
}

const commands = () => win.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>));
const scriptSrcs = () => Array.from(document.head.querySelectorAll('script')).map((s) => s.getAttribute('src'));
const consent = () => lib.config?.onConsent?.({ cookie: {} as CookieConsentApi.CookieValue });
const change = () =>
  lib.config?.onChange?.({ cookie: {} as CookieConsentApi.CookieValue, changedCategories: [], changedServices: {} });

beforeEach(() => {
  defineCookieConsent();
  lib.config = null;
  lib.accepted.clear();
  vi.mocked(run).mockClear();
  win.dataLayer = [];
  win.gtag = function gtag() {
    win.dataLayer.push(arguments);
  };
  delete win.fbq;
  delete win._fbq;
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('<cookie-consent>', () => {
  it('starts the library once, in Romanian, with equal Accept/Refuz buttons', () => {
    const el = mount();
    el.remove();
    document.body.append(el);
    expect(run).toHaveBeenCalledTimes(1);
    const config = lib.config;
    expect(config?.language.default).toBe('ro');
    expect(config?.revision).toBe(COOKIE_REVISION);
    expect(config?.categories.necessary).toMatchObject({ enabled: true, readOnly: true });
    expect(Object.keys(config?.categories ?? {})).toEqual(['necessary', 'analytics', 'marketing']);
    expect(config?.guiOptions?.consentModal?.equalWeightButtons).toBe(true);
    expect(config?.guiOptions?.preferencesModal?.equalWeightButtons).toBe(true);
  });

  it('loads nothing and calls nothing after a refusal', () => {
    mount();
    consent();
    expect(scriptSrcs()).toEqual([]);
    expect(commands()).toEqual([]);
  });

  it('loads gtag.js and the pixel once on accept all, even if onChange repeats the choice', () => {
    mount();
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    change();
    expect(scriptSrcs()).toEqual([`${GTAG_URL}?id=G-ABC123XYZ`, FBEVENTS_SRC]);
    const configs = commands().filter((c) => c[0] === 'config');
    expect(configs).toEqual([
      ['config', 'G-ABC123XYZ'],
      ['config', 'AW-1234567890'],
    ]);
    const queue = (win.fbq as { queue: unknown[][] }).queue;
    expect(queue).toContainEqual(['init', '123456789012345']);
  });

  it('turns lead.submitted into GA4, Ads and Meta Lead events when everything is accepted', () => {
    const el = mount();
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    const form = document.createElement('div');
    el.after(form);
    form.dispatchEvent(createLeadSubmitted({ source: 'landing', ageGroup: null }));
    expect(commands()).toContainEqual(['event', 'generate_lead', { send_to: 'G-ABC123XYZ', lead_source: 'landing' }]);
    expect(commands()).toContainEqual(['event', 'conversion', { send_to: 'AW-1234567890/AbC-dEf_123' }]);
    expect((win.fbq as { queue: unknown[][] }).queue).toContainEqual(['track', 'Lead', { content_name: 'landing' }]);
  });

  it('sends no Lead anywhere after a refusal', () => {
    mount();
    consent();
    document.body.dispatchEvent(createLeadSubmitted({ source: 'home', ageGroup: null }));
    expect(commands()).toEqual([]);
    expect(win.fbq).toBeUndefined();
  });

  it('stops listening once removed', () => {
    const el = mount();
    lib.accepted = new Set(['analytics']);
    consent();
    el.remove();
    win.dataLayer = [];
    document.body.dispatchEvent(createLeadSubmitted({ source: 'home', ageGroup: null }));
    expect(commands()).toEqual([]);
  });

  it('treats a missing or broken data-tracking as no ids', () => {
    const el = document.createElement('cookie-consent');
    el.dataset.tracking = '{not json';
    document.body.append(el);
    lib.accepted = new Set(['analytics', 'marketing']);
    consent();
    expect(scriptSrcs()).toEqual([]);
  });
});
```

`src/features/consent/ui/ConsentDefaults.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ConsentDefaults from './ConsentDefaults.astro';

describe('ConsentDefaults', () => {
  it('renders the denied defaults as a plain inline script', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ConsentDefaults);
    expect(html).toMatch(/^<script>window\.dataLayer=/);
    expect(html).toContain(`"analytics_storage":"denied"`);
    expect(html).toContain(`"ad_user_data":"denied"`);
    expect(html).not.toContain('type="module"');
  });
});
```

- [ ] **Step 3: Rulează testele și confirmă că eșuează**

Run: `npx vitest run src/features/consent/ui`
Expected: FAIL (modulele lipsesc).

- [ ] **Step 4: Configurația bannerului**

`src/features/consent/ui/consent-config.ts`:

```ts
import type { CookieConsentConfig } from 'vanilla-cookieconsent';

/** Bump when the cookie policy changes; everyone is asked again. */
export const COOKIE_REVISION = 1;

type Handlers = {
  readonly onConsent: () => void;
  readonly onChange: () => void;
};

const POLICY_LINKS =
  '<a href="/cookies/">Politica de cookies</a> <a href="/confidentialitate/">Confidențialitate</a>';

export function buildConsentConfig(handlers: Handlers): CookieConsentConfig {
  return {
    revision: COOKIE_REVISION,
    cookie: { name: 'em_consent', sameSite: 'Lax', expiresAfterDays: 182 },
    guiOptions: {
      consentModal: { layout: 'box inline', position: 'bottom left', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
    },
    onConsent: handlers.onConsent,
    onChange: handlers.onChange,
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {
        autoClear: { cookies: [{ name: /^_ga/ }, { name: '_gid' }], reloadPage: true },
      },
      marketing: {
        autoClear: { cookies: [{ name: '_fbp' }, { name: /^_gcl/ }], reloadPage: true },
      },
    },
    language: {
      default: 'ro',
      translations: {
        ro: {
          consentModal: {
            title: 'Cookie-uri doar cu acordul tău',
            description:
              'Cookie-urile necesare țin minte doar alegerea ta. Cu acordul tău folosim și cookie-uri de statistici (Google Analytics) și de marketing (Meta, Google Ads), ca să știm ce reclame aduc părinții la lecția demo.',
            acceptAllBtn: 'Accept toate',
            acceptNecessaryBtn: 'Refuz',
            showPreferencesBtn: 'Aleg eu',
            footer: POLICY_LINKS,
          },
          preferencesModal: {
            title: 'Setări cookies',
            acceptAllBtn: 'Accept toate',
            acceptNecessaryBtn: 'Refuz toate',
            savePreferencesBtn: 'Salvez alegerea',
            closeIconLabel: 'Închide',
            sections: [
              {
                description:
                  'Alegi ce cookie-uri accepți. Poți schimba oricând alegerea din linkul „Setări cookies” din subsolul paginii.',
              },
              {
                title: 'Necesare',
                description: 'Țin minte alegerea ta despre cookie-uri. Nu pot fi oprite.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Statistici',
                description: 'Google Analytics: câți părinți vizitează site-ul și ce pagini citesc. Fără nume sau telefon.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Marketing',
                description:
                  'Meta Pixel și Google Ads: ne arată ce reclame aduc rezervări la lecția demo. Fără nume sau telefon.',
                linkedCategory: 'marketing',
              },
              { title: 'Mai multe', description: POLICY_LINKS },
            ],
          },
        },
      },
    },
  };
}
```

The texts are drafts that go through the lawyer's review together with the cookie policy (spec §6).

- [ ] **Step 5: Elementul**

`src/features/consent/ui/cookie-consent.element.ts`:

```ts
import * as CookieConsent from 'vanilla-cookieconsent';
import { appendScript, ensureFbq, sendTagCalls, type TrackingWindow } from '@core/analytics/track';
import { LEAD_SUBMITTED, type LeadSubmittedDetail } from '@shared/contracts/domain-events';
import { NO_CONSENT, type ConsentChoice } from '../model/consent-signals';
import { leadConversionCalls } from '../model/lead-conversion';
import { FBEVENTS_SRC, planTags } from '../model/tag-plan';
import { parseTrackingIds, type TrackingIds } from '../model/tracking-ids';
import { buildConsentConfig } from './consent-config';

function readTracking(json: string | undefined): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    console.warn('cookie-consent: data-tracking is not valid JSON', error);
    return null;
  }
}

export class CookieConsentElement extends HTMLElement {
  private started = false;
  private ids: TrackingIds = parseTrackingIds(null);
  private applied: ConsentChoice = NO_CONSENT;

  connectedCallback(): void {
    document.addEventListener(LEAD_SUBMITTED, this.onLead);
    if (this.started) return;
    this.started = true;
    this.ids = parseTrackingIds(readTracking(this.dataset.tracking));
    CookieConsent.run(buildConsentConfig({ onConsent: this.apply, onChange: this.apply })).catch((error: unknown) => {
      console.error('cookie-consent: banner failed to start', error);
    });
  }

  disconnectedCallback(): void {
    document.removeEventListener(LEAD_SUBMITTED, this.onLead);
  }

  private readonly apply = (): void => {
    const choice: ConsentChoice = {
      analytics: CookieConsent.acceptedCategory('analytics'),
      marketing: CookieConsent.acceptedCategory('marketing'),
    };
    const plan = planTags(this.ids, choice, this.applied, new Date());
    const target = window as unknown as TrackingWindow;
    if (plan.gtagSrc) appendScript(document, plan.gtagSrc);
    if (plan.loadPixel) {
      ensureFbq(target);
      appendScript(document, FBEVENTS_SRC);
    }
    sendTagCalls(target, plan.calls);
    this.applied = choice;
  };

  private readonly onLead = (event: Event): void => {
    const { detail } = event as CustomEvent<LeadSubmittedDetail>;
    sendTagCalls(window as unknown as TrackingWindow, leadConversionCalls(detail, this.ids, this.applied));
  };
}

export function defineCookieConsent(): void {
  if (!customElements.get('cookie-consent')) customElements.define('cookie-consent', CookieConsentElement);
}
```

`onLead` folosește `this.applied` (ce s-a încărcat efectiv), nu starea curentă din bibliotecă. Astfel un Lead nu ajunge niciodată la un tag neîncărcat.

- [ ] **Step 6: Componentele Astro, CSS, index**

`src/features/consent/ui/ConsentDefaults.astro`:

```astro
---
import { consentDefaultsScript } from '../model/consent-defaults';
---
<script is:inline set:html={consentDefaultsScript()} />
```

`src/features/consent/ui/CookieConsent.astro`:

```astro
---
import { site } from '@shared/content/site';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import './cookie-consent.css';
---
<cookie-consent data-tracking={JSON.stringify(site.tracking)}></cookie-consent>

<script>
  import { defineCookieConsent } from './cookie-consent.element';
  defineCookieConsent();
</script>
```

`src/features/consent/ui/cookie-consent.css`:

```css
#cc-main {
  --cc-font-family: var(--font-body);
  --cc-bg: var(--color-white);
  --cc-primary-color: var(--color-navy);
  --cc-secondary-color: var(--color-navy);
  --cc-link-color: var(--color-text-accent);
  --cc-btn-border-radius: var(--radius-pill);
  --cc-modal-border-radius: var(--radius-card);
  --cc-btn-primary-bg: var(--color-navy);
  --cc-btn-primary-color: var(--color-white);
  --cc-btn-primary-border-color: var(--color-navy);
  --cc-btn-primary-hover-bg: #0b1530;
  --cc-btn-primary-hover-color: var(--color-white);
  --cc-btn-primary-hover-border-color: #0b1530;
  --cc-btn-secondary-bg: var(--color-cream);
  --cc-btn-secondary-color: var(--color-navy);
  --cc-btn-secondary-border-color: var(--color-cream-border);
  --cc-btn-secondary-hover-bg: var(--color-peach);
  --cc-btn-secondary-hover-color: var(--color-navy);
  --cc-btn-secondary-hover-border-color: var(--color-cream-border);
  --cc-toggle-on-bg: var(--color-navy);
  --cc-cookie-category-block-bg: var(--color-cream);
  --cc-cookie-category-block-border: var(--color-cream-border);
  --cc-footer-bg: var(--color-cream);
  --cc-footer-color: var(--color-navy);
  --cc-footer-border-color: var(--color-cream-border);
}

#cc-main :focus-visible {
  outline: 3px solid var(--color-navy);
  outline-offset: 2px;
}
```

`src/features/consent/index.ts`:

```ts
export { default as ConsentDefaults } from './ui/ConsentDefaults.astro';
export { default as CookieConsent } from './ui/CookieConsent.astro';
```

- [ ] **Step 7: Rulează testele**

Run: `npx vitest run src/features/consent src/core`
Expected: PASS. Dacă `import * as CookieConsent` nu tipează cu `export =` din `types/index.d.ts`, verifică `esModuleInterop`/`allowSyntheticDefaultImports` în `astro/tsconfigs/strict` înainte să schimbi forma importului. Forma `import * as` e cea documentată de bibliotecă pentru ESM.

- [ ] **Step 8: Verify + commit**

Run: `npm run lint && npm run check && npm run deps`

```bash
git add package.json package-lock.json src/features/consent
git commit -m "feat(consent): add the cookie banner with Consent Mode v2 and the Lead event"
```

---

### Task 4: Montarea pe site, footer, verificări în `dist/`, documentație

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/shared/ui/Footer.astro`, `src/shared/ui/Footer.css`, `src/shared/ui/Footer.test.ts`
- Modify: `tests/pages/pages.test.ts`
- Create: `docs/operare/taguri.md`
- Modify: `.claude/skills/project-conventions/SKILL.md` (decision log)

**Interfaces:**
- Consumes: `ConsentDefaults` and `CookieConsent` from `@features/consent`.
- Produces: every page carries the consent defaults first in `<head>` and the `<cookie-consent>` element. The footer has a button with `data-cc="show-preferencesModal"`. The library opens the preferences modal itself on any element with this attribute.

- [ ] **Step 1: Testele (eșuează)**

În `src/shared/ui/Footer.test.ts` adaugă:

```ts
  it('lets the visitor reopen the cookie settings', async () => {
    expect(await render()).toMatch(/<button[^>]*type="button"[^>]*data-cc="show-preferencesModal"[^>]*>Setări cookies<\/button>/);
  });
```

În `tests/pages/pages.test.ts`, în `describe('built pages')`, adaugă:

```ts
  it.each(PAGES)('%s sends consent defaults (all denied) before any other script', (page) => {
    const html = read(page);
    const head = html.slice(0, html.indexOf('</head>'));
    const firstScript = head.slice(head.indexOf('<script'));
    expect(firstScript).toMatch(/^<script>window\.dataLayer=/);
    for (const signal of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
      expect(firstScript).toContain(`"${signal}":"denied"`);
    }
  });

  it.each(PAGES)('%s ships the banner but no tag script in the static HTML', (page) => {
    const html = read(page);
    expect(html).toContain('<cookie-consent');
    expect(html).toContain('data-cc="show-preferencesModal"');
    expect(html).not.toMatch(/<script[^>]*src="https:\/\/www\.googletagmanager\.com/);
    expect(html).not.toMatch(/<script[^>]*src="https:\/\/connect\.facebook\.net/);
  });
```

Run: `npx vitest run src/shared/ui/Footer.test.ts`
Expected: FAIL.

- [ ] **Step 2: Layout**

`src/layouts/BaseLayout.astro`: import `import { ConsentDefaults, CookieConsent } from '@features/consent';`. În `<head>`, imediat după `<meta charset="utf-8" />`, pune `<ConsentDefaults />`. În `<body>`, după `<UtmCapture />`, pune `<CookieConsent />`.

- [ ] **Step 3: Footer**

În `src/shared/ui/Footer.astro`, în lista `site-footer__legal`, după `LEGAL.map(...)`:

```astro
          <li><button type="button" class="site-footer__cookie-settings" data-cc="show-preferencesModal">Setări cookies</button></li>
```

În `src/shared/ui/Footer.css` stilizează butonul exact ca linkurile din `.site-footer__legal a`: copiază culoarea, fontul, mărimea și subliniatul de acolo. Adaugă `background: none; border: 0; padding: 0; cursor: pointer;` și același stil `:focus-visible` pe care îl au linkurile.

- [ ] **Step 4: Build și verificare `dist/`**

Run: `npm run build && npm run test:dist`
Expected: PASS. Build-ul de dezvoltare trece; marcajele `TODO` din `site.tracking` dau doar un `warn`.

- [ ] **Step 5: Documentația**

`docs/operare/taguri.md`, în română, scurt, cu secțiunile:

- **Ce cookie-uri folosește site-ul.** Tabel cu categoria, serviciul, cookie-urile și durata:
  - `em_consent`: necesar, 182 de zile;
  - `_ga`, `_ga_*`: statistici, GA4;
  - `_fbp`: marketing, Meta;
  - `_gcl_*`: marketing, Google Ads.
  
  Tabelul e baza pentru politica de cookies din etapa 6.
- **Unde se pun ID-urile.** `src/shared/content/site.ts` → `tracking`, cu formatul fiecăruia:
  - `G-…`;
  - 10–20 cifre;
  - `AW-…`;
  - eticheta conversiei.
  
  Un ID greșit e ignorat în tăcere, deci se verifică după publicare.
- **Ce evenimente pleacă:**
  - `generate_lead` la GA4; se marchează ca „key event” în GA4;
  - `conversion` cu `send_to` la Google Ads;
  - `Lead` standard la Meta.
  
  Toate pleacă doar la `201` și doar cu acordul pentru categoria respectivă. Nu conțin nume sau telefon.
- **Cum se verifică:**
  - Google Tag Assistant și Meta Pixel Helper, după „Accept toate”;
  - în DevTools → Network: după „Refuz” nu apare nicio cerere la `googletagmanager.com` sau `facebook.net`.
- **Când se schimbă politica de cookies:** crește `COOKIE_REVISION` în `src/features/consent/ui/consent-config.ts`, ca toți vizitatorii să fie întrebați din nou.

- [ ] **Step 6: Decision log**

În `.claude/skills/project-conventions/SKILL.md`, la tabelul „Decision log”, adaugă:

```
| 2026-10-12 | Consent Mode „basic”: gtag.js și fbevents.js se încarcă doar după acord | Spec: taguri doar cu acord; `default denied` inline, primul în `<head>` |
```

- [ ] **Step 7: Verify complet + commit**

Run: `npm run verify`
Expected: totul verde.

```bash
git add src/layouts/BaseLayout.astro src/shared/ui/Footer.astro src/shared/ui/Footer.css src/shared/ui/Footer.test.ts tests/pages/pages.test.ts docs/operare/taguri.md .claude/skills/project-conventions/SKILL.md
git commit -m "feat(consent): mount the banner on every page and document the tags"
```

---

## Decizii

1. **Consent Mode „basic”, nu „advanced”.** Spec §2 cere taguri „doar după acord”, deci înainte de acord nu se trimit nici pinguri cookieless.
2. **ID-urile ca `TODO` în `site.ts`.** Același mecanism ca restul datelor de la client: build-ul de producție eșuează până sunt completate. La rulare un ID invalid devine `null` și tagul nu se încarcă.
3. **ID-urile ajung la element prin `data-tracking`**, nu printr-un import din `site.ts`. Bundle-ul JS rămâne mic, iar elementul se poate testa cu ID-uri valide.
4. **Retragerea acordului** șterge cookie-urile categoriei și reîncarcă pagina (`autoClear.reloadPage`). Scripturile deja încărcate nu se pot descărca altfel.
5. **Lead-ul pleacă doar la `201`**, cum emite deja `<lead-form>`. Căile `network`/`server` → WhatsApp nu sunt contacte confirmate.
6. **`TagCall` stă în `core/analytics`.** Este tipul generic pe care `track.ts` îl execută. `model/` îl importă doar ca tip.
7. **Butonul din footer rămâne inert fără JS.** Fără JS nu există nici taguri, deci nu e nimic de setat.
8. **Fără E2E Playwright în etapa asta.** Spec §9 („Refuz nu încarcă taguri”) e acoperit acum de testele elementului și de verificarea `dist/`. Playwright vine în etapa 7.
