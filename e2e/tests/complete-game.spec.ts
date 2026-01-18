import { test, expect } from '../fixtures/test-fixtures';

test.describe('Complete Game', () => {
  test.describe('Host Controls', () => {
    test('host sees End Game button', async ({ page, createGameViaApi }) => {
      const hostSession = await createGameViaApi('HostPlayer');

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto(`/game/${hostSession.gameCode}/host`);

      await expect(page.getByRole('button', { name: 'End Game' })).toBeVisible();
    });

    test('non-host does not see End Game button', async ({ page, createGameViaApi, joinGameViaApi }) => {
      const hostSession = await createGameViaApi('HostPlayer');
      const playerSession = await joinGameViaApi(hostSession.gameCode, 'RegularPlayer');

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, playerSession);

      await page.goto(`/game/${hostSession.gameCode}/host`);

      await expect(page.getByRole('button', { name: 'End Game' })).not.toBeVisible();
    });

    test('host can complete game with confirmation modal', async ({ page, createGameViaApi }) => {
      const hostSession = await createGameViaApi('HostPlayer');

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto(`/game/${hostSession.gameCode}/host`);

      await page.getByRole('button', { name: 'End Game' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('End Game?')).toBeVisible();
      await expect(page.getByText(/permanently end the game/i)).toBeVisible();

      await page.getByRole('dialog').getByRole('button', { name: 'End Game' }).click();

      await expect(page.getByText('Game Complete')).toBeVisible();
    });

    test('host can cancel completion in modal', async ({ page, createGameViaApi }) => {
      const hostSession = await createGameViaApi('HostPlayer');

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto(`/game/${hostSession.gameCode}/host`);

      await page.getByRole('button', { name: 'End Game' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: 'Cancel' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'End Game' })).toBeVisible();
    });
  });

  test.describe('Celebration Screen', () => {
    test('shows celebration with single winner', async ({ page, createGameViaApi, joinGameViaApi, submitScoreViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('Winner');
      const player2 = await joinGameViaApi(hostSession.gameCode, 'Loser');

      await submitScoreViaApi(hostSession.gameCode, hostSession.playerId, 1, 1);
      await submitScoreViaApi(hostSession.gameCode, player2.playerId, 1, 5);

      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      await expect(page.getByRole('heading', { name: 'Winner' })).toBeVisible();
      await expect(page.getByText('1 sips')).toBeVisible();
    });

    test('shows celebration with tied winners', async ({ page, createGameViaApi, joinGameViaApi, submitScoreViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('Alice');
      const player2 = await joinGameViaApi(hostSession.gameCode, 'Bob');

      await submitScoreViaApi(hostSession.gameCode, hostSession.playerId, 1, 3);
      await submitScoreViaApi(hostSession.gameCode, player2.playerId, 1, 3);

      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      await expect(page.getByText('Winners')).toBeVisible();
      await expect(page.getByText('Alice & Bob')).toBeVisible();
    });

    test('celebration can be dismissed by clicking', async ({ page, createGameViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('SoloPlayer');
      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      const celebration = page.getByRole('button', { name: /tap to view full results/i });
      await expect(celebration).toBeVisible();

      await celebration.click();

      await expect(celebration).not.toBeVisible();
      await expect(page.getByText('Game Complete')).toBeVisible();
    });
  });

  test.describe('Completed Game UI', () => {
    test('shows Game Complete banner', async ({ page, createGameViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('TestHost');
      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      const celebration = page.getByRole('button', { name: /tap to view full results/i });
      if (await celebration.isVisible()) {
        await celebration.click();
      }

      await expect(page.getByText('Game Complete')).toBeVisible();
    });

    test('hides End Game button after completion', async ({ page, createGameViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('TestHost');
      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      const celebration = page.getByRole('button', { name: /tap to view full results/i });
      if (await celebration.isVisible()) {
        await celebration.click();
      }

      await expect(page.getByRole('button', { name: 'End Game' })).not.toBeVisible();
    });

    test('hides Invite button after completion', async ({ page, createGameViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('TestHost');
      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      const celebration = page.getByRole('button', { name: /tap to view full results/i });
      if (await celebration.isVisible()) {
        await celebration.click();
      }

      await expect(page.getByRole('button', { name: /Invite/i })).not.toBeVisible();
    });

    test('hides score submission link after completion', async ({ page, createGameViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('TestHost');
      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      const celebration = page.getByRole('button', { name: /tap to view full results/i });
      if (await celebration.isVisible()) {
        await celebration.click();
      }

      await expect(page.getByRole('link', { name: 'Log Your Sips' })).not.toBeVisible();
    });
  });

  test.describe('Blocked Actions', () => {
    test('joining completed game shows error', async ({ page, createGameViaApi, completeGameViaApi }) => {
      const hostSession = await createGameViaApi('TestHost');
      await completeGameViaApi(hostSession.gameCode, hostSession.playerId);

      await page.goto('/');
      await page.getByRole('button', { name: 'Join the Party' }).click();
      await page.locator('#join-name').fill('LateJoiner');
      await page.locator('#game-code').fill(hostSession.gameCode);
      await page.getByRole('button', { name: "I'm In!" }).click();

      await expect(page.getByText(/completed|ended/i)).toBeVisible();
    });
  });

  test.describe('Host Indicator', () => {
    test('crown icon visible next to host on leaderboard', async ({ page, createGameViaApi, joinGameViaApi }) => {
      const hostSession = await createGameViaApi('HostPlayer');
      await joinGameViaApi(hostSession.gameCode, 'RegularPlayer');

      await page.goto('/');
      await page.evaluate((session) => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      }, hostSession);

      await page.goto('/game');

      // Wait for leaderboard to load first
      await expect(page.getByText('HostPlayer')).toBeVisible();
      await expect(page.getByTitle('Host', { exact: true })).toBeVisible();
    });
  });
});
