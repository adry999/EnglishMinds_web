import { POLICY_VERSION } from '@shared/contracts/policy';
import { submitLead, type SubmitLeadDeps } from './leads/submit-lead';

export type RequestContext = { readonly clientIp: string | null };
export type RequestHandler = (request: Request, context: RequestContext) => Promise<Response>;

export const MAX_BODY_BYTES = 10_000;

const INVALID_BODY = Symbol('invalid-body');

export function createRequestHandler(deps: SubmitLeadDeps): RequestHandler {
  return async (request, context) => {
    const { pathname } = new URL(request.url);
    if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/health') {
      return json(200, { ok: true, policyVersion: POLICY_VERSION });
    }
    if (pathname === '/api/lead') {
      if (request.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, { allow: 'POST' });
      return handleLead(request, context, deps);
    }
    return json(404, { ok: false, error: 'not_found' });
  };
}

async function handleLead(request: Request, context: RequestContext, deps: SubmitLeadDeps): Promise<Response> {
  const body = await readJsonBody(request);
  if (body === INVALID_BODY) return json(400, { ok: false, error: 'validation', fields: [] });
  const outcome = await submitLead(body, context.clientIp, deps);
  switch (outcome.status) {
    case 201:
      return json(201, { ok: true });
    case 400:
      return json(400, { ok: false, error: 'validation', fields: outcome.fields });
    case 429:
      return json(429, { ok: false, error: 'rate_limited' });
    case 500:
      return json(500, { ok: false, error: 'internal' });
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!type.startsWith('application/json')) return INVALID_BODY;
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return INVALID_BODY;
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return INVALID_BODY;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return INVALID_BODY;
  }
}

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}
