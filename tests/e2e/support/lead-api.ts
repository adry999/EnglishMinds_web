import type { BrowserContext, Page } from '@playwright/test';

type Reply = { status: number; body?: unknown } | 'network-error';

/** Answers POST /api/lead without a server and keeps every request body for assertions. */
export async function mockLeadApi(page: Page, reply: Reply): Promise<{ requests: unknown[] }> {
  const requests: unknown[] = [];
  await page.route('**/api/lead', async (route) => {
    requests.push(route.request().postDataJSON());
    if (reply === 'network-error') return route.abort('internetdisconnected');
    return route.fulfill({
      status: reply.status,
      contentType: 'application/json',
      body: JSON.stringify(reply.body ?? (reply.status === 201 ? { ok: true } : { ok: false, error: 'internal' })),
    });
  });
  return { requests };
}

/** The WhatsApp tab must open with the right URL but never load wa.me. */
export async function blockWhatsApp(context: BrowserContext): Promise<{ hits: string[] }> {
  const hits: string[] = [];
  await context.route(/wa\.me|api\.whatsapp\.com|web\.whatsapp\.com/, (route) => {
    hits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>WhatsApp (test)</title>' });
  });
  return { hits };
}
