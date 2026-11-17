import { test, expect, type Page } from '@playwright/test';
import { enterDemo } from '../e2e/helpers/app';

// Visual regression baselines for the redesign (Phase 0).
// Runs in demo mode so no Home Assistant is needed. Time is frozen and motion is reduced
// (see playwright.config.ts) to keep the images stable. Update intentionally with:
//   npm run test:visual:update

const PAGES = [
  'overview', 'rooms', 'energy', 'security', 'media', 'system', 'network',
  'mobility', 'health', 'vacuums', 'automations', 'integrations', 'settings',
];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-15T10:00:00'));
  await enterDemo(page);
});

test.describe('pages', () => {
  for (const tab of PAGES) {
    test(`page ${tab}`, async ({ page }) => {
      await page.goto('/' + tab);
      await settle(page);
      await expect(page).toHaveScreenshot(`page-${tab}.png`);
    });
  }
});

test.describe('overlays', () => {
  test('notification drawer', async ({ page }) => {
    await page.goto('/overview');
    await settle(page);
    await page.getByRole('button', { name: /notifications/i }).filter({ visible: true }).first().click();
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('overlay-notifications.png');
  });

  test('mobile navigation sheet', async ({ page }, info) => {
    test.skip(!info.project.name.includes('mobile'), 'mobile only');
    await page.goto('/overview');
    await settle(page);
    await page.getByTitle(/More views and options/i).click();
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('overlay-mobile-nav.png');
  });
});
