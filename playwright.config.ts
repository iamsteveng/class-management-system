import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.spec.ts', '**/tests/e2e/*.test.ts'],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'https://class-management-system-teal.vercel.app',
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
