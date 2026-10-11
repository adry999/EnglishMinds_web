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
