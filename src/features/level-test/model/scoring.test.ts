import { describe, expect, it } from 'vitest';
import { MID, TEEN, YOUNG } from '../data/questions';
import { describeResult } from './describe-result';
import { examReadiness, recommendLevel } from './recommend-level';
import { resultWhatsappUrl } from './result-message';
import { scoreTest } from './score-test';
import { choiceLabels, selectBank } from './select-bank';

const correct = (bank: typeof YOUNG) => bank.map((question) => question.answer);

describe('selectBank', () => {
  it('picks the bank by age and by exam', () => {
    expect(selectBank('level', 0)).toBe(YOUNG);
    expect(selectBank('level', 3)).toBe(MID);
    expect(selectBank('level', 4)).toBe(TEEN);
    expect(selectBank('exam', 2)).toBe(MID);
    expect(selectBank('exam', 3)).toBe(TEEN);
  });

  it('rejects a choice outside the list', () => {
    expect(() => selectBank('exam', 4)).toThrow(RangeError);
    expect(() => selectBank('level', -1)).toThrow(RangeError);
  });

  it('labels the choices', () => {
    expect(choiceLabels('level')).toEqual(['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani']);
    expect(choiceLabels('exam')).toEqual(['Starters', 'Movers', 'Flyers', 'A2 Key']);
  });
});

describe('scoreTest', () => {
  it('counts correct answers overall and per skill', () => {
    const result = scoreTest(YOUNG, correct(YOUNG));
    expect(result.score).toBe(12);
    expect(result.total).toBe(12);
    expect(result.bySkill).toEqual({
      vocabular: { correct: 5, total: 5 },
      gramatica: { correct: 2, total: 2 },
      citit: { correct: 2, total: 2 },
      ascultare: { correct: 3, total: 3 },
    });
  });

  it('treats missing or wrong answers as incorrect', () => {
    const answers = correct(MID).map((answer, index) => (index < 3 ? (answer + 1) % 3 : answer)).slice(0, 10);
    expect(scoreTest(MID, answers).score).toBe(7);
  });
});

describe('recommendLevel (12 questions)', () => {
  it.each([
    [0, 10, 'starters'],
    [0, 11, 'pre-a1'],
    [1, 5, 'starters'],
    [1, 6, 'pre-a1'],
    [1, 10, 'pre-a1'],
    [1, 11, 'movers'],
    [2, 4, 'pre-a1'],
    [2, 5, 'movers'],
    [2, 8, 'movers'],
    [2, 9, 'flyers'],
    [3, 10, 'flyers'],
    [3, 11, 'a2-key'],
    [4, 4, 'flyers'],
    [4, 5, 'a2-key'],
    [4, 9, 'a2-key'],
    [4, 10, 'b1-preliminary'],
    [0, 0, 'starters'],
    [4, 12, 'b1-preliminary'],
  ])('age %i with %i correct → %s', (age, score, level) => {
    expect(recommendLevel(age, score, 12)).toBe(level);
  });

  it('rejects an unknown age index', () => {
    expect(() => recommendLevel(5, 6, 12)).toThrow(RangeError);
  });
});

describe('examReadiness (12 questions)', () => {
  it.each([
    [5, 'not-yet'],
    [6, 'almost'],
    [9, 'almost'],
    [10, 'ready'],
  ])('%i correct → %s', (score, readiness) => {
    expect(examReadiness(score, 12)).toBe(readiness);
  });
});

describe('describeResult', () => {
  it('describes a recommended level with the site summary', () => {
    expect(describeResult('level', 2, 7, 12)).toEqual({
      kicker: 'Nivelul recomandat',
      title: 'Movers',
      description: 'Propoziții complete, povestit la trecut și conversații scurte.',
      level: 'movers',
    });
  });

  it('describes B1 Preliminary', () => {
    expect(describeResult('level', 4, 11, 12)).toMatchObject({
      title: 'B1 Preliminary',
      description: 'Nivel peste A2 Key. Stabilim împreună la lecția demo programul potrivit.',
      level: 'b1-preliminary',
    });
  });

  it('describes exam readiness', () => {
    expect(describeResult('exam', 1, 10, 12)).toEqual({
      kicker: 'Test pentru examenul Cambridge Movers',
      title: 'Pregătit pentru examen',
      description: 'Rezultat foarte bun. Un curs de pregătire Movers îl ajută să se simtă sigur în ziua examenului.',
      level: 'movers',
    });
    expect(describeResult('exam', 3, 6, 12).title).toBe('Aproape pregătit');
    expect(describeResult('exam', 0, 2, 12).description).toBe(
      'Recomandăm întâi grupa potrivită nivelului actual, apoi pregătirea pentru Starters.',
    );
  });
});

describe('resultWhatsappUrl', () => {
  const summary = describeResult('level', 2, 7, 12);

  it('builds the design message with the child name', () => {
    const url = resultWhatsappUrl(summary, 7, 12, '  Maria Popescu ');
    expect(url.startsWith('https://wa.me/40775630680?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1] ?? '')).toBe(
      'Bună ziua! Maria Popescu a făcut testul pe site: nivelul recomandat – Movers (7/12). Aș dori o lecție demo gratuită.',
    );
  });

  it('falls back to "Copilul meu" without a name', () => {
    expect(decodeURIComponent(resultWhatsappUrl(summary, 7, 12, '   ').split('?text=')[1] ?? '')).toContain(
      'Bună ziua! Copilul meu a făcut testul',
    );
  });
});
