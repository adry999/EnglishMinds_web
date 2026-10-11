const formatter = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Bucharest',
});

export function formatPostDate(date: Date): string {
  return formatter.format(date);
}
