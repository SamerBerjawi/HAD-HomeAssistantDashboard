import os from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const PORT = 3100;
// Throwaway server state for QA runs; override with QA_DATA_DIR. Never the real data/ folder.
const DATA_DIR = process.env.QA_DATA_DIR || path.join(os.tmpdir(), 'had-qa-data');

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };

// Visual regression projects: one per viewport x colour scheme. Baselines live in
// tests/visual/__screenshots__/<project>/ and are committed. They are rendered on macOS
// (font rasterisation differs per OS), so compare them on the same OS only.
const visual = (name: string, viewport: { width: number; height: number }, colorScheme: 'light' | 'dark') => ({
  name: `visual-${name}`,
  testDir: 'tests/visual',
  use: { viewport, colorScheme, reducedMotion: 'reduce' as const },
});

export default defineConfig({
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/pw-results.json' }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  snapshotPathTemplate: 'tests/visual/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: 'desktop', testDir: 'tests/e2e', use: { viewport: DESKTOP } },
    { name: 'mobile', testDir: 'tests/e2e', use: { viewport: MOBILE } },
    visual('desktop-light', DESKTOP, 'light'),
    visual('desktop-dark', DESKTOP, 'dark'),
    visual('mobile-light', MOBILE, 'light'),
    visual('mobile-dark', MOBILE, 'dark'),
  ],
  webServer: {
    command: 'npx tsx server.ts',
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PORT: String(PORT), DATA_DIR, NODE_ENV: 'development', HASS_URL: 'http://127.0.0.1:9', ALLOW_MOCK_TOKENS: 'true' },
  },
});
