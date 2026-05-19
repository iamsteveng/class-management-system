import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'tests/e2e/**/*.test.ts', 'tests/integration/**/*.test.ts'],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
