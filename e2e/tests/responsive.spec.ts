import { mkdir } from 'node:fs/promises';
import { test, expect, storeSession } from '../fixtures/test-fixtures';

for (const width of [375, 768, 1024, 1440]) {
  test(`public and game layouts fit a ${width}px viewport`, async ({ page, createGameViaApi }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const session = await createGameViaApi('Responsive Host');
    await page.goto('/play');
    await storeSession(page, session);
    await mkdir('../plans/qa', { recursive: true });

    const pages = [
      '/',
      '/play',
      '/how-to-play',
      '/game',
      '/game/rules',
      '/submit-score',
      '/randomise',
      `/game/${session.gameCode}/host`,
      '/game/route',
    ];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
      if (path === '/game') {
        await expect(
          page
            .getByRole('list', { name: 'Leaderboard', exact: true })
            .locator(':scope > li')
            .first()
        ).toHaveCSS('opacity', '1');
      }
      const name = path === '/' ? 'landing' : path.replaceAll('/', '-');
      await page.screenshot({ path: `../plans/qa/${width}-${name}.png`, fullPage: true, animations: 'disabled' });
    }

    await page.goto(`/game/${session.gameCode}/host`);
    await page.getByRole('button', { name: 'Course', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Course', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.getByRole('heading', { name: 'Drinks & Pars' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.screenshot({ path: `../plans/qa/${width}-host-course.png`, fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Events', exact: true }).click();
    await page.getByRole('button', { name: 'Custom Event', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Custom Event' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // A fixed HTTP response keeps the map layout check independent of routing providers.
    await page.route('**/api/v1/games/*/route', async (route) => {
      await route.fulfill({
        json: {
          pubs: Array.from({ length: 9 }, (_, index) => ({
            hole: index + 1,
            name: `Example pub ${index + 1}`,
            latitude: 51.51 + index * 0.001,
            longitude: -0.09 + index * 0.001,
          })),
          route: null,
        },
      });
    });
    const workerResponse = page.waitForResponse(
      (response) =>
        response.url().includes('maplibre-gl-worker') &&
        response.request().resourceType() === 'script'
    );
    await page.goto('/game/map');
    expect((await workerResponse).ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Route', exact: true })).toBeVisible();
    await expect(page.locator('.maplibregl-canvas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.screenshot({ path: `../plans/qa/${width}-map.png`, fullPage: true, animations: 'disabled' });

    await page.goto('/game');
    await page.getByRole('button', { name: 'Invite', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy invite link to clipboard' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}
