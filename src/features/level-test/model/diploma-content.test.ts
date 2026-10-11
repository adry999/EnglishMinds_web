import { describe, expect, it } from 'vitest';
import { diplomaFileName, diplomaTexts, fitNameFont, formatDiplomaDate, starPoints } from './diploma-content';

const measureByLength = (font: string, text: string) => text.length * Number(/(\d+)px/.exec(font)?.[1] ?? 0) * 0.6;

describe('diploma content', () => {
  it('builds a safe file name from the child name', () => {
    expect(diplomaFileName('Maria Popescu')).toBe('diploma-Maria-Popescu.png');
    expect(diplomaFileName('  Ștefan   Țurcanu ')).toBe('diploma-Ștefan-Țurcanu.png');
    expect(diplomaFileName('<script>alert(1)</script>')).toBe('diploma-scriptalert1script.png');
    expect(diplomaFileName('../../etc')).toBe('diploma-etc.png');
    expect(diplomaFileName('   ')).toBe('diploma.png');
  });

  it('formats the date the Romanian way, in Bucharest time', () => {
    expect(formatDiplomaDate(new Date('2026-10-10T22:30:00Z'))).toBe('11.10.2026');
  });

  it('shrinks long names in steps of 4px down to 50px', () => {
    expect(fitNameFont('Ana', measureByLength)).toBe(104);
    const long = 'Maria-Alexandra Popescu-Ionescu Vasilescu';
    const size = fitNameFont(long, measureByLength);
    expect(size).toBeGreaterThanOrEqual(50);
    expect(size).toBeLessThan(104);
    expect(measureByLength(`900 ${size}px Nunito`, long)).toBeLessThanOrEqual(1250);
    expect(fitNameFont('x'.repeat(200), measureByLength)).toBe(50);
  });

  it('draws a 12-point star', () => {
    const points = starPoints(800, 230, 70);
    expect(points).toHaveLength(24);
    expect(points[0]).toEqual({ x: 800, y: 160 });
  });

  it('lays out the diploma texts from the design', () => {
    const texts = diplomaTexts(
      { childName: '  Ana  Pop ', mode: 'level', title: 'Movers', score: 7, total: 12, date: new Date('2026-10-11T09:00:00Z') },
      measureByLength,
    ).map((item) => item.text);
    expect(texts).toEqual([
      'DIPLOMĂ',
      'Se acordă lui / ei',
      'Ana Pop',
      'a finalizat testul de nivel',
      'Movers',
      '7 din 12 răspunsuri corecte',
      'Pregătire după metoda Cambridge',
      'English Minds Academy',
      'Cluj-Napoca · 11.10.2026',
      'Semnătura profesorului',
      'Director',
    ]);
  });
});
