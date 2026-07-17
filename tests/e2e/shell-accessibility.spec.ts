import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home renders semantic shell and skip link works', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Đừng học thuộc');
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible();

  const skipLink = page.getByRole('link', { name: 'Bỏ qua điều hướng' });
  await skipLink.focus();
  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('theme control persists a dark preference', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Giao diện: Tối' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('tabs support arrow keys and dialog restores trigger focus', async ({ page }) => {
  await page.goto('/foundation-preview/');

  const invariantTab = page.getByRole('tab', { name: 'Invariant' });
  const complexityTab = page.getByRole('tab', { name: 'Complexity' });
  await invariantTab.focus();
  await invariantTab.press('ArrowRight');
  await expect(complexityTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('O(log n)');

  const trigger = page.getByRole('button', { name: 'Mở dialog mẫu' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('foundation preview has no detectable wcag a/aa violations @a11y', async ({ page }) => {
  await page.goto('/foundation-preview/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('dark theme has no detectable wcag a/aa violations @a11y', async ({ page }) => {
  await page.goto('/foundation-preview/');
  await page.getByRole('button', { name: 'Giao diện: Tối' }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('reduced motion disables skeleton animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/foundation-preview/');
  const durationMs = await page
    .locator('.skeleton span:not(.sr-only)')
    .first()
    .evaluate((element) => {
      const duration = window.getComputedStyle(element).animationDuration;
      return duration.endsWith('ms')
        ? Number.parseFloat(duration)
        : Number.parseFloat(duration) * 1_000;
    });
  expect(durationMs).toBeLessThanOrEqual(0.01);
});

test('lesson remains readable without javascript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/foundation-preview/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Binary search');
  await expect(page.getByText('function binarySearch')).toBeVisible();
  await context.close();
});

test('320px viewport keeps curriculum reachable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/foundation-preview/');

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
