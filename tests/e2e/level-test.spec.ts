import { expect, test } from '@playwright/test';
import { mockLeadApi, stubWhatsApp } from './support/lead-api';

const CHILD = 'Matei Ionescu';
const FIRST_AUDIO_QUESTION = 3;

test.beforeEach(async ({ context }) => {
  await stubWhatsApp(context);
});

test('level test -> diploma -> booking form, child name never sent', async ({ page }) => {
  const api = await mockLeadApi(page, { status: 201 });
  await page.goto('/test-de-nivel/');
  const leadForm = page.locator('lead-form');
  await expect(leadForm).toBeHidden();

  await page.getByRole('button', { name: /Test de nivel/ }).click();
  await page.getByRole('button', { name: '5–6 ani' }).click();
  await page.getByRole('button', { name: 'Începe testul' }).click();

  const nameLabel = page.getByText('Cui se decernează diploma?');
  for (let i = 0; i < 12 && !(await nameLabel.isVisible()); i += 1) {
    await expect(page.getByRole('progressbar', { name: 'Progres' })).toHaveAttribute('aria-valuenow', String(i + 1));
    await page.locator('level-test .level-test__options button').first().click();
  }
  await expect(nameLabel).toBeVisible();
  await expect(leadForm).toBeVisible();

  await expect(page.getByRole('button', { name: 'Scrie numele ca să descarci' })).toBeDisabled();
  await page.getByLabel('Cui se decernează diploma?').fill(CHILD);
  await expect(page.getByRole('button', { name: 'Descarcă diploma (PNG)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Tipărește/ })).toBeVisible();
  await expect(page.locator('.level-test__diploma-name')).toHaveText(CHILD);

  const form = leadForm.locator('form');
  await page.getByRole('button', { name: 'Rezervă lecția demo' }).click();
  await expect(form.getByLabel('Numele părintelui')).toBeFocused();
  await expect(form.getByLabel('Numele părintelui')).toBeInViewport();
  await form.getByLabel('Numele părintelui').fill('Ana Pop');
  await form.getByLabel('Telefon', { exact: true }).fill('0722 123 456');
  await form.getByLabel(/Sunt de acord/).check();
  const popupPromise = page.waitForEvent('popup');
  await form.getByRole('button', { name: 'Rezervă locul acum' }).click();
  await popupPromise;
  await expect(page.getByText('Mulțumim, Ana Pop!')).toBeVisible();

  expect(api.requests).toHaveLength(1);
  const body = api.requests[0] as { source: string; testLevel: string };
  expect(body.source).toBe('test');
  expect(body.testLevel).toMatch(/^(level|exam):[a-z0-9-]{1,24}$/);
  expect(JSON.stringify(body)).not.toContain('Matei');
  expect(JSON.stringify(body)).not.toContain('Ionescu');
});

test('audio questions without speechSynthesis show the text and the fallback note', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  });
  await page.goto('/test-de-nivel/');
  await page.getByRole('button', { name: /Test de nivel/ }).click();
  await page.getByRole('button', { name: '5–6 ani' }).click();
  await page.getByRole('button', { name: 'Începe testul' }).click();
  for (let question = 1; question < FIRST_AUDIO_QUESTION; question += 1) {
    await page.locator('level-test .level-test__options button').first().click();
  }
  await expect(page.getByRole('heading', { name: 'Ce cuvânt ai auzit?' })).toBeVisible();
  await expect(page.getByText('Browserul tău nu poate reda sunetul. Citește propoziția:')).toBeVisible();
  await expect(page.locator('level-test [lang="en"]', { hasText: /^cat$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ascultă din nou' })).toHaveCount(0);
});
