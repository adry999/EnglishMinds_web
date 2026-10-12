import type { Environment } from '../config/environment';
import type { LeadNotifier, LeadRecord } from './ports';

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{ ok: boolean; status: number }>;

export const TELEGRAM_TIMEOUT_MS = 5_000;

const SOURCE_LABELS: Readonly<Record<LeadRecord['source'], string>> = {
  home: 'pagina principală',
  landing: 'pagina lecției demo',
  test: 'testul de nivel',
};

const RECEIVED_AT = new Intl.DateTimeFormat('ro-RO', {
  timeZone: 'Europe/Bucharest',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** Only name, phone, age group, source page and time: the minimum the academy needs to call back. */
export function formatLeadTelegram(record: LeadRecord): string {
  return [
    'Cerere nouă de lecție demo',
    `Părinte: ${record.parentName}`,
    `Telefon: ${record.phone}`,
    `Vârsta copilului: ${record.childAgeGroup ?? '—'}`,
    `Pagina: ${SOURCE_LABELS[record.source]}`,
    `Primită: ${RECEIVED_AT.format(record.createdAt)}`,
  ].join('\n');
}

function failure(code: string): Error {
  // Deliberately generic: the request URL contains the bot token, which must never reach a log.
  return Object.assign(new Error('Telegram request failed'), { code });
}

export function createTelegramNotifier(config: NonNullable<Environment['telegram']>, fetchImpl: FetchLike = fetch): LeadNotifier {
  return {
    async notify(record) {
      let response: { ok: boolean; status: number };
      try {
        response = await fetchImpl(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: config.chatId, text: formatLeadTelegram(record), disable_web_page_preview: true }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        });
      } catch (error) {
        throw failure(error instanceof Error && error.name === 'TimeoutError' ? 'TELEGRAM_TIMEOUT' : 'TELEGRAM_NETWORK');
      }
      if (!response.ok) throw failure(`TELEGRAM_HTTP_${response.status}`);
    },
  };
}
