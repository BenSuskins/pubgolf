import { test, expect } from '../fixtures/test-fixtures';

test.describe('Player Events', () => {
  test('player sees event modal when event starts', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
    startEventViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Player navigates to game page
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

    // Host starts an event
    await startEventViaApi(hostSession.gameCode, hostSession.playerId, 'power-hour');

    // Player should see the event modal (via WebSocket)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Power Hour')).toBeVisible();
    await expect(
      page.getByText('Everyone must finish their drink within the hour!')
    ).toBeVisible();
  });

  test('player can dismiss event modal', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
    startEventViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Start event first so it's there when page loads
    await startEventViaApi(hostSession.gameCode, hostSession.playerId, 'power-hour');

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

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Click "Got it" to dismiss
    await page.getByRole('button', { name: 'Got it' }).click();

    // Modal should be gone
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('player sees active event banner', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
    startEventViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Start event first
    await startEventViaApi(hostSession.gameCode, hostSession.playerId, 'double-trouble');

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

    // Dismiss the modal first
    await page.getByRole('button', { name: 'Got it' }).click();

    // Banner should be visible
    await expect(page.getByText('Active Event: Double Trouble')).toBeVisible();
  });

  test('player sees event end modal when event ends', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
    startEventViaApi,
    endEventViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Start event
    await startEventViaApi(hostSession.gameCode, hostSession.playerId, 'lefty-lucy');

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

    // Dismiss the start modal
    await page.getByRole('button', { name: 'Got it' }).click();

    // Host ends the event
    await endEventViaApi(hostSession.gameCode, hostSession.playerId);

    // Player should see end modal
    await expect(page.getByText('Lefty Lucy has ended!')).toBeVisible({ timeout: 5000 });
  });

  test('event modal is not shown again for same event', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
    startEventViaApi,
  }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'Player2');

    // Start event first
    await startEventViaApi(hostSession.gameCode, hostSession.playerId, 'silent-round');

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

    // Dismiss the modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Got it' }).click();

    // Refresh the page
    await page.reload();

    // Modal should not appear again (event is remembered as seen)
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // But banner should still be visible since event is active
    await expect(page.getByText('Active Event: Silent Round')).toBeVisible();
  });
});
