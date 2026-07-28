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

test('IGNITE, FLOW, purchase, reduced motion and save are usable', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors = monitor(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RUSH//CORE Signal Incremental' })).toBeAttached();
  await expect(page.locator('body')).not.toContainText(/ドパる|ドパ装置|ドパガキ/);
  await expect(page.locator('#fxCanvas')).toBeAttached();

  const reactor = page.getByRole('button', { name: /IGNITE/ });
  const peakFlow = await reactor.evaluate((button) => {
    for (let index = 0; index < 15; index += 1) button.click();
    return document.getElementById('flowValue').dataset.flow;
  });
  expect(peakFlow).toBe('10.0');
  await expect(page.locator('#dopaAmount')).not.toHaveText('0');
  const smoothSamples = [];
  for (let index = 0; index < 3; index += 1) {
    smoothSamples.push(Number(await page.locator('#dopaAmount').getAttribute('data-value')));
    await page.waitForTimeout(100);
  }
  expect(smoothSamples.at(-1)).toBeGreaterThan(smoothSamples[0]);
  expect(new Set(smoothSamples).size).toBeGreaterThan(1);
  await expect
    .poll(async () => Number(await page.locator('#fxCanvas').getAttribute('data-particle-count')))
    .toBeLessThanOrEqual(160);

  await page.getByRole('button', { name: /TAP RELAYを1個購入/ }).click();
  await expect(page.locator('#dpsAmount')).not.toHaveText('+0');
  await expect(page.locator('#networkSatellites .network-satellite')).toHaveCount(1);
  await expect(page.locator('.reactor-wrap')).toHaveAttribute('data-network-total', '1');
  await expect(page.locator('#networkLevel')).toContainText('N1');
  await expect
    .poll(async () =>
      Number(await page.locator('#networkSatellites').getAttribute('data-pulse-count')),
    )
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: '設定を開く' }).click();
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
  await page.getByLabel('演出を減らす').check();
  await page.getByRole('button', { name: '設定を閉じる' }).click();
  await expect(page.locator('body')).toHaveClass(/reduce-motion/);
  await expect
    .poll(async () => Number(await page.locator('#flowValue').getAttribute('data-flow')))
    .toBe(1);
  await page.screenshot({ path: testInfo.outputPath('final-main.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('responsive layout has no horizontal overflow and keeps the core visible', async ({
  page,
}, testInfo) => {
  const errors = monitor(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /IGNITE/ })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: /IGNITE/ }).click();
  await page.screenshot({ path: testInfo.outputPath('final-responsive.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('crossing a progression threshold opens the kinetic PHASE reveal', async ({
  page,
}, testInfo) => {
  const errors = monitor(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      'dopaRushSave',
      JSON.stringify({
        schemaVersion: 1,
        dopa: 99,
        runTotal: 99,
        allTimeTotal: 99,
        clicks: 99,
        facilities: {},
        upgrades: [],
        achievements: [],
        awakenPoints: 0,
        awakenCount: 0,
        playSeconds: 0,
        settings: { reducedMotion: false, sound: false },
        createdAt: Date.now(),
        savedAt: Date.now(),
      }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: /IGNITE/ }).click();
  await expect(page.locator('#phaseReveal')).toBeVisible();
  await expect(page.locator('#phaseRevealName')).toHaveText('SIGNAL SEEKER');
  await page.screenshot({ path: testInfo.outputPath('final-phase.png'), fullPage: true });
  expect(errors).toEqual([]);
});
