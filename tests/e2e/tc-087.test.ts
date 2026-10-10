import { test, expect } from '@playwright/test';

// TC-087: /api/classes is used outside this site (e.g. the app), so every Class's image
// comes back as a full URL, never a site path.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('TC-087 /api/classes returns full image URLs', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/classes`);
  expect(res.status()).toBe(200);
  const { classes } = (await res.json()) as { classes: Array<{ class_id: string; image_url?: string }> };
  const withImages = classes.filter((c) => c.image_url);
  expect(withImages.length).toBeGreaterThan(0);
  for (const c of withImages) {
    expect(c.image_url, c.class_id).toMatch(/^https:\/\//);
  }
});
