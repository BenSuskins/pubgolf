import { test, expect } from '../fixtures/test-fixtures';

test('explains when the round ends before a player spins', async ({ authenticatedPage: page, completeGameViaApi }) => {
  const session = await page.evaluate(() => ({
    code: document.cookie.split('; ').find((entry) => entry.startsWith('gameCode='))?.split('=')[1]!,
    playerId: document.cookie.split('; ').find((entry) => entry.startsWith('playerId='))?.split('=')[1]!,
  }));
  await page.goto('/randomise');
  await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeVisible();
  await completeGameViaApi(session.code, session.playerId);
  await page.getByRole('button', { name: 'Spin the wheel' }).click();
  await expect(page.getByText('This round has ended, so Wildcard is no longer available.')).toBeVisible();
});
