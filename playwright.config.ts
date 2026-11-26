import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }]],
  outputDir: 'artifacts/playwright-results',
  use: {
    baseURL: process.env.REMIND_TEST_URL || 'http://127.0.0.1:3000',
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.REMIND_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] },
    viewport: { width: 1440, height: 1100 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    acceptDownloads: true,
    serviceWorkers: 'allow',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
