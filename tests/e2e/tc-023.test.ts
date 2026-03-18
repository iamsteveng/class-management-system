import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

async function convexMutation(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-023: Homepage — FAQ section visible when items exist', () => {
  test('TC-023 FAQ section heading and at least one question/answer visible on homepage', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Seed a FAQ item
    const faqQuestion = `TC023 Question ${testId}`;
    const faqAnswer = `TC023 Answer ${testId}`;

    await convexMutation('faqs:createFaq', {
      question: faqQuestion,
      answer: faqAnswer,
      order: 9999,
    });

    console.log(`TC-023 setup: seeded FAQ question="${faqQuestion}"`);

    // Step 2: Load homepage
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Screenshot as evidence
    await page.screenshot({ path: path.join(screenshotDir, 'tc-023-faq-section.png'), fullPage: true });

    // Step 3: Assert FAQ section heading is visible
    const faqHeading = page.getByRole('heading', { name: /Frequently Asked Questions/i });
    await expect(faqHeading).toBeVisible({ timeout: 15_000 });

    // Step 4: Assert at least one FAQ question and answer is displayed
    const faqQuestion1 = page.getByText(faqQuestion);
    await expect(faqQuestion1).toBeVisible({ timeout: 10_000 });

    const faqAnswer1 = page.getByText(faqAnswer);
    await expect(faqAnswer1).toBeVisible({ timeout: 10_000 });

    console.log('TC-023 evidence: FAQ section heading and seeded FAQ item are visible on homepage');
  });
});
