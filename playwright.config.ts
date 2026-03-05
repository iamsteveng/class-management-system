import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'https://class-management-system-teal.vercel.app',
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
