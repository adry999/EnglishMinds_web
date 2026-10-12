export function lastModified(data: { publishedAt: Date; updatedAt?: Date }): Date {
  return data.updatedAt ?? data.publishedAt;
}
