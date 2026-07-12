import { test, expect } from '../fixtures/test-fixtures';

test.describe('Full Game Flow', () => {
  test('complete game from creation to leaderboard', async ({ page, browser }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Host a Round' }).click();
    await page.locator('#create-name').fill('GameHost');
    await page.getByRole('button', { name: 'Tee Off' }).click();

    await expect(page).toHaveURL('/game');

    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    const gameCode = await page.evaluate(() => localStorage.getItem('gameCode'));
    expect(gameCode).toBeTruthy();

    const player2Context = await browser.newContext();
    const player2Page = await player2Context.newPage();

    await player2Page.goto('/');
    await player2Page.getByRole('button', { name: 'Join a Round' }).click();
    await player2Page.locator('#join-name').fill('Player2');
    await player2Page.locator('#game-code').fill(gameCode!);
    await player2Page.getByRole('button', { name: 'Join the Round' }).click();

    await expect(player2Page).toHaveURL('/game');

    await page.getByRole('link', { name: 'Log Your Sips' }).click();
    await page.getByRole('button', { name: /^Hole 1,/ }).click();
    await page.getByRole('button', { name: 'Increment' }).click();
    await page.getByRole('button', { name: 'Increment' }).click();
    await page.getByRole('button', { name: 'Log It' }).click();

    await expect(page).toHaveURL('/game');

    await player2Page.getByRole('link', { name: 'Log Your Sips' }).click();
    await player2Page.getByRole('button', { name: /^Hole 1,/ }).click();
    for (let i = 0; i < 4; i++) {
      await player2Page.getByRole('button', { name: 'Increment' }).click();
    }
    await player2Page.getByRole('button', { name: 'Log It' }).click();

    await expect(player2Page).toHaveURL('/game');

    await page.reload();
    const hostRow = page.locator('ol[aria-label="Leaderboard"] > li').first();
    await expect(hostRow).toContainText('GameHost');

    await player2Context.close();
  });

  test('multiple holes game progression', async ({ authenticatedPage, submitScoreViaApi }) => {
    const page = authenticatedPage;

    const gameCode = await page.evaluate(() => localStorage.getItem('gameCode'));
    const playerId = await page.evaluate(() => localStorage.getItem('playerId'));

    for (let hole = 1; hole <= 5; hole++) {
      await submitScoreViaApi(gameCode!, playerId!, hole, hole);
    }

    await page.goto('/game');

    await expect(page.getByText('+5', { exact: true })).toBeVisible();
  });
});
