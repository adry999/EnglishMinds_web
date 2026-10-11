import * as v from 'valibot';
import { AGE_GROUPS } from './age-groups';
import { normalizeRoPhone } from './phone';
import { POLICY_VERSION } from './policy';

export const LEAD_SOURCES = ['home', 'landing', 'test'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Minimum fill time the server expects; the client waits slightly longer. */
export const MIN_ELAPSED_MS = 3000;

export const TEST_LEVEL_PATTERN = /^(level|exam):[a-z0-9-]{1,24}$/;

const NO_INVISIBLE_CHARS = /^[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}]*$/u;

const utmValue = v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(100), v.regex(NO_INVISIBLE_CHARS)));

export const LeadSchema = v.pipe(
  v.object({
    parentName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(100), v.regex(NO_INVISIBLE_CHARS), v.regex(/\p{L}/u)),
    phone: v.pipe(
      v.string(),
      v.maxLength(30),
      v.check((value) => normalizeRoPhone(value) !== null),
      // the check above guarantees a non-null result
      v.transform((value) => normalizeRoPhone(value) as string),
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
