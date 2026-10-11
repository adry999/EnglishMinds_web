import { describe, expect, it, vi } from 'vitest';
import type { LeadRequest } from '@shared/contracts/lead.schema';
import { LEAD_ENDPOINT, submitLead } from './lead.client';

const request: LeadRequest = {
  parentName: 'Ana Pop',
  phone: '0722 123 456',
  childAgeGroup: null,
  source: 'home',
  testLevel: null,
  consent: true,
  policyVersion: '1',
  utm: { source: null, medium: null, campaign: null },
  website: '',
  elapsedMs: 5000,
};

const reply = (status: number, body: unknown): Response =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('submitLead', () => {
  it('POSTs JSON to the endpoint', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(201, { ok: true }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'ok' });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(LEAD_ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual(request);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('maps 400 to validation with only string field names', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(400, { ok: false, error: 'validation', fields: ['phone', 3, 'consent'] }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'validation', fields: ['phone', 'consent'] });
  });

  it('maps a 400 without a JSON body to validation with no fields', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(400, '<html>'));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'validation', fields: [] });
  });

  it('maps 429 to rate_limited', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(429, { ok: false, error: 'rate_limited' }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'rate_limited' });
  });

  it.each([500, 502, 503, 404])('maps %i to server', async (status) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(reply(status, { ok: false }));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'server' });
  });

  it('maps a thrown fetch (offline, timeout) to network', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(submitLead(request, fetchImpl)).resolves.toEqual({ kind: 'network' });
  });

  it('aborts after the timeout', async () => {
    const fetchImpl = vi.fn<typeof fetch>((_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'TimeoutError')));
      }),
    );
    await expect(submitLead(request, fetchImpl, 20)).resolves.toEqual({ kind: 'network' });
  });
});
