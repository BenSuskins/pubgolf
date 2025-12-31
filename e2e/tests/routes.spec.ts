import { test, expect } from '@playwright/test';

test.describe('Routes on How To Play', () => {
  test('displays routes table from backend', async ({ page }) => {
    await page.goto('/how-to-play');

    await expect(page.getByRole('heading', { name: /The Course/i })).toBeVisible();

    await expect(page.getByText('Tequila')).toBeVisible();
    await expect(page.getByText('Sambuca')).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Route A' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Route B' })).toBeVisible();
  });

  test('displays all 9 holes', async ({ page }) => {
    await page.goto('/how-to-play');

    const table = page.locator('table');
    for (let i = 1; i <= 9; i++) {
      await expect(
        table.getByRole('cell', { name: String(i), exact: true }).first()
      ).toBeVisible();
    }
  });

  test('displays par values for each hole', async ({ page }) => {
    await page.goto('/how-to-play');

    await expect(page.getByRole('columnheader', { name: 'Par' })).toBeVisible();
  });

  test('displays drinks for last hole', async ({ page }) => {
    await page.goto('/how-to-play');

    await expect(page.getByText('VK')).toBeVisible();
    await expect(page.getByText('Smirnoff Ice')).toBeVisible();
  });
});
