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
