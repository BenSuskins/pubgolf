import { test, expect } from '../fixtures/test-fixtures';
import type { Page } from '@playwright/test';

async function openHostPanel(page: Page, session: { gameCode: string; playerId: string; playerName: string }) {
  await page.goto('/');
  await page.evaluate((stored) => {
    localStorage.setItem('gameCode', stored.gameCode);
    localStorage.setItem('playerId', stored.playerId);
    localStorage.setItem('playerName', stored.playerName);
  }, session);
  await page.goto(`/game/${session.gameCode}/host`);
  await expect(page.getByText('Host Mode')).toBeVisible();
}

test.describe('Host Panel', () => {
  test('opens on the Events tab, not course setup', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('EventsHost');
    await openHostPanel(page, hostSession);

    await expect(page.getByText('Trigger an Event')).toBeVisible();
    await expect(page.getByText('Drinks & Pars')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Events' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('triggers a custom event from the sheet and ends it', async ({
    page,
    createGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('CustomEventHost');
    await openHostPanel(page, hostSession);

    await page.getByRole('button', { name: 'Custom Event' }).click();
    await expect(page.getByRole('heading', { name: 'Custom Event' })).toBeVisible();

    await page.getByLabel('Event name').fill('Karaoke Break');
    await page.getByLabel('Description (optional)').fill('Sing something');
    await page.getByRole('button', { name: 'TRIGGER NOW' }).click();

    // The sheet closes and the event becomes the active banner.
    await expect(page.getByRole('heading', { name: 'Custom Event' })).toHaveCount(0);
    await expect(page.getByText('Active Event')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Karaoke Break' })).toBeVisible();

    // The banner is game-wide state, so it follows the host onto the Course tab.
    await page.getByRole('button', { name: 'Course' }).click();
    await expect(page.getByRole('heading', { name: 'Karaoke Break' })).toBeVisible();

    await page.getByRole('button', { name: 'End Event' }).click();
    await expect(page.getByText('Active Event')).toHaveCount(0);
  });

  test('dismisses the custom event sheet without triggering', async ({
    page,
    createGameViaApi,
  }) => {
    const hostSession = await createGameViaApi('CancelSheetHost');
    await openHostPanel(page, hostSession);

    await page.getByRole('button', { name: 'Custom Event' }).click();
    await page.getByLabel('Event name').fill('Never fired');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Custom Event' })).toHaveCount(0);
    await expect(page.getByText('Active Event')).toHaveCount(0);
  });

  test('activates a preset event and locks the rest', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('PresetHost');
    await openHostPanel(page, hostSession);

    await page.getByRole('button', { name: 'Activate' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Activate' }).click();

    await expect(page.getByText('Active Event')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End Event' })).toBeVisible();
    // Only one event can run at a time, so the other ways to start one are shut off.
    await expect(page.getByRole('button', { name: 'Custom Event' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Activate' }).first()).toBeDisabled();
  });

  test('links to the route builder from the Course tab', async ({ page, createGameViaApi }) => {
    const hostSession = await createGameViaApi('RouteCardHost');
    await openHostPanel(page, hostSession);

    await page.getByRole('button', { name: 'Course' }).click();

    await expect(page.getByRole('heading', { name: 'Route Map' })).toBeVisible();
    await expect(page.getByText('No route mapped yet')).toBeVisible();
    await page.getByRole('link', { name: 'Set up →' }).click();

    await expect(page).toHaveURL(/\/game\/route/);
  });
});
