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
