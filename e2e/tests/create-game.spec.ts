import { test, expect } from '../fixtures/test-fixtures';

test.describe('Create Game', () => {
  test('creates a new game successfully', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Host a Round' }).click();
    await page.locator('#create-name').fill('Alice');
    await page.getByRole('button', { name: 'Tee Off' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    await expect(page.getByText(/[A-Z]+\d{3} · Hole \d of \d/)).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });

  test('shows validation error for short name', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Host a Round' }).click();
    await page.locator('#create-name').fill('A');
    await page.getByRole('button', { name: 'Tee Off' }).click();

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('route map is set up from the host panel', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Host a Round' }).click();
    await page.locator('#create-name').fill('RouteHost');
    await page.getByRole('button', { name: 'Tee Off' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByRole('switch', { name: 'Add route map' })).toHaveCount(0);

    await page.getByRole('link', { name: 'Host Panel' }).click();
    await page.getByRole('link', { name: 'Set up route map' }).click();

    await expect(page).toHaveURL('/game/route');
    await expect(page.getByRole('heading', { name: 'Add Route Map' })).toBeVisible();

    await page.getByRole('link', { name: 'Skip for now' }).click();
    await expect(page).toHaveURL('/game');
  });

  test('stores session in localStorage after creation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Host a Round' }).click();
    await page.locator('#create-name').fill('StorageTest');
    await page.getByRole('button', { name: 'Tee Off' }).click();

    await expect(page).toHaveURL('/game');

    const gameCode = await page.evaluate(() => localStorage.getItem('gameCode'));
    const playerId = await page.evaluate(() => localStorage.getItem('playerId'));

    expect(gameCode).toMatch(/^[A-Z]+\d{3}$/);
    expect(playerId).toMatch(/^[a-f0-9-]{36}$/i);
  });
});
