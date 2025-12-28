import { test, expect } from '../fixtures/test-fixtures';

test.describe('Leaderboard', () => {
  test('displays all players sorted by score', async ({ page, createGameViaApi, joinGameViaApi, submitScoreViaApi }) => {
    const hostSession = await createGameViaApi('Leader');
    const player2 = await joinGameViaApi(hostSession.gameCode, 'Middle');
    const player3 = await joinGameViaApi(hostSession.gameCode, 'Last');

    await submitScoreViaApi(hostSession.gameCode, hostSession.playerId, 1, 1);
    await submitScoreViaApi(hostSession.gameCode, player2.playerId, 1, 3);
    await submitScoreViaApi(hostSession.gameCode, player3.playerId, 1, 5);

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto('/game');

    const playerRows = page.locator('table tbody tr');
    await expect(playerRows).toHaveCount(3);

    const firstRowText = await playerRows.first().textContent();
    expect(firstRowText).toContain('Leader');
  });

  test('shows invite friends button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/game');

    await expect(page.getByRole('button', { name: 'Invite friends' })).toBeVisible();
  });
});
