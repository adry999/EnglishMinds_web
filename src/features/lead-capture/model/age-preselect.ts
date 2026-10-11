import type { AgeGroup } from '@shared/contracts/age-groups';
import { site } from '@shared/content/site';

export function ageGroupForLevel(slug: string): AgeGroup | null {
  return site.levels.find((level) => level.slug === slug)?.ageGroup ?? null;
}
