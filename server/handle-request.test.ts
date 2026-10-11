import { describe, expect, it } from 'vitest';
import { POLICY_VERSION } from '@shared/contracts/policy';
import { handleRequest } from './handle-request';

const BASE = 'http://localhost';

describe('handleRequest', () => {
  it('answers GET /api/health with the policy version', async () => {
    const response = await handleRequest(new Request(`${BASE}/api/health`));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await response.json()).toEqual({ ok: true, policyVersion: POLICY_VERSION });
  });

  it('answers unknown paths with a JSON 404', async () => {
    const response = await handleRequest(new Request(`${BASE}/api/nope`));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: 'not_found' });
  });

  it('does not treat POST /api/health as a health check', async () => {
    const response = await handleRequest(
      new Request(`${BASE}/api/health`, { method: 'POST', body: '{}' }),
    );
    expect(response.status).toBe(404);
  });

  it('ignores the query string when routing', async () => {
    const response = await handleRequest(new Request(`${BASE}/api/health?x=1`));
    expect(response.status).toBe(200);
  });
});
