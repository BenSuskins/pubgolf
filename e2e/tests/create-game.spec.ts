import { test, expect } from '../fixtures/test-fixtures';

test.describe('Create Game', () => {
  test('creates a new game successfully', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Create a Game' }).click();
    await page.locator('#create-name').fill('Alice');
    await page.getByRole('button', { name: 'Create Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByRole('heading', { name: /Game: [A-Z]+\d{3}/ })).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });

  test('shows validation error for short name', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Create a Game' }).click();
    await page.locator('#create-name').fill('A');
    await page.getByRole('button', { name: 'Create Game' }).click();

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('stores session in localStorage after creation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Create a Game' }).click();
    await page.locator('#create-name').fill('StorageTest');
    await page.getByRole('button', { name: 'Create Game' }).click();

    await expect(page).toHaveURL('/game');

    const gameCode = await page.evaluate(() => localStorage.getItem('gameCode'));
    const playerId = await page.evaluate(() => localStorage.getItem('playerId'));
    const playerName = await page.evaluate(() => localStorage.getItem('playerName'));

    expect(gameCode).toMatch(/^[A-Z]+\d{3}$/);
    expect(playerId).toMatch(/^[a-f0-9-]{36}$/i);
    expect(playerName).toBe('StorageTest');
  });
});
