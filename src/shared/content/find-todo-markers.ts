export function findTodoMarkers(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.includes('TODO') ? [path] : [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findTodoMarkers(item, `${path}[${index}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      findTodoMarkers(item, path ? `${path}.${key}` : key),
    );
  }
  return [];
}
