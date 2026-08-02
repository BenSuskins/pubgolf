import { test, expect } from '../fixtures/test-fixtures';
import type { Page } from '@playwright/test';

/** The par stepper's current value, scoped inside the stepper's own group. */
function parValue(page: Page, hole: number, par: number) {
  return page
    .getByRole('group', { name: `Hole ${hole} par` })
    .getByText(String(par), { exact: true });
}

/** The panel opens on Events; course setup lives behind the second tab. */
async function openCourseTab(page: Page) {
  await page.getByRole('button', { name: 'Course' }).click();
  await expect(page.getByText('Drinks & Pars')).toBeVisible();
}

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
    await openCourseTab(page);

    // Seeded from the default course until the host edits it.
    const firstDrink = page.getByLabel('Hole 1 drink on Route A');
    await expect(firstDrink).toHaveValue('Tequila');

    await firstDrink.fill('Espresso Martini');
    // Par steps up rather than being typed: hole 1 starts at par 1.
    const stepUp = page.getByRole('button', { name: 'Increase hole 1 par' });
    await stepUp.click();
    await stepUp.click();
    await stepUp.click();
    await expect(parValue(page, 1, 4)).toBeVisible();
    await page.getByRole('button', { name: 'SAVE COURSE' }).click();

    await expect(page.getByText('Saved — all players updated')).toBeVisible();

    // Opened from the game, the rules page reads that game's course rather
    // than the global default.
    await page.goto('/how-to-play?from=game');
    await expect(page.getByText('Espresso Martini')).toBeVisible();

    // Opened from the home page it is the generic rules, so the default course
    // shows even though this browser is still in a game.
    await page.goto('/');
    await page.getByRole('link', { name: /learn the rules/i }).click();
    await expect(page.getByRole('heading', { name: /The Course/i })).toBeVisible();
    await expect(page.getByText('Tequila')).toBeVisible();
    await expect(page.getByText('Espresso Martini')).toHaveCount(0);

    // Par drives the log-score screen too.
    await page.goto('/submit-score');
    await expect(page.getByText(/Par 4 · how many did it take\?/)).toBeVisible();
  });

  test('tapping a route chip swaps the drinks but not the shared par', async ({
    page,
    createGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('ChipHost');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);
    await openCourseTab(page);

    await expect(page.getByLabel('Hole 1 drink on Route A')).toHaveValue('Tequila');
    await expect(parValue(page, 1, 1)).toBeVisible();

    await page.getByRole('button', { name: 'Route B', exact: true }).click();

    await expect(page.getByLabel('Hole 1 drink on Route B')).toHaveValue('Sambuca');
    await expect(page.getByLabel('Hole 1 drink on Route A')).toHaveCount(0);
    // Par is game-level state, so it is the same whichever route is shown.
    await expect(parValue(page, 1, 1)).toBeVisible();
  });

  test('host can rename a route by tapping the selected chip again', async ({
    page,
    createGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('RenameHost');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);
    await openCourseTab(page);

    // Route A is selected on arrival, so one more tap opens rename.
    await page.getByRole('button', { name: 'Route A', exact: true }).click();
    await page.getByLabel('Route 1 name').fill('Ale Trail');
    await page.getByRole('button', { name: 'SAVE COURSE' }).click();

    await expect(page.getByText('Saved — all players updated')).toBeVisible();

    await page.goto('/how-to-play?from=game');
    await expect(page.getByRole('columnheader', { name: 'Ale Trail' })).toBeVisible();
  });

  test('host adds a route from the sheet with par carried over', async ({
    page,
    createGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('AddRouteHost');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, hostSession);

    await page.goto(`/game/${hostSession.gameCode}/host`);
    await openCourseTab(page);

    await page.getByRole('button', { name: '+ Route' }).click();
    await expect(page.getByRole('heading', { name: 'New Route' })).toBeVisible();

    await page.getByLabel('Route name').fill('Wine Walk');
    for (let hole = 1; hole <= 9; hole++) {
      await page.getByLabel(`New route drink for hole ${hole}`).fill(`Wine ${hole}`);
    }
    await page.getByRole('button', { name: 'CREATE ROUTE' }).click();

    // The new route is selected straight away, then persisted with the course.
    await expect(page.getByLabel('Hole 1 drink on Wine Walk')).toHaveValue('Wine 1');
    await page.getByRole('button', { name: 'SAVE COURSE' }).click();
    await expect(page.getByText('Saved — all players updated')).toBeVisible();

    await page.goto('/how-to-play?from=game');
    await expect(page.getByRole('columnheader', { name: 'Wine Walk' })).toBeVisible();
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
    await openCourseTab(page);

    await page.getByLabel('Hole 2 drink on Route A').fill('');
    await page.getByRole('button', { name: 'SAVE COURSE' }).click();

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

    await expect(page).toHaveURL(/\/game$/);
    await expect(page.getByRole('button', { name: 'Course', exact: true })).toHaveCount(0);
  });
});
