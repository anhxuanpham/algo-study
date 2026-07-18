import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const lessonPath = '/content-preview/arrays-basics-01-two-pointers/';

test('reviewer index links to a noindex canonical lesson preview', async ({ page }) => {
  await page.goto('/content-preview/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nội dung đang được review');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('[data-pagefind-body]')).toHaveCount(0);

  await page.getByRole('link', { name: 'Hai con trỏ trên mảng tăng dần' }).click();
  await expect(page).toHaveURL(lessonPath);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hai con trỏ trên mảng tăng dần',
  );
  await expect(page.getByText('review', { exact: true })).toBeVisible();
  await expect(page.getByText(/Mảng và pattern hai con trỏ/)).toBeVisible();
  await expect(page.getByText('Canonical ID:')).toContainText('arrays-basics-01-two-pointers');
  await expect(page.getByRole('heading', { name: 'Sau bài này, bạn có thể' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('[data-pagefind-body]')).toHaveCount(0);
});

test('lesson reviewer preview has no detectable wcag a/aa violations', async ({ page }) => {
  await page.goto(lessonPath);

  const lightResults = await scanAccessibility(page);
  expect(lightResults.violations).toEqual([]);

  await page.getByRole('button', { name: 'Giao diện: Tối' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await waitForTransitions(page);

  const darkResults = await scanAccessibility(page);
  expect(darkResults.violations).toEqual([]);
});

test('lesson reviewer preview remains readable without javascript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(lessonPath);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hai con trỏ trên mảng tăng dần',
  );
  await expect(page.getByRole('heading', { name: 'Sau bài này, bạn có thể' })).toBeVisible();
  await expect(page.getByText('Tìm tổng 11 trong [1, 2, 4, 7, 9]')).toBeVisible();
  await context.close();
});

test('lesson reviewer preview reflows at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(lessonPath);

  const curriculum = page.getByText('Chương trình học', { exact: true });
  await expect(curriculum).toBeVisible();
  await curriculum.click();
  await expect(
    page.getByRole('navigation', { name: 'Chương trình học trên thiết bị nhỏ' }),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test('reviewer preview routes stay out of sitemap and Pagefind', async ({ page, request }) => {
  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain('/content-preview/');

  await page.goto('/');
  const resultUrls = await page.evaluate(async () => {
    const pagefindPath = '/pagefind/pagefind.js';
    const pagefind = await import(pagefindPath);
    await pagefind.init();
    const results = await pagefind.search('Hai con trỏ trên mảng tăng dần');
    return Promise.all(
      results.results.map(
        async (result: { data(): Promise<{ url: string }> }) => (await result.data()).url,
      ),
    );
  });
  expect(resultUrls.every((url) => !url.startsWith('/content-preview/'))).toBe(true);
});

function scanAccessibility(page: Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
}

async function waitForTransitions(page: Page) {
  await page.evaluate(async () => {
    const transitions = document
      .getAnimations()
      .filter((animation) => animation instanceof CSSTransition);
    await Promise.allSettled(transitions.map((transition) => transition.finished));
  });
}
