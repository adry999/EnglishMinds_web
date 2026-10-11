export function sortNewestFirst<T extends { data: { publishedAt: Date } }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
