import { test, expect } from '../fixtures/test-fixtures';

test.describe('Submit Score', () => {
  test('submits a score successfully', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/game');
    await page.getByRole('link', { name: 'Submit Score' }).click();

    await expect(page).toHaveURL('/submit-score');

    await page.locator('#hole').selectOption('3');
    await page.locator('#score').fill('2');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('shows validation error for invalid score', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    await page.locator('#hole').selectOption('1');
    await page.locator('#score').fill('15');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText(/between -10 and 10/i)).toBeVisible();
  });

  test('redirects to home if no session', async ({ page }) => {
    await page.goto('/submit-score');

    await expect(page).toHaveURL('/');
  });

  test('cancel returns to game page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');
    await page.getByRole('link', { name: 'Cancel' }).click();

    await expect(page).toHaveURL('/game');
  });
});
