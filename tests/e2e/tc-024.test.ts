import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  order: number;
};

async function convexQuery(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

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

test.describe('TC-024: Homepage — FAQ section hidden when no items exist', () => {
  test('TC-024 FAQ section heading and container are not rendered when no FAQ items exist', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Ensure no FAQ items are in the database
    const faqs = await convexQuery('faqs:listFaqs', {}) as FaqItem[];
    console.log(`TC-024 setup: found ${faqs.length} FAQ item(s) in database`);

    if (faqs.length > 0) {
      // Delete all existing FAQs using the test helper mutation
      const deleted = await convexMutation('testPurchase:deleteAllFaqs', {}) as number;
      console.log(`TC-024 setup: deleted ${deleted} existing FAQ item(s)`);
    }

    // Step 2: Load homepage
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Screenshot as evidence
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-024-no-faq-section.png'),
      fullPage: true,
    });

    // Step 3: Assert FAQ section heading is NOT visible
    const faqHeading = page.getByRole('heading', { name: /Frequently Asked Questions/i });
    await expect(faqHeading).not.toBeVisible({ timeout: 10_000 });

    // Step 4: Assert FAQ container is not rendered
    // The homepage renders a section with id or data attribute when FAQs exist;
    // verify no element containing "Frequently Asked Questions" text is present
    const faqText = page.getByText(/Frequently Asked Questions/i);
    await expect(faqText).not.toBeVisible({ timeout: 5_000 });

    console.log('TC-024 evidence: FAQ section heading and container are not rendered when no FAQ items exist');
  });
});
