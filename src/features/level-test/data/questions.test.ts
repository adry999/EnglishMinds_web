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

  it('keeps typographic apostrophes in every text field', () => {
    const texts = [...YOUNG, ...MID, ...TEEN].flatMap((q) => [
      q.prompt,
      q.instruction,
      ...q.options,
      'passage' in q ? (q.passage ?? '') : '',
      'say' in q ? q.say : '',
    ]);
    const joined = texts.join(' ');
    expect(joined).not.toContain("'");
    expect(joined).toContain('’');
    const letsMeet = TEEN.find((q) => q.kind === 'audio' && q.say.includes('Let’s meet outside the cinema'));
    expect(letsMeet).toBeDefined();
  });
});
