import type { Page } from '@playwright/test';

export const TEST_TRACKING = {
  ga4MeasurementId: 'G-TEST12345',
  metaPixelId: '123456789012345',
  googleAdsId: 'AW-1234567890',
  googleAdsLeadLabel: 'TestLabel_1',
};

const TAG_DOMAINS = ['googletagmanager.com', 'google-analytics.com', 'googleadservices.com', 'doubleclick.net', 'facebook.net', 'facebook.com'];

export const isTagHost = (url: URL): boolean =>
  TAG_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));

export async function showBannerToTests(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
  });
}

export async function useTestTracking(page: Page): Promise<string[]> {
  const requested: string[] = [];
  await page.route(isTagHost, async (route) => {
    requested.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  await page.route(
    (url) => url.origin === 'http://localhost:4399' && (url.pathname.endsWith('/') || url.pathname.endsWith('.html')),
    async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        /data-tracking="[^"]*"/,
        `data-tracking="${JSON.stringify(TEST_TRACKING).replace(/"/g, '&quot;')}"`,
      );
      await route.fulfill({ response, body: html });
    },
  );
  return requested;
}
