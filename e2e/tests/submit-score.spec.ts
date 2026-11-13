import { test, expect } from '../fixtures/test-fixtures';

test.describe('Submit Score', () => {
  test('includes penalty options in the initial HTML', async ({ authenticatedPage }) => {
    const response = await authenticatedPage.request.get('/submit-score');
    const html = await response.text();

    expect(html).toContain('>Skip a drink</span>');
    expect(html).toContain('>Tactical chunder</span>');
  });

  test('submits a score successfully', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/game');
    await page.getByRole('link', { name: 'Log Your Sips' }).click();

    await expect(page).toHaveURL('/submit-score');

    await page.getByRole('button', { name: /^Hole 3,/ }).click();
    await page.getByRole('button', { name: 'Increment' }).click();
    await page.getByRole('button', { name: 'Increment' }).click();
    await page.getByRole('button', { name: 'Log It' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('enforces score limits with buttons', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    const minusButton = page.getByRole('button', { name: 'Decrement' });
    const plusButton = page.getByRole('button', { name: 'Increment' });

    await expect(minusButton).toBeEnabled();

    for (let i = 0; i < 10; i++) {
      await minusButton.click();
    }

    await expect(minusButton).toBeDisabled();

    for (let i = 0; i < 20; i++) {
      await plusButton.click();
    }

    await expect(plusButton).toBeDisabled();
  });

  test('redirects to home if no session', async ({ page }) => {
    await page.goto('/submit-score');

    await expect(page).toHaveURL('/play');
  });

  test('back button returns to game page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');
    await page.getByRole('link', { name: 'Back to Leaderboard' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('penalty selection disables score buttons and shows penalty score', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    const minusButton = page.getByRole('button', { name: 'Decrement' });
    const plusButton = page.getByRole('button', { name: 'Increment' });

    await expect(minusButton).toBeEnabled();
    await expect(plusButton).toBeEnabled();

    const penaltyButtons = page.getByRole('button').filter({ hasText: /\+\d+/ });
    const firstPenalty = penaltyButtons.first();
    await firstPenalty.click();

    await expect(minusButton).toBeDisabled();
    await expect(plusButton).toBeDisabled();

    await firstPenalty.click();

    await expect(minusButton).toBeEnabled();
    await expect(plusButton).toBeEnabled();
  });
});

test('renders the first unplayed hole in the initial HTML', async ({ page, baseURL, createGameViaApi, submitScoreViaApi }) => {
  const session = await createGameViaApi('Server rendering');
  await submitScoreViaApi(session.gameCode, session.playerId, 1, 0);
  await submitScoreViaApi(session.gameCode, session.playerId, 2, 3);
  await page.context().addCookies([
    { name: 'gameCode', value: session.gameCode, url: baseURL! },
    { name: 'playerId', value: session.playerId, url: baseURL! },
  ]);
  const response = await page.request.get('/submit-score');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('HOLE <!-- -->3');
  await page.goto('/submit-score');
  await expect(page.getByRole('heading', { name: /hole 3/i })).toBeVisible();
});
