import { beforeEach, describe, expect, it } from 'vitest';
import { FakeLeadRepository, FakeDispatcher, FakeRateLimiter, RecordingLogger, aLeadSubmission, fixedClock } from '@test-support/lead-fakes';
import { MAX_BODY_BYTES, createRequestHandler, type RequestHandler } from './handle-request';

const BASE = 'http://localhost';
const context = { clientIp: '203.0.113.7' };
const lead = aLeadSubmission();

let repository: FakeLeadRepository;
let rateLimiter: FakeRateLimiter;
let handle: RequestHandler;

beforeEach(() => {
  repository = new FakeLeadRepository();
  rateLimiter = new FakeRateLimiter();
  handle = createRequestHandler({
    repository,
    rateLimiter,
    dispatcher: new FakeDispatcher(),
    logger: new RecordingLogger(),
    clock: fixedClock('2026-10-11T09:30:00.000Z'),
    hashIp: (ip) => `hash(${ip})`,
    globalHourlyCap: 60,
  });
});

const post = (body: string, headers: Record<string, string> = { 'content-type': 'application/json' }): Request =>
  new Request(`${BASE}/api/lead`, { method: 'POST', headers, body });

describe('handle request', () => {
  it('serves /api/health with safe JSON headers', async () => {
    const response = await handle(new Request(`${BASE}/api/health`), context);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.json()).toEqual({ ok: true, policyVersion: '2' });
  });

  it('answers unknown routes with a JSON 404', async () => {
    const response = await handle(new Request(`${BASE}/api/nope`), context);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: 'not_found' });
  });

  it('saves a lead and answers 201', async () => {
    const response = await handle(post(JSON.stringify(lead)), context);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(repository.saved).toHaveLength(1);
    expect(rateLimiter.keys).toEqual(['hash(203.0.113.7)', 'global']);
  });

  it('accepts a charset in the content type', async () => {
    const response = await handle(post(JSON.stringify(lead), { 'content-type': 'application/json; charset=utf-8' }), context);
    expect(response.status).toBe(201);
  });

  it('answers 400 with field names for invalid data', async () => {
    const response = await handle(post(JSON.stringify({ ...lead, phone: '1' })), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'validation', fields: ['phone'] });
  });

  it.each([
    ['invalid JSON', post('{nope')],
    ['a form-encoded body', post('parentName=Ana', { 'content-type': 'application/x-www-form-urlencoded' })],
    ['a missing content type', new Request(`${BASE}/api/lead`, { method: 'POST', body: JSON.stringify(lead) })],
    ['a lookalike content type', post('{}', { 'content-type': 'application/jsonfoo' })],
    ['an oversized body', post(JSON.stringify({ ...lead, parentName: 'x'.repeat(MAX_BODY_BYTES) }))],
  ])('answers 400 without fields for %s', async (_label, request) => {
    const response = await handle(request, context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'validation', fields: [] });
    expect(repository.saved).toEqual([]);
  });

  it('stops reading a streamed body that exceeds the cap', async () => {
    let pulled = 0;
    let cancelled = false;
    const chunk = new TextEncoder().encode('x'.repeat(4000));
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 50) controller.close();
        else controller.enqueue(chunk);
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new Request(`${BASE}/api/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    const response = await handle(request, context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'validation', fields: [] });
    expect(cancelled).toBe(true);
    expect(pulled).toBeLessThan(50);
    expect(repository.saved).toEqual([]);
  });

  it('answers 429 when rate limited', async () => {
    rateLimiter.allow = false;
    const response = await handle(post(JSON.stringify(lead)), context);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, error: 'rate_limited' });
  });

  it('answers a generic 500 when the database fails', async () => {
    repository.failWith = new Error('ER_LOCK_DEADLOCK at db.internal:3306');
    const response = await handle(post(JSON.stringify(lead)), context);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe(JSON.stringify({ ok: false, error: 'internal' }));
  });

  it('answers 405 with Allow for other methods on /api/lead', async () => {
    const response = await handle(new Request(`${BASE}/api/lead`), context);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(await response.json()).toEqual({ ok: false, error: 'method_not_allowed' });
  });
});
