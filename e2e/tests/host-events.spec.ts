import { test, expect } from '../fixtures/test-fixtures';

test.describe('Host Events', () => {
  test('host can access host controls page', async ({ page, createGameViaApi }) => {
    const session = await createGameViaApi('HostPlayer');

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

    await page.getByRole('link', { name: 'Host Controls' }).click();

    await expect(page).toHaveURL(`/game/${session.gameCode}/host`);
    await expect(page.getByRole('heading', { name: 'Host Controls' })).toBeVisible();
  });

  test('non-host cannot access host controls', async ({ page, createGameViaApi, joinGameViaApi }) => {
    const hostSession = await createGameViaApi('HostPlayer');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'RegularPlayer');

    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      playerSession
    );

    await page.goto(`/game/${hostSession.gameCode}/host`);

    // Should redirect to /game since they're not the host
    await expect(page).toHaveURL('/game');
  });

  test('host controls page displays available events', async ({
    page,
    createGameViaApi,
    getEventsViaApi,
  }) => {
    const session = await createGameViaApi('HostPlayer');
    const events = await getEventsViaApi();

    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      session
    );

    await page.goto(`/game/${session.gameCode}/host`);

    // Verify all preset events are displayed
    for (const event of events) {
      await expect(page.getByText(event.name)).toBeVisible();
    }
  });

  test('host can start an event', async ({ page, createGameViaApi, getActiveEventViaApi }) => {
    const session = await createGameViaApi('HostPlayer');

    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      session
    );

    await page.goto(`/game/${session.gameCode}/host`);

    // Click on Power Hour event card
    await page.getByText('Power Hour').click();

    // Confirm the start
    await page.getByRole('button', { name: 'Start Event' }).click();

    // Verify event is now active via API
    const activeEvent = await getActiveEventViaApi(session.gameCode);
    expect(activeEvent).not.toBeNull();
    expect(activeEvent?.name).toBe('Power Hour');
  });

  test('host can end an active event', async ({
    page,
    createGameViaApi,
    startEventViaApi,
    getActiveEventViaApi,
  }) => {
    const session = await createGameViaApi('HostPlayer');

    // Start an event via API
    await startEventViaApi(session.gameCode, session.playerId, 'power-hour');

    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      session
    );

    await page.goto(`/game/${session.gameCode}/host`);

    // The active event card should show "End Event" button
    await page.getByRole('button', { name: 'End Event' }).click();

    // Verify event is no longer active
    const activeEvent = await getActiveEventViaApi(session.gameCode);
    expect(activeEvent).toBeNull();
  });

  test('host controls shows end game button', async ({ page, createGameViaApi }) => {
    const session = await createGameViaApi('HostPlayer');

    await page.goto('/');
    await page.evaluate(
      session => {
        localStorage.setItem('gameCode', session.gameCode);
        localStorage.setItem('playerId', session.playerId);
        localStorage.setItem('playerName', session.playerName);
      },
      session
    );

    await page.goto(`/game/${session.gameCode}/host`);

    await expect(page.getByRole('button', { name: 'End Game' })).toBeVisible();
  });
});
