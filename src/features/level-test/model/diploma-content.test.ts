import { describe, expect, it } from 'vitest';
import { cleanChildName, diplomaFileName, diplomaTexts, fitNameFont, formatDiplomaDate, starPoints } from './diploma-content';

const measureByLength = (font: string, text: string) => text.length * Number(/(\d+)px/.exec(font)?.[1] ?? 0) * 0.6;

describe('diploma content', () => {
  it('builds a safe file name from the child name', () => {
    expect(diplomaFileName('Maria Popescu')).toBe('diploma-Maria-Popescu.png');
    expect(diplomaFileName('  Ștefan   Țurcanu ')).toBe('diploma-Ștefan-Țurcanu.png');
    expect(diplomaFileName('<script>alert(1)</script>')).toBe('diploma-scriptalert1script.png');
    expect(diplomaFileName('../../etc')).toBe('diploma-etc.png');
    expect(diplomaFileName('   ')).toBe('diploma.png');
  });

  it('keeps decomposed diacritics by normalizing to NFC first', () => {
    expect(diplomaFileName('Stéfan')).toBe('diploma-Stéfan.png');
  });

  it('caps the file name slug at 60 characters', () => {
    expect(diplomaFileName('a'.repeat(100))).toBe(`diploma-${'a'.repeat(60)}.png`);
  });

  it('normalizes child names the same way everywhere', () => {
    expect(cleanChildName('  Ana   Pop ')).toBe('Ana Pop');
    expect(cleanChildName('Stéfan')).toBe('Stéfan');
  });

  it('formats the date the Romanian way, in Bucharest time', () => {
    expect(formatDiplomaDate(new Date('2026-10-10T22:30:00Z'))).toBe('11.10.2026');
  });

  it('shrinks names in 4px steps from 104 down to a 50px floor', () => {
    expect(fitNameFont('Ana', measureByLength)).toBe(104);

    // 30 chars * 0.6 * size: 68px gives 1224 (fits), 72px gives 1296 (too wide).
    const mid = 'x'.repeat(30);
    expect(fitNameFont(mid, measureByLength)).toBe(68);
    expect(measureByLength(`900 68px Nunito`, mid)).toBeLessThanOrEqual(1250);
    expect(measureByLength(`900 72px Nunito`, mid)).toBeGreaterThan(1250);

    // Real long name: no 4px-grid size above 50 fits (52 gives 1276.8), so it hits the floor.
    const long = 'Maria-Alexandra Popescu-Ionescu Vasilescu';
    expect(fitNameFont(long, measureByLength)).toBe(50);

    expect(fitNameFont('x'.repeat(200), measureByLength)).toBe(50);
  });

  it('accepts a measure of exactly 1250 at the top size', () => {
    expect(fitNameFont('Ana', () => 1250)).toBe(104);
  });

  it('draws a 12-point star', () => {
    const points = starPoints(800, 230, 70);
    expect(points).toHaveLength(24);
    expect(points[0]).toEqual({ x: 800, y: 160 });
    // Index 1 is the inner point: radius 70 * 0.58 at -75 degrees.
    expect(points[1]).toEqual({ x: 810.51, y: 190.78 });
  });

  it('lays out the diploma texts from the design', () => {
    const texts = diplomaTexts(
      { childName: '  Ana  Pop ', mode: 'level', title: 'Movers', score: 7, total: 12, date: new Date('2026-10-11T09:00:00Z') },
      measureByLength,
    );
    expect(texts.map((item) => item.text)).toEqual([
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
    expect(texts[0]).toMatchObject({ y: 370, font: '800 40px Nunito, sans-serif', color: '#c4501a' });
    expect(texts[2]).toMatchObject({ font: `900 ${fitNameFont('Ana Pop', measureByLength)}px Nunito, sans-serif`, y: 520 });
    expect(texts[10]).toMatchObject({ x: 1245, y: 995 });
  });
});
