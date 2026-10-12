import { expect, test } from '@playwright/test';

// Computed styles, not CSS text: the footer's generic link colour must not override its own link rules.
test.describe('footer link colours', () => {
  test('the Instagram button turns navy on sun yellow on hover, not white', async ({ page }) => {
    await page.goto('/');
    const social = page.locator('.site-footer__social');
    await social.scrollIntoViewIfNeeded();
    await social.hover();
    await expect(social).toHaveCSS('background-color', await tokenColour(page, '--color-sun'));
    await expect(social).toHaveCSS('color', await tokenColour(page, '--color-navy'));
  });

  test('legal links are softened white and turn sun yellow on hover', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('.site-footer__legal a').first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toHaveCSS('color', /^rgba\(255, 255, 255, 0\.8\)$/);
    await link.hover();
    await expect(link).toHaveCSS('color', await tokenColour(page, '--color-sun'));
  });

  test('call-to-action buttons in the footer keep their own text colour', async ({ page }) => {
    await page.goto('/grupe/');
    await expect(page.locator('.site-footer .button--sun')).toHaveCSS('color', await tokenColour(page, '--color-navy'));
  });
});

async function tokenColour(page: import('@playwright/test').Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, token);
}
