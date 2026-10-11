export const BLOG_CATEGORIES = [
  { id: 'acasa', label: 'Acasă' },
  { id: 'metoda-cambridge', label: 'Metoda Cambridge' },
  { id: 'motivatie', label: 'Motivație' },
  { id: 'scoala', label: 'Școală' },
] as const;

export type BlogCategoryId = (typeof BLOG_CATEGORIES)[number]['id'];

export const BLOG_CATEGORY_IDS = BLOG_CATEGORIES.map((category) => category.id) as [
  BlogCategoryId,
  ...BlogCategoryId[],
];

export function categoryLabel(id: BlogCategoryId): string {
  return BLOG_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
