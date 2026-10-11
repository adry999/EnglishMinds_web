import { TEST_LEVEL_PATTERN } from '@shared/contracts/lead.schema';
import { site } from '@shared/content/site';

export type TestOutcome = {
  readonly mode: 'level' | 'exam';
  readonly level: string;
};

const EXTRA_NAMES: Readonly<Record<string, string>> = { 'b1-preliminary': 'B1 Preliminary' };

function levelName(slug: string): string {
  return site.levels.find((level) => level.slug === slug)?.name ?? EXTRA_NAMES[slug] ?? slug;
}

export function testLevelCode(outcome: TestOutcome): string | null {
  const code = `${outcome.mode}:${outcome.level}`;
  return TEST_LEVEL_PATTERN.test(code) ? code : null;
}

export function testResultLabel(outcome: TestOutcome): string {
  const name = levelName(outcome.level);
  return outcome.mode === 'exam' ? `test pentru examenul Cambridge ${name}` : `grupa recomandată ${name}`;
}
