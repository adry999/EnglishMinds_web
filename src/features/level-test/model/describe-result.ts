import { site } from '@shared/content/site';
import { EXAMS } from '../data/questions';
import { examReadiness, recommendLevel } from './recommend-level';
import type { Mode } from './select-bank';

export type ResultSummary = {
  readonly kicker: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
};

const B1 = {
  name: 'B1 Preliminary',
  summary: 'Nivel peste A2 Key. Stabilim împreună la lecția demo programul potrivit.',
};

export function describeResult(mode: Mode, choice: number, score: number, total: number): ResultSummary {
  if (mode === 'level') {
    const slug = recommendLevel(choice, score, total);
    const level = slug === 'b1-preliminary' ? B1 : site.levels.find((candidate) => candidate.slug === slug);
    if (!level) throw new Error(`Nivel lipsă din site.levels: ${slug}`);
    return { kicker: 'Nivelul recomandat', title: level.name, description: level.summary, level: slug };
  }
  const exam = EXAMS[choice];
  if (!exam) throw new RangeError(`Examen necunoscut: ${choice}`);
  const readiness = examReadiness(score, total);
  const copy = {
    ready: {
      title: 'Pregătit pentru examen',
      description: `Rezultat foarte bun. Un curs de pregătire ${exam.name} îl ajută să se simtă sigur în ziua examenului.`,
    },
    almost: {
      title: 'Aproape pregătit',
      description: `Baza e solidă. Cu pregătire țintită pe competențele de mai jos, examenul ${exam.name} e la îndemână.`,
    },
    'not-yet': {
      title: 'Mai avem de lucru',
      description: `Recomandăm întâi grupa potrivită nivelului actual, apoi pregătirea pentru ${exam.name}.`,
    },
  }[readiness];
  return { kicker: `Test pentru examenul Cambridge ${exam.name}`, ...copy, level: exam.slug };
}
