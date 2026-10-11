import { expect, test, type Page } from '@playwright/test';
import { blockWhatsApp, mockLeadApi } from './support/lead-api';

const WA = 'https://wa.me/40775630680?text=';
const PARENT = 'Ana Pop';

test.beforeEach(async ({ context }) => {
  await blockWhatsApp(context);
});

async function open(page: Page, path = '/') {
  await page.goto(path);
  const form = page.locator('lead-form form');
  await expect(form).toBeVisible();
  return {
    name: form.getByLabel('Numele părintelui'),
    phone: form.getByLabel('Telefon', { exact: true }),
    consent: form.getByLabel(/Sunt de acord/),
    submit: form.getByRole('button', { name: /Rezervă/ }),
  };
}

async function fillValid(f: Awaited<ReturnType<typeof open>>, page: Page) {
  await f.name.fill(PARENT);
  await f.phone.fill('0722 123 456');
  await page.getByRole('radio', { name: '9–10 ani' }).check({ force: true });
  await f.consent.check();
}

test('empty submit: Romanian errors, first invalid field focused, aria-invalid, no request', async ({ page }) => {
  const api = await mockLeadApi(page, { status: 201 });
  const f = await open(page);
  await f.submit.click();
  await expect(page.getByText('Scrie numele tău (cel puțin 2 litere).')).toBeVisible();
  await expect(page.getByText('Scrie un număr de telefon din România')).toBeVisible();
  await expect(page.getByText('Bifează acordul ca să te putem contacta.')).toBeVisible();
  await expect(f.name).toBeFocused();
  await expect(f.name).toHaveAttribute('aria-invalid', 'true');
  await expect(f.phone).toHaveAttribute('aria-invalid', 'true');
  await expect(f.consent).toHaveAttribute('aria-invalid', 'true');
  expect(api.requests).toEqual([]);
});

test('invalid phone: phone error only, no request', async ({ page }) => {
  const api = await mockLeadApi(page, { status: 201 });
  const f = await open(page);
  await f.name.fill(PARENT);
  await f.phone.fill('12345');
  await f.consent.check();
  await f.submit.click();
  await expect(page.getByText('Scrie un număr de telefon din România')).toBeVisible();
  await expect(f.phone).toHaveAttribute('aria-invalid', 'true');
  await expect(f.phone).toBeFocused();
  await expect(f.name).not.toHaveAttribute('aria-invalid', 'true');
  expect(api.requests).toEqual([]);
});

test('success (201): request payload, WhatsApp popup with the parent name, thank-you state', async ({ page }) => {
  const api = await mockLeadApi(page, { status: 201 });
  const f = await open(page);
  await fillValid(f, page);
  const popupPromise = page.waitForEvent('popup');
  await f.submit.click();
  const popup = await popupPromise;
  await popup.waitForURL(/^https:\/\/wa\.me\/40775630680\?text=/);
  const url = popup.url();
  expect(url.startsWith(WA)).toBe(true);
  expect(decodeURIComponent(url.slice(WA.length))).toContain(PARENT);
  await expect(page.getByText(`Mulțumim, ${PARENT}!`)).toBeVisible();
  await expect(page.getByText('Ți-am deschis WhatsApp cu mesajul completat.')).toBeVisible();
  expect(api.requests).toHaveLength(1);
  expect(api.requests[0]).toMatchObject({
    source: 'home',
    consent: true,
    policyVersion: '1',
    website: '',
    parentName: PARENT,
    childAgeGroup: '9–10 ani',
  });
  expect((api.requests[0] as { elapsedMs: number }).elapsedMs).toBeGreaterThanOrEqual(3000);
});

for (const [label, reply] of [
  ['server error (500)', { status: 500 }],
  ['network error', 'network-error'],
] as const) {
  test(`${label}: WhatsApp still opens and the page says the booking finishes there`, async ({ page }) => {
    const api = await mockLeadApi(page, reply);
    const f = await open(page);
    await fillValid(f, page);
    const popupPromise = page.waitForEvent('popup');
    await f.submit.click();
    const popup = await popupPromise;
    await popup.waitForURL(/^https:\/\/wa\.me\/40775630680\?text=/);
    await expect(page.getByText(/rezervarea se finalizează acolo/)).toBeVisible();
    expect(api.requests).toHaveLength(1);
  });
}

test('rate limited (429): alert with contact links, popup never reaches WhatsApp', async ({ page }) => {
  const api = await mockLeadApi(page, { status: 429, body: { ok: false, error: 'rate_limited' } });
  const f = await open(page);
  await fillValid(f, page);
  const closedUrls: string[] = [];
  const closed: Promise<void>[] = [];
  page.on('popup', (popup) => {
    // The tab opens synchronously with the click (popup blockers) and is closed on 429.
    closed.push(popup.waitForEvent('close').then(() => void closedUrls.push(popup.url())));
  });
  await f.submit.click();
  const alert = page.getByRole('alert').filter({ hasText: 'Ai trimis deja mai multe cereri' });
  await expect(alert).toBeVisible();
  await expect(page.getByRole('link', { name: 'Scrie pe WhatsApp' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sună-ne' }).first()).toBeVisible();
  await Promise.all(closed);
  expect(closedUrls.every((url) => !url.includes('wa.me'))).toBe(true);
  await expect(page.getByText(/^Mulțumim/)).toBeHidden();
  expect(api.requests).toHaveLength(1);
});

test('/lectie-demo/?grupa=movers preselects the age group and sends source landing', async ({ page }) => {
  const api = await mockLeadApi(page, { status: 201 });
  const f = await open(page, '/lectie-demo/?grupa=movers');
  await expect(page.getByRole('radio', { name: '9–10 ani' })).toBeChecked();
  await f.name.fill(PARENT);
  await f.phone.fill('0722 123 456');
  await f.consent.check();
  const popupPromise = page.waitForEvent('popup');
  await page.locator('lead-form form').getByRole('button', { name: 'Rezervă lecția gratuită' }).click();
  await popupPromise;
  await expect(page.getByText(`Mulțumim, ${PARENT}!`)).toBeVisible();
  expect(api.requests[0]).toMatchObject({ source: 'landing', childAgeGroup: '9–10 ani' });
});
