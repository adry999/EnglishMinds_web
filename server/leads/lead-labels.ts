import type { LeadRecord } from './ports';

export const SOURCE_LABELS: Readonly<Record<LeadRecord['source'], string>> = {
  home: 'pagina principală',
  landing: 'pagina lecției demo',
  test: 'testul de nivel',
};

const WITH_YEAR = new Intl.DateTimeFormat('ro-RO', {
  timeZone: 'Europe/Bucharest',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const WITHOUT_YEAR = new Intl.DateTimeFormat('ro-RO', {
  timeZone: 'Europe/Bucharest',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatReceivedAt(date: Date, options: { withYear: boolean }): string {
  return (options.withYear ? WITH_YEAR : WITHOUT_YEAR).format(date);
}
