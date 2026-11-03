import { test, expect } from '../fixtures/test-fixtures';

test('explains when the round ends before a player spins', async ({ authenticatedPage: page, completeGameViaApi }) => {
  const session = await page.evaluate(() => ({
    code: localStorage.getItem('gameCode')!,
    playerId: localStorage.getItem('playerId')!,
  }));
  await page.goto('/randomise');
  await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeVisible();
  await completeGameViaApi(session.code, session.playerId);
  await page.getByRole('button', { name: 'Spin the wheel' }).click();
  await expect(page.getByText('This round has ended, so Wildcard is no longer available.')).toBeVisible();
});
