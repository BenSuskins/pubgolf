import { test, expect } from '../fixtures/test-fixtures';

test('renders the leaderboard and wildcard without browser JavaScript', async ({ browser, baseURL, createGameViaApi }) => {
  const session = await createGameViaApi('Server Player');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    await context.addCookies([
      { name: 'gameCode', value: session.gameCode, url: baseURL! },
      { name: 'playerId', value: session.playerId, url: baseURL! },
    ]);
    const page = await context.newPage();
    await page.goto('/game');
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    await expect(page.getByText('Server Player')).toBeVisible();
    await page.goto('/randomise');
    await expect(page.getByRole('heading', { name: 'Wildcard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('hydrates the server-rendered wildcard without mismatched markup', async ({ authenticatedPage: page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/randomise');
  await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors.filter((message) => /hydrat/i.test(message))).toEqual([]);
});

test('uses fresh scores when returning to the score form', async ({ authenticatedPage: page }) => {
  await page.goto('/game');
  await page.getByRole('link', { name: 'Log Your Sips' }).click();
  await expect(page.getByRole('heading', { name: /hole 1/i })).toBeVisible();
  await page.getByRole('button', { name: 'Log It' }).click();
  await expect(page).toHaveURL('/game');
  await page.getByRole('link', { name: 'Log Your Sips' }).click();
  await expect(page.getByRole('heading', { name: /hole 2/i })).toBeVisible();
});
