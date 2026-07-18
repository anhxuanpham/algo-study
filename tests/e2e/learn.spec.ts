import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const lessonPath = '/learn/lessons/arrays-basics-01-two-pointers/';

test('learn index links to published lesson and problem routes', async ({ page }) => {
  await page.goto('/learn/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Bắt đầu với vertical slice đã publish',
  );
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible();

  await page.getByRole('link', { name: 'Hai con trỏ trên mảng tăng dần' }).first().click();
  await expect(page).toHaveURL(lessonPath);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hai con trỏ trên mảng tăng dần',
  );
  await expect(page.getByText('published', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Luyện tập gắn với bài' })).toBeVisible();
});

test('published lesson is searchable and in sitemap', async ({ page, request }) => {
  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('/learn/');
  expect(sitemapText).toContain('/learn/lessons/arrays-basics-01-two-pointers/');
  expect(sitemapText).not.toContain('/content-preview/');

  await page.goto('/');
  const resultUrls = await page.evaluate(async () => {
    const pagefindPath = '/pagefind/pagefind.js';
    const pagefind = await import(/* @vite-ignore */ pagefindPath);
    await pagefind.init();
    const results = await pagefind.search('Hai con trỏ trên mảng tăng dần');
    return Promise.all(
      results.results.map(
        async (result: { data(): Promise<{ url: string }> }) => (await result.data()).url,
      ),
    );
  });
  expect(resultUrls.some((url) => url.includes('/learn/lessons/'))).toBe(true);
  expect(resultUrls.every((url) => !url.includes('/content-preview/'))).toBe(true);
});

test('published lesson has no detectable wcag a/aa violations', async ({ page }) => {
  await page.goto(lessonPath);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('published lesson remains readable without javascript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(lessonPath);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hai con trỏ trên mảng tăng dần',
  );
  await expect(page.getByText('Tìm tổng 11 trong [1, 2, 4, 7, 9]')).toBeVisible();
  await context.close();
});

test('home primary CTA enters learner surface', async ({ page }: { page: Page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Bắt đầu học' }).click();
  await expect(page).toHaveURL('/learn/');
});
