import { test, expect } from '../fixtures/test-fixtures';

test('the server-rendered guide is readable without client JavaScript or API requests', async ({ browser, request }) => {
  const response = await request.get('/how-to-play');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('Skip a drink');
  expect(html).toContain('Tactical chunder');
  expect(html).toContain('Smirnoff Ice');
  expect(html).toContain('https://pubgolf.me/how-to-play');

  const context = await browser.newContext({
    baseURL: new URL(response.url()).origin,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.route('**/api/**', (route) => route.abort());
  await page.goto('/how-to-play');
  await expect(page.getByText('Skip a drink')).toBeVisible();
  await expect(page.getByText('Smirnoff Ice')).toBeVisible();
  await expect(page.getByRole('link', { name: /Host a round/ })).toHaveAttribute('href', '/play?mode=host');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://pubgolf.me/how-to-play');
  await context.close();
});
