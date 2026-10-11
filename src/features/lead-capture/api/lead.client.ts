import type { LeadRequest } from '@shared/contracts/lead.schema';

export const LEAD_ENDPOINT = '/api/lead';

export type SubmitLeadResult =
  | { readonly kind: 'ok' }
  | { readonly kind: 'validation'; readonly fields: string[] }
  | { readonly kind: 'rate_limited' }
  | { readonly kind: 'network' }
  | { readonly kind: 'server' };

async function fieldsFrom(response: Response): Promise<string[]> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return [];
  }
  const fields = typeof body === 'object' && body !== null ? (body as { fields?: unknown }).fields : undefined;
  return Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : [];
}

export async function submitLead(
  request: LeadRequest,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 10_000,
): Promise<SubmitLeadResult> {
  let response: Response;
  try {
    response = await fetchImpl(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { kind: 'network' };
  }
  if (response.status === 201) return { kind: 'ok' };
  if (response.status === 429) return { kind: 'rate_limited' };
  if (response.status === 400) return { kind: 'validation', fields: await fieldsFrom(response) };
  return { kind: 'server' };
}
