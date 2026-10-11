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
