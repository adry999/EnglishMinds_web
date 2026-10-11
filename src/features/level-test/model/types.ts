export const SKILLS = ['vocabular', 'gramatica', 'citit', 'ascultare'] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Readonly<Record<Skill, string>> = {
  vocabular: 'Vocabular',
  gramatica: 'Gramatică',
  citit: 'Citit',
  ascultare: 'Ascultare',
};

type QuestionBase = {
  readonly skill: Skill;
  readonly instruction: string;
  readonly prompt: string;
  readonly options: readonly [string, string, string];
  readonly answer: 0 | 1 | 2;
};

export type Question =
  | (QuestionBase & { readonly kind: 'text'; readonly passage?: string })
  | (QuestionBase & { readonly kind: 'color'; readonly color: string })
  | (QuestionBase & { readonly kind: 'count'; readonly count: number })
  | (QuestionBase & { readonly kind: 'audio'; readonly say: string });

export type Bank = readonly Question[];
