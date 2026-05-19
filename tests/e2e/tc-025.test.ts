import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = 'http://localhost:3000';

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

test.describe('TC-025: Homepage — FAQ items ordered by order field ascending', () => {
  test('TC-025 FAQ items appear in ascending order on homepage', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Clear existing FAQs
    const existing = await convexQuery('faqs:listFaqs', {}) as FaqItem[];
    if (existing.length > 0) {
      await convexMutation('testPurchase:deleteAllFaqs', {});
      console.log(`TC-025 setup: deleted ${existing.length} existing FAQ item(s)`);
    }

    // Step 2: Seed three FAQ items with order values 2, 1, 3 (out of sequence)
    await convexMutation('faqs:createFaq', {
      question: 'FAQ Order Two',
      answer: 'This is order 2',
      order: 2,
    });
    await convexMutation('faqs:createFaq', {
      question: 'FAQ Order One',
      answer: 'This is order 1',
      order: 1,
    });
    await convexMutation('faqs:createFaq', {
      question: 'FAQ Order Three',
      answer: 'This is order 3',
      order: 3,
    });
    console.log('TC-025 setup: seeded 3 FAQ items with orders 2, 1, 3');

    // Step 3: Load homepage
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Screenshot as evidence
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-025-faq-order.png'),
      fullPage: true,
    });

    // Step 4: Assert FAQ items are present and in ascending order
    const faqHeadings = page.locator('h3').filter({ hasText: /^FAQ Order/ });
    await expect(faqHeadings).toHaveCount(3, { timeout: 15_000 });

    const texts = await faqHeadings.allTextContents();
    console.log('TC-025 evidence: FAQ item order in DOM:', texts);

    expect(texts[0]).toBe('FAQ Order One');
    expect(texts[1]).toBe('FAQ Order Two');
    expect(texts[2]).toBe('FAQ Order Three');

    console.log('TC-025 PASS: FAQ items appear in ascending order (order=1 first, order=2 second, order=3 third)');

    // Cleanup
    await convexMutation('testPurchase:deleteAllFaqs', {});
    console.log('TC-025 cleanup: deleted test FAQ items');
  });
});
