import { expect, test, type Page } from '@playwright/test';
import { showBannerToTests, useTestTracking } from './support/tracking';

const GTAG = 'googletagmanager.com/gtag/js?id=G-TEST12345';
const FBEVENTS = 'connect.facebook.net/en_US/fbevents.js';

async function open(page: Page): Promise<string[]> {
  await showBannerToTests(page);
  const requested = await useTestTracking(page);
  await page.goto('/');
  return requested;
}

function dataLayer(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const layer = (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer;
    return Array.from(layer, (entry) => Array.from(entry as ArrayLike<unknown>));
  });
}

const main = (page: Page) => page.locator('#cc-main');

test('no choice: banner shows, no tag requests, consent defaults denied', async ({ page }) => {
  const requested = await open(page);
  await expect(main(page).getByRole('button', { name: 'Accept toate' })).toBeVisible();
  await expect(main(page).getByRole('button', { name: 'Refuz', exact: true })).toBeVisible();
  await expect(main(page).getByRole('button', { name: 'Aleg eu' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requested).toEqual([]);
  const first = (await dataLayer(page))[0];
  expect(first?.[0]).toBe('consent');
  expect(first?.[1]).toBe('default');
  const signals = first?.[2] as Record<string, string>;
  expect(Object.keys(signals)).toHaveLength(4);
  expect(Object.values(signals).every((value) => value === 'denied')).toBe(true);
});

test('refuse: no tags, banner stays gone after reload, cookie stored', async ({ page }) => {
  const requested = await open(page);
  const refuse = main(page).getByRole('button', { name: 'Refuz', exact: true });
  await refuse.click();
  await expect(refuse).toBeHidden();
  await page.waitForLoadState('networkidle');
  expect(requested).toEqual([]);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(main(page).getByRole('button', { name: 'Accept toate' })).toBeHidden();
  expect(requested).toEqual([]);
  const granted = (await dataLayer(page)).filter(
    (entry) =>
      entry[0] === 'consent' &&
      entry[1] === 'update' &&
      Object.values(entry[2] as Record<string, string>).includes('granted'),
  );
  expect(granted).toEqual([]);
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === 'em_consent')).toBe(true);
});

test('accept all: loads gtag and fbevents and grants consent', async ({ page }) => {
  const requested = await open(page);
  await main(page).getByRole('button', { name: 'Accept toate' }).click();
  await expect.poll(() => requested.some((url) => url.includes(GTAG))).toBe(true);
  await expect.poll(() => requested.some((url) => url.includes(FBEVENTS))).toBe(true);
  await expect
    .poll(async () => (await dataLayer(page)).find((entry) => entry[0] === 'consent' && entry[1] === 'update')?.[2])
    .toMatchObject({ analytics_storage: 'granted', ad_storage: 'granted' });
});

test('custom choice: statistics only loads gtag but not fbevents', async ({ page }) => {
  const requested = await open(page);
  await main(page).getByRole('button', { name: 'Aleg eu' }).click();
  const analytics = main(page).locator('input.section__toggle[value="analytics"]');
  await main(page).locator('label.section__toggle-wrapper', { has: page.locator('input[value="analytics"]') }).click();
  await expect(analytics).toBeChecked();
  await main(page).getByRole('button', { name: 'Salvez alegerea' }).click();
  await expect.poll(() => requested.some((url) => url.includes(GTAG))).toBe(true);
  await page.waitForLoadState('networkidle');
  expect(requested.some((url) => url.includes(FBEVENTS))).toBe(false);
});

test('footer settings: reopens preferences and refuse-all reloads without new tag requests', async ({ page }) => {
  const requested = await open(page);
  await main(page).getByRole('button', { name: 'Accept toate' }).click();
  await expect.poll(() => requested.some((url) => url.includes(GTAG))).toBe(true);
  await page.getByRole('button', { name: 'Setări cookies' }).click();
  const refuseAll = main(page).getByRole('button', { name: 'Refuz toate' });
  await expect(refuseAll).toBeVisible();
  const before = requested.length;
  const reloaded = page.waitForEvent('load');
  await refuseAll.click();
  await reloaded;
  await page.waitForLoadState('networkidle');
  expect(requested.slice(before)).toEqual([]);
});

test('keyboard: Tab reaches the banner buttons and Enter on Refuz closes it', async ({ page }) => {
  await open(page);
  const refuse = main(page).getByRole('button', { name: 'Refuz', exact: true });
  await expect(refuse).toBeVisible();
  let reached = false;
  for (let i = 0; i < 40 && !reached; i += 1) {
    await page.keyboard.press('Tab');
    reached = await refuse.evaluate((el) => el === document.activeElement);
  }
  expect(reached).toBe(true);
  await page.keyboard.press('Enter');
  await expect(refuse).toBeHidden();
});
