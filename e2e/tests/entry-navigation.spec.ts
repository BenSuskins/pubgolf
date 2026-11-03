import { test, expect } from '../fixtures/test-fixtures';

test('landing actions select the correct game entry form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Your Name')).toHaveCount(0);
  await page.getByRole('link', { name: 'Host a round →', exact: true }).click();
  await expect(page).toHaveURL('/play?mode=host');
  await expect(page.locator('#create-name')).toBeVisible();
  await page.goto('/');
  await page.getByRole('main').getByRole('link', { name: 'Join a round', exact: true }).click();
  await expect(page).toHaveURL('/play?mode=join');
  await expect(page.getByLabel('Game Code')).toBeVisible();
});

test('new and legacy invitations open Join directly', async ({ page, createGameViaApi }) => {
  const session = await createGameViaApi('Invite Host');
  for (const path of ['/', '/play']) {
    await page.goto(`${path}?gameCode=${session.gameCode}&mode=host`);
    await expect(page).toHaveURL(new RegExp(`/play\\?.*gameCode=${session.gameCode}`));
    await expect(page.getByLabel('Game Code')).toHaveValue(session.gameCode);
  }
});

test('saved players can resume without visiting marketing', async ({ authenticatedPage: page }) => {
  await page.goto('/play');
  await page.getByRole('link', { name: /resume/i }).click();
  await expect(page).toHaveURL('/game');
  await expect(page.getByText('TestPlayer', { exact: true })).toBeVisible();
});

test('game rules provide a direct return and exclude public guide content', async ({
  authenticatedPage: page,
}) => {
  await page.goto('/how-to-play?from=game');
  await expect(page).toHaveURL(/\/game\/rules(?:\?from=game)?$/);
  await expect(page.getByRole('heading', { name: 'Round Rules' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Course' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pub Golf FAQ' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to Leaderboard' }).click();
  await expect(page).toHaveURL('/game');
});

test('public pages and game pages declare separate search policies', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pubgolf.me');
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema!)['@graph']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ '@type': 'WebApplication', url: 'https://pubgolf.me/play' }),
    ])
  );
  await page.goto('/how-to-play');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://pubgolf.me/how-to-play'
  );
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await page.goto('/play');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
