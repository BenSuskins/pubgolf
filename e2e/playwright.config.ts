import { defineConfig, devices } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../apps/backend && ../../gradlew bootRun --args="--spring.profiles.active=e2e"',
      url: `${BACKEND_URL}/actuator/health`,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../apps/frontend && NEXT_PUBLIC_API_URL=http://localhost:8080 bun run dev',
      url: FRONTEND_URL,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
