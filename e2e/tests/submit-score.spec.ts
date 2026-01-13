import { test, expect } from '../fixtures/test-fixtures';

test.describe('Submit Score', () => {
  test('submits a score successfully', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/game');
    await page.getByRole('link', { name: 'Log Your Sips' }).click();

    await expect(page).toHaveURL('/submit-score');

    await page.locator('#hole').selectOption('3');
    await page.getByRole('button', { name: '+', exact: true }).click();
    await page.getByRole('button', { name: '+', exact: true }).click();
    await page.getByRole('button', { name: 'Log It' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('enforces score limits with buttons', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    const minusButton = page.getByRole('button', { name: '-', exact: true });
    const plusButton = page.getByRole('button', { name: '+', exact: true });

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

    await expect(page).toHaveURL('/');
  });

  test('back button returns to game page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');
    await page.getByRole('link', { name: 'Back to Scoreboard' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('penalty selection disables score buttons and shows penalty score', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    const minusButton = page.getByRole('button', { name: '-', exact: true });
    const plusButton = page.getByRole('button', { name: '+', exact: true });

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
