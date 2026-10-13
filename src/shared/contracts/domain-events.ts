import type { AgeGroup } from './age-groups';
import type { LeadSource } from './lead.schema';

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

export const LEAD_SUBMITTED = 'lead.submitted';

export type LeadSubmittedDetail = {
  readonly source: LeadSource;
  readonly ageGroup: AgeGroup | null;
};

export function createLeadSubmitted(detail: LeadSubmittedDetail): CustomEvent<LeadSubmittedDetail> {
  return new CustomEvent(LEAD_SUBMITTED, { detail, bubbles: true, composed: true });
}

export const CONSENT_CHANGED = 'consent.changed';

export type ConsentChangedDetail = {
  readonly analytics: boolean;
  readonly marketing: boolean;
};

export const CONSENT_DATASET_KEY = 'consent';

export function createConsentChanged(detail: ConsentChangedDetail): CustomEvent<ConsentChangedDetail> {
  return new CustomEvent(CONSENT_CHANGED, { detail, bubbles: true, composed: true });
}

export const LEAD_FORM_REQUESTED = 'lead-form.requested';

export function createLeadFormRequested(): CustomEvent<null> {
  return new CustomEvent(LEAD_FORM_REQUESTED, { detail: null, bubbles: true, composed: true });
}
