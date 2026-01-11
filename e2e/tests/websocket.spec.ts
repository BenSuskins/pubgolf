import { test, expect } from '../fixtures/test-fixtures';

test.describe('WebSocket Real-time Updates', () => {
  test('scoreboard updates when another player submits score', async ({
    page,
    browser,
    createGameViaApi,
    joinGameViaApi,
    submitScoreViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Host opens the game page
    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      hostSession
    );

    await page.goto('/game');

    // Wait for WebSocket connection indicator
    await expect(page.locator('span[title="Connected"]')).toBeVisible({ timeout: 5000 });

    // Player submits a score via API
    await submitScoreViaApi(hostSession.gameCode, playerSession.playerId, 1, 3);

    // Host's page should update to show the score without refresh
    // The score "3" should appear in Player2's row
    await expect(page.getByText('Player2')).toBeVisible();
    await expect(page.locator('table').getByText('3')).toBeVisible({ timeout: 5000 });
  });

  test('scoreboard updates when another player joins', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');

    // Host opens the game page
    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      hostSession
    );

    await page.goto('/game');

    // Wait for WebSocket connection
    await expect(page.locator('span[title="Connected"]')).toBeVisible({ timeout: 5000 });

    // Initially only host should be visible
    await expect(page.getByText('HostPlayer')).toBeVisible();

    // New player joins via API
    await joinGameViaApi(hostSession.gameCode, 'NewPlayer');

    // Host's page should show the new player without refresh
    await expect(page.getByText('NewPlayer')).toBeVisible({ timeout: 5000 });
  });

  test('websocket shows connected indicator', async ({ page, createGameViaApi }) => {
    const session = await createGameViaApi('TestPlayer');

    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      session
    );

    await page.goto('/game');

    // Should show connected indicator (green dot)
    await expect(page.locator('span[title="Connected"]')).toBeVisible({ timeout: 5000 });
  });

  test('game ended notification received via websocket', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
    completeGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Player opens game page
    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      playerSession
    );

    await page.goto('/game');

    // Wait for WebSocket connection
    await expect(page.locator('span[title="Connected"]')).toBeVisible({ timeout: 5000 });

    // Host ends the game
    await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

    // Player should see the celebration screen
    await expect(page.getByText('Game Complete')).toBeVisible({ timeout: 5000 });
  });

  test('multiple players see real-time updates simultaneously', async ({
    browser,
    createGameViaApi,
    joinGameViaApi,
    submitScoreViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const player2Session = await joinGameViaApi(hostSession.gameCode, 'Player2');
    const player3Session = await joinGameViaApi(hostSession.gameCode, 'Player3');

    // Open pages for player 2 and player 3
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    const context3 = await browser.newContext();
    const page3 = await context3.newPage();

    // Set up Player 2's session
    await page2.goto('http://localhost:3000');
    await page2.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      player2Session
    );
    await page2.goto('http://localhost:3000/game');

    // Set up Player 3's session
    await page3.goto('http://localhost:3000');
    await page3.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      player3Session
    );
    await page3.goto('http://localhost:3000/game');

    // Wait for both to connect
    await expect(page2.locator('span[title="Connected"]')).toBeVisible({ timeout: 5000 });
    await expect(page3.locator('span[title="Connected"]')).toBeVisible({ timeout: 5000 });

    // Host submits a score
    await submitScoreViaApi(hostSession.gameCode, hostSession.playerId, 1, 5);

    // Both players should see the update
    await expect(page2.locator('table').getByText('5')).toBeVisible({ timeout: 5000 });
    await expect(page3.locator('table').getByText('5')).toBeVisible({ timeout: 5000 });

    await context2.close();
    await context3.close();
  });
});
