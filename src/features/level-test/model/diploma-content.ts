import { site } from '@shared/content/site';
import type { Mode } from './select-bank';

export const DIPLOMA_SIZE = { width: 1600, height: 1130 } as const;

export type DiplomaData = {
  readonly childName: string;
  readonly mode: Mode;
  readonly title: string;
  readonly score: number;
  readonly total: number;
  readonly date: Date;
};

export type DiplomaText = {
  readonly text: string;
  readonly font: string;
  readonly color: string;
  readonly x: number;
  readonly y: number;
};

export type Measure = (font: string, text: string) => number;

const NAVY = '#14224a';
const ACCENT = '#c4501a';
const FONT = 'Nunito, sans-serif';
const CENTER = DIPLOMA_SIZE.width / 2;

const SLUG_MAX = 60;

export function cleanChildName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function diplomaLine(mode: Mode): string {
  return mode === 'level' ? 'a finalizat testul de nivel' : 'a finalizat testul de pregătire Cambridge';
}

export function diplomaFileName(name: string): string {
  const slug = Array.from(cleanChildName(name).replace(/[^\p{L}\p{N} ]/gu, ''))
    .slice(0, SLUG_MAX)
    .join('')
    .trim()
    .replace(/ +/g, '-')
    .replace(/-+$/, '');
  return slug ? `diploma-${slug}.png` : 'diploma.png';
}

const dateFormatter = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Bucharest',
});

export function formatDiplomaDate(date: Date): string {
  return dateFormatter.format(date);
}

export function fitNameFont(name: string, measure: Measure): number {
  let size = 104;
  while (size > 50 && measure(`900 ${size}px ${FONT}`, name) > 1250) size -= 4;
  return Math.max(size, 50);
}

export function starPoints(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < 24; index++) {
    const r = index % 2 === 0 ? radius : radius * 0.58;
    const angle = (Math.PI / 12) * index - Math.PI / 2;
    points.push({ x: Math.round((cx + r * Math.cos(angle)) * 100) / 100, y: Math.round((cy + r * Math.sin(angle)) * 100) / 100 });
  }
  return points;
}

export function diplomaTexts(data: DiplomaData, measure: Measure): DiplomaText[] {
  const name = cleanChildName(data.childName);
  const text = (value: string, font: string, color: string, y: number, x = CENTER): DiplomaText => ({
    text: value,
    font: `${font} ${FONT}`,
    color,
    x,
    y,
  });
  return [
    text('DIPLOMĂ', '800 40px', ACCENT, 370),
    text('Se acordă lui / ei', '700 32px', NAVY, 420),
    text(name, `900 ${fitNameFont(name, measure)}px`, NAVY, 520),
    text(diplomaLine(data.mode), '700 40px', NAVY, 590),
    text(data.title, '900 84px', ACCENT, 700),
    text(`${data.score} din ${data.total} răspunsuri corecte`, '800 34px', NAVY, 770),
    text('Pregătire după metoda Cambridge', '800 24px', ACCENT, 820),
    text('English Minds Academy', '900 44px', NAVY, 900),
    text(`${site.contact.city} · ${formatDiplomaDate(data.date)}`, '700 28px', NAVY, 950),
    text('Semnătura profesorului', '700 24px', NAVY, 995, 355),
    text('Director', '700 24px', NAVY, 995, 1245),
  ];
}
