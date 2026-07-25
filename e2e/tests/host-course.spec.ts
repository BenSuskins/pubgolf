import { test, expect } from '../fixtures/test-fixtures';

test.describe('Host Course Editing', () => {
  test('host edits drinks and pars and players see the new course', async ({
    page,
    createGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('CourseHost');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);

    // Seeded from the default course until the host edits it.
    const firstDrink = page.getByLabel('Hole 1 drink on Route A');
    await expect(firstDrink).toHaveValue('Tequila');

    await firstDrink.fill('Espresso Martini');
    await page.getByLabel('Hole 1 par').fill('4');
    await page.getByRole('button', { name: 'Save Drinks & Pars' }).click();

    await expect(page.getByText('Saved — all players updated')).toBeVisible();

    // The rules page reads the game's course, not the global default.
    await page.goto('/how-to-play');
    await expect(page.getByText('Espresso Martini')).toBeVisible();

    // Par drives the log-score screen too.
    await page.goto('/submit-score');
    await expect(page.getByText(/Par 4 · how many did it take\?/)).toBeVisible();
  });

  test('host can rename a route', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('RenameHost');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);

    await page.getByLabel('Route 1 name').fill('Ale Trail');
    await page.getByRole('button', { name: 'Save Drinks & Pars' }).click();

    await expect(page.getByText('Saved — all players updated')).toBeVisible();

    await page.goto('/how-to-play');
    await expect(page.getByRole('columnheader', { name: 'Ale Trail' })).toBeVisible();
  });

  test('blank drink is rejected before saving', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('ValidationHost');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);

    await page.getByLabel('Hole 2 drink on Route A').fill('');
    await page.getByRole('button', { name: 'Save Drinks & Pars' }).click();

    await expect(page.getByText('Every route needs a drink for hole 2')).toBeVisible();
  });

  test('non-host is redirected away from the host panel', async ({
    page,
    createGameViaApi,
    joinGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('CourseHost');
    const playerSession = await joinGameViaApi(hostSession.gameCode, 'RegularPlayer');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, playerSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);

    await expect(page.getByRole('button', { name: 'Save Drinks & Pars' })).toHaveCount(0);
  });
});
