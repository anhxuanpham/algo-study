import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
const homeTypography = await page.evaluate(async () => {
  const heading = document.querySelector('h1');
  const body = document.body;
  if (!heading) throw new Error('Home heading was not found');
  const headingStyle = getComputedStyle(heading);
  const bodyStyle = getComputedStyle(body);
  const displayFaces = await document.fonts.load(
    `${headingStyle.fontWeight} ${headingStyle.fontSize} "Bricolage Grotesque Variable"`,
    heading.textContent ?? '',
  );
  const bodyFaces = await document.fonts.load(
    `${bodyStyle.fontWeight} ${bodyStyle.fontSize} "Be Vietnam Pro"`,
    body.textContent?.slice(0, 200) ?? '',
  );
  return {
    headingFamily: headingStyle.fontFamily,
    headingWeight: headingStyle.fontWeight,
    bodyFamily: bodyStyle.fontFamily,
    displayFacesLoaded: displayFaces.length,
    bodyFacesLoaded: bodyFaces.length,
  };
});
await page.screenshot({ path: '/tmp/algo-home-light.png', fullPage: true });

await page.goto('http://127.0.0.1:4321/content-preview/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/algo-content-preview-light.png', fullPage: true });

await page.setViewportSize({ width: 320, height: 800 });
await page.goto('http://127.0.0.1:4321/foundation-preview/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Giao diện: Tối' }).click();
await page.getByText('Chương trình học', { exact: true }).click();
const mobile = await page.evaluate(() => ({
  documentWidth: document.documentElement.scrollWidth,
  viewportWidth: document.documentElement.clientWidth,
  theme: document.documentElement.dataset.theme,
  bodyFamily: getComputedStyle(document.body).fontFamily,
  headingFamily: getComputedStyle(document.querySelector('h1')).fontFamily,
}));
await page.screenshot({ path: '/tmp/algo-foundation-dark-320.png', fullPage: true });

console.log(JSON.stringify({ homeTypography, mobile, consoleErrors }, null, 2));
await browser.close();
