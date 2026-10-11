export const AGE_GROUPS = ['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani'] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];
