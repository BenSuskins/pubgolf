import { test, expect, storeSession } from '../fixtures/test-fixtures';

test.describe('Leaderboard', () => {
  test('displays all players sorted by score', async ({ page, createGameViaApi, joinGameViaApi, submitScoreViaApi }) => {
    const hostSession = await createGameViaApi('Leader');
    const player2 = await joinGameViaApi(hostSession.gameCode, 'Middle');
    const player3 = await joinGameViaApi(hostSession.gameCode, 'Last');

    await submitScoreViaApi(hostSession.gameCode, hostSession.playerId, 1, 1);
    await submitScoreViaApi(hostSession.gameCode, player2.playerId, 1, 3);
    await submitScoreViaApi(hostSession.gameCode, player3.playerId, 1, 5);

    await page.goto('/play');
    await storeSession(page, hostSession);

    await page.goto('/game');

    const playerRows = page.locator('ol[aria-label="Leaderboard"] > li');
    await expect(playerRows).toHaveCount(3);

    await expect(playerRows.nth(0)).toContainText('Leader');
    await expect(playerRows.nth(1)).toContainText('Middle');
    await expect(playerRows.nth(2)).toContainText('Last');
  });

  test('shows invite button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/game');

    await expect(page.getByRole('button', { name: /Invite/i })).toBeVisible();
  });
});

test('a score from a second browser updates the leaderboard without a reload', async ({ browser, page, createGameViaApi, joinGameViaApi }) => {
  const host = await createGameViaApi('WatchingHost');
  const player = await joinGameViaApi(host.gameCode, 'LivePlayer');
  await page.goto('/play');
  await storeSession(page, host);
  await page.goto('/game');
  const row = page.locator('ol[aria-label="Leaderboard"] > li').filter({ hasText: 'LivePlayer' });
  await expect(row).toBeVisible();
  const before = await row.textContent();
  let navigations = 0;
  page.on('framenavigated', () => { navigations += 1; });
  const context = await browser.newContext();
  try {
    const second = await context.newPage();
    await second.goto('/play');
    await second.evaluate(async ({ session, apiUrl }) => {
      const response = await fetch(`${apiUrl}/api/v1/games/${session.gameCode}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'PubGolf-Player-Id': session.playerId },
        body: JSON.stringify({ hole: 1, score: 7 }),
      });
      if (!response.ok) throw new Error(`Score failed: ${response.status}`);
    }, { session: player, apiUrl: process.env.BACKEND_URL ?? 'http://localhost:8080' });
    await expect.poll(() => row.textContent()).not.toBe(before);
    expect(navigations).toBe(0);
  } finally {
    await context.close();
  }
});

test('a delayed REST refresh does not replace a newer live score', async ({ page, createGameViaApi, submitScoreViaApi }) => {
  const host = await createGameViaApi('RefreshHost');
  await page.goto('/play');
  await storeSession(page, host);
  await page.goto('/game');
  const row = page.locator('ol[aria-label="Leaderboard"] > li').filter({ hasText: 'RefreshHost' });
  await expect(row).toBeVisible();
  const before = await row.textContent();
  let release!: () => void;
  let captured!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { captured = resolve; });
  let finished!: () => void;
  const done = new Promise<void>(resolve => { finished = resolve; });
  await page.route(`**/api/v1/games/${host.gameCode}`, async route => {
    const oldState = await route.fetch();
    captured();
    await held;
    await route.fulfill({ response: oldState });
    finished();
  }, { times: 1 });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await ready;
  await submitScoreViaApi(host.gameCode, host.playerId, 1, 7);
  await expect.poll(() => row.textContent()).not.toBe(before);
  const updated = await row.textContent();
  release();
  await done;
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(row).toHaveText(updated!);
});
