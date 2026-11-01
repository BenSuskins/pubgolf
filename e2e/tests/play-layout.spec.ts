import { test, expect } from '../fixtures/test-fixtures';

test('entry, scoring, and wildcard controls remain usable at narrow and zoomed widths', async ({ page, createGameViaApi }) => {
  const session = await createGameViaApi('Long Player Name');
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/play');
  await page.evaluate((currentSession) => {
    localStorage.setItem('gameCode', currentSession.gameCode);
    localStorage.setItem('playerId', currentSession.playerId);
  }, session);

  for (const path of ['/play', '/game', '/submit-score', '/randomise']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }

  await page.goto('/submit-score');
  const increment = page.getByRole('button', { name: 'Increment' });
  await increment.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Sips counter')).toContainText('1');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'LOG IT' })).toBeVisible();
});

test('homepage guidance is visible and play stays out of the search index', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'How to play', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pubgolf.me');
  await page.goto('/play');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
