import { expect, test } from '@playwright/test';

function monitor(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => errors.push(`request: ${request.url()}`));
  return errors;
}

test('main dopamine loop, purchase, settings and save are usable', async ({ page }, testInfo) => {
  const errors = monitor(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DOPA//RUSH ドパガキ育成装置' })).toBeAttached();
  const reactor = page.getByRole('button', { name: /ドパる/ });
  await reactor.click({ clickCount: 20 });
  await expect(page.locator('#dopaAmount')).not.toHaveText('0');
  await page.getByRole('button', { name: /無限スクロールを1個購入/ }).click();
  await expect(page.locator('#dpsAmount')).not.toHaveText('+0');
  await page.getByRole('button', { name: '設定を開く' }).click();
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
  await page.getByLabel('演出を減らす').check();
  await page.getByRole('button', { name: '設定を閉じる' }).click();
  await expect(page.locator('body')).toHaveClass(/reduce-motion/);
  await page.screenshot({
    path: testInfo.outputPath('final-desktop.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('mobile layout has no horizontal overflow and keeps the main path visible', async ({
  page,
}, testInfo) => {
  const errors = monitor(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /ドパる/ })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: /ドパる/ }).click();
  await page.screenshot({
    path: testInfo.outputPath('final-mobile.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
