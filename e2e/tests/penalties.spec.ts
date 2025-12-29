import { test, expect } from '../fixtures/test-fixtures';

test.describe('Penalties', () => {
  test('displays penalty selection buttons on submit score page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    await expect(page.getByRole('button', { name: 'None' })).toBeVisible();
    await expect(page.getByRole('button', { name: /\+5/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /\+10/ })).toBeVisible();
  });

  test('submits a score with SKIP penalty', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    await page.locator('#hole').selectOption('3');
    await page.getByRole('button', { name: /\+5/ }).click();

    await expect(page.getByText(/Skip a drink/i)).toBeVisible();

    await page.getByRole('button', { name: 'Log It' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('submits a score with CHUNDER penalty', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    await page.locator('#hole').selectOption('5');
    await page.getByRole('button', { name: /\+10/ }).click();

    await expect(page.getByText(/Tactical chunder/i)).toBeVisible();

    await page.getByRole('button', { name: 'Log It' }).click();

    await expect(page).toHaveURL('/game');
  });

  test('disables sips input when penalty is selected', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    await page.getByRole('button', { name: /\+5/ }).click();

    await expect(page.locator('#score')).toBeDisabled();
  });

  test('re-enables sips input when None is selected after penalty', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/submit-score');

    await page.getByRole('button', { name: /\+5/ }).click();
    await expect(page.locator('#score')).toBeDisabled();

    await page.getByRole('button', { name: 'None' }).click();
    await expect(page.locator('#score')).not.toBeDisabled();
  });
});
