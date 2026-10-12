import { describe, expect, it, vi } from 'vitest';
import type { LeadRecord } from './ports';
import { createTelegramNotifier, formatLeadTelegram, type FetchLike } from './telegram-notification';

const record: LeadRecord = {
  parentName: 'Ştefănescu Ana',
  phone: '+40722123456',
  childAgeGroup: '7–8 ani',
  source: 'landing',
  testLevel: null,
  consent: true,
  policyVersion: '2',
  utm: { source: 'instagram', medium: 'paid', campaign: 'demo-toamna' },
  consentAt: new Date('2026-10-11T09:30:00.000Z'),
  createdAt: new Date('2026-10-11T09:30:00.000Z'),
};

const config = { botToken: '123456:SECRET-token', chatId: '-1001234567' };

describe('formatLeadTelegram', () => {
  it('contains only name, phone, age group, page and time', () => {
    const text = formatLeadTelegram(record);
    expect(text).toContain('Părinte: Ştefănescu Ana');
    expect(text).toContain('Telefon: +40722123456');
    expect(text).toContain('Vârsta copilului: 7–8 ani');
    expect(text).toContain('Pagina: pagina lecției demo');
    expect(text).toContain('Primită: 11.10, 12:30');
    expect(text).not.toMatch(/instagram|utm|policy/i);
  });

  it('uses a dash for a missing age group', () => {
    expect(formatLeadTelegram({ ...record, childAgeGroup: null })).toContain('Vârsta copilului: —');
  });
});

describe('createTelegramNotifier', () => {
  it('posts the message to the Bot API with a timeout signal', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue({ ok: true, status: 200 });
    await createTelegramNotifier(config, fetchImpl).notify(record);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe('https://api.telegram.org/bot123456:SECRET-token/sendMessage');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body ?? '{}')).toMatchObject({ chat_id: '-1001234567', text: expect.stringContaining('Telefon: +40722123456') });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('disables the link preview and releases the response body', async () => {
    const cancel = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue({ ok: true, status: 200, body: { cancel } });
    await createTelegramNotifier(config, fetchImpl).notify(record);
    expect(JSON.parse(fetchImpl.mock.calls[0]?.[1].body ?? '{}')).toMatchObject({ link_preview_options: { is_disabled: true } });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('fails with a generic error on a non-2xx answer', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 401 });
    await expect(createTelegramNotifier(config, fetchImpl).notify(record)).rejects.toMatchObject({ code: 'TELEGRAM_HTTP_401' });
  });

  it('never lets the token reach the error, whatever the network error says', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new TypeError('fetch failed for https://api.telegram.org/bot123456:SECRET-token/sendMessage');
    };
    const error = await createTelegramNotifier(config, fetchImpl)
      .notify(record)
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'TELEGRAM_NETWORK' });
    expect(String((error as Error).message)).not.toContain('SECRET');
  });

  it('reports a timeout distinctly', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    };
    await expect(createTelegramNotifier(config, fetchImpl).notify(record)).rejects.toMatchObject({ code: 'TELEGRAM_TIMEOUT' });
  });
});
