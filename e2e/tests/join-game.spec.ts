import { test, expect } from '../fixtures/test-fixtures';

test.describe('Join Game', () => {
  test('joins an existing game successfully', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('GameHost');

    await page.goto('/');

    await page.getByRole('button', { name: 'Join a Game' }).click();
    await page.locator('#join-name').fill('NewPlayer');
    await page.locator('#game-code').fill(hostSession.gameCode);
    await page.getByRole('button', { name: 'Join Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('GameHost')).toBeVisible();
    await expect(page.getByText('NewPlayer')).toBeVisible();
  });

  test('shows error for non-existent game code', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Join a Game' }).click();
    await page.locator('#join-name').fill('LostPlayer');
    await page.locator('#game-code').fill('INVALID999');
    await page.getByRole('button', { name: 'Join Game' }).click();

    await expect(page.getByText(/not found/i)).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('shows error for duplicate player name', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('DuplicateName');

    await page.goto('/');

    await page.getByRole('button', { name: 'Join a Game' }).click();
    await page.locator('#join-name').fill('DuplicateName');
    await page.locator('#game-code').fill(hostSession.gameCode);
    await page.getByRole('button', { name: 'Join Game' }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('prefills game code from URL parameter', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('UrlHost');

    await page.goto(`/?gameCode=${hostSession.gameCode}`);

    await page.getByRole('button', { name: 'Join a Game' }).click();
    const gameCodeInput = page.locator('#game-code');
    await expect(gameCodeInput).toHaveValue(hostSession.gameCode.toUpperCase());
  });
});
