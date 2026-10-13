import type { Environment } from '../config/environment';
import { SOURCE_LABELS, formatReceivedAt } from './lead-labels';
import type { LeadNotifier, LeadRecord } from './ports';

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{ ok: boolean; status: number; body?: { cancel(): Promise<void> } | null }>;

export const TELEGRAM_TIMEOUT_MS = 5_000;

export function formatLeadTelegram(record: LeadRecord): string {
  return [
    'Cerere nouă de lecție demo',
    `Părinte: ${record.parentName}`,
    `Telefon: ${record.phone}`,
    `Vârsta copilului: ${record.childAgeGroup ?? '—'}`,
    `Pagina: ${SOURCE_LABELS[record.source]}`,
    `Primită: ${formatReceivedAt(record.createdAt, { withYear: false })}`,
  ].join('\n');
}

function errorWithoutRequestUrl(code: string): Error {
  return Object.assign(new Error('Telegram request failed'), { code });
}

export function createTelegramNotifier(config: NonNullable<Environment['telegram']>, fetchImpl: FetchLike = fetch): LeadNotifier {
  return {
    async notify(record) {
      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await fetchImpl(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: config.chatId, text: formatLeadTelegram(record), link_preview_options: { is_disabled: true } }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        });
      } catch (error) {
        throw errorWithoutRequestUrl(error instanceof Error && error.name === 'TimeoutError' ? 'TELEGRAM_TIMEOUT' : 'TELEGRAM_NETWORK');
      }
      await response.body?.cancel().catch(() => undefined);
      if (!response.ok) throw errorWithoutRequestUrl(`TELEGRAM_HTTP_${response.status}`);
    },
  };
}
