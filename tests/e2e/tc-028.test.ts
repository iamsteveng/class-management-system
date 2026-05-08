import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

const TEST_QUESTION = 'TC-028 What is the editable test FAQ question?';
const TEST_ANSWER_ORIGINAL = 'TC-028 Original answer text before edit.';
const TEST_ANSWER_UPDATED = 'TC-028 Updated answer text after edit by super admin.';
const TEST_ORDER = 998;

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

test.describe('TC-028: Admin FAQ — super admin can edit existing FAQ item', () => {
  test.beforeAll(async () => {
    // Ensure a known FAQ item exists for editing
    const faqs = await convexQuery('faqs:listFaqs', {}) as Array<{ _id: string; question: string }>;
    const exists = faqs.some((f) => f.question === TEST_QUESTION);
    if (!exists) {
      await convexMutation('faqs:createFaq', {
        question: TEST_QUESTION,
        answer: TEST_ANSWER_ORIGINAL,
        order: TEST_ORDER,
      });
      console.log('TC-028 setup: created test FAQ item');
    }
  });

  test.afterAll(async () => {
    // Cleanup: remove any FAQs with TC-028 question
    const faqs = await convexQuery('faqs:listFaqs', {}) as Array<{ _id: string; question: string }>;
    const testItems = faqs.filter((f) => f.question === TEST_QUESTION);
    if (testItems.length > 0) {
      await convexMutation('testPurchase:deleteAllFaqs', {});
      console.log('TC-028 cleanup: deleted all FAQs (test item was present)');
    }
  });

  test('TC-028 super admin can edit an existing FAQ item via admin UI', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Log in as super admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
    console.log('TC-028: logged in as super admin');

    // Step 2: Navigate to /admin/faq
    await page.goto(`${BASE_URL}/admin/faq`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    console.log('TC-028: navigated to /admin/faq');

    // Step 3: Locate the FAQ item card and click its "Edit" button
    const faqCard = page.locator('div.rounded-xl').filter({ hasText: TEST_QUESTION });
    await expect(faqCard).toBeVisible({ timeout: 15_000 });

    const editButton = faqCard.getByRole('button', { name: 'Edit' });
    await expect(editButton).toBeVisible({ timeout: 10_000 });
    await editButton.click();
    console.log('TC-028: clicked Edit on the test FAQ item');

    // Step 4: Wait for edit form to appear and update the answer
    const answerTextarea = page.locator('textarea[name="answer"]');
    await expect(answerTextarea).toBeVisible({ timeout: 10_000 });
    await answerTextarea.fill(TEST_ANSWER_UPDATED);
    console.log('TC-028: updated answer text in edit form');

    // Step 5: Submit the edit form
    await page.getByRole('button', { name: 'Save' }).click();

    // Step 6: Wait for redirect to /admin/faq with success message
    await page.waitForURL(/\/admin\/faq/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const successMsg = page.locator('text=FAQ updated successfully');
    await expect(successMsg).toBeVisible({ timeout: 15_000 });
    console.log('TC-028: success message visible after updating FAQ');

    // Step 7: Verify updated answer is shown in admin FAQ list
    const updatedAnswer = page.locator(`text=${TEST_ANSWER_UPDATED}`);
    await expect(updatedAnswer).toBeVisible({ timeout: 15_000 });
    console.log('TC-028: updated answer text visible in admin FAQ list');

    // Screenshot of updated admin FAQ list
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-028-admin-faq-list.png'),
      fullPage: true,
    });
    console.log('TC-028 evidence: screenshot saved — tc-028-admin-faq-list.png');

    // Step 8: Verify updated answer is visible on the homepage FAQ section
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    const homepageFaqAnswer = page.locator(`text=${TEST_ANSWER_UPDATED}`);
    await expect(homepageFaqAnswer).toBeVisible({ timeout: 15_000 });
    console.log('TC-028: updated answer visible on homepage FAQ section');

    // Screenshot of homepage showing the updated FAQ
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-028-homepage-faq.png'),
      fullPage: true,
    });
    console.log('TC-028 evidence: screenshot saved — tc-028-homepage-faq.png');

    console.log('TC-028 PASS: super admin successfully edited FAQ item, updated answer visible in admin list and on homepage');
  });
});
