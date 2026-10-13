import { SKILLS, type Bank, type Skill } from './types';

type SkillScore = { readonly correct: number; readonly total: number };

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
