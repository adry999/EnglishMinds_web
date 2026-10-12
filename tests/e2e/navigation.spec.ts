import { expect, test } from '@playwright/test';

test('mobile: the menu opens from the toggle, leads to a section and closes on Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the toggle only exists on narrow screens');
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  const toggle = page.getByRole('button', { name: 'Meniu' });
  await expect(nav.getByRole('link', { name: 'Grupe' })).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(nav.getByRole('link', { name: 'Grupe' })).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await nav.getByRole('link', { name: 'Grupe' }).click();
  await expect(page).toHaveURL(/\/grupe\/$/);
});

test('desktop: the links are always visible and there is no toggle', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout only');
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Grupe' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Meniu' })).toBeHidden();
});

test('no page scrolls sideways on a phone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone width only');
  for (const path of ['/', '/grupe/', '/metoda-cambridge/', '/test-de-nivel/', '/tabere/', '/blog/', '/lectie-demo/']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
