import { POLICY_VERSION } from '@shared/contracts/policy';

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/health') {
    return json(200, { ok: true, policyVersion: POLICY_VERSION });
  }
  return json(404, { ok: false, error: 'not_found' });
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
