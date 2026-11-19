import { existsSync } from 'node:fs';

import { defineConfig } from '@playwright/test';

/**
 * Real-GL frame harness. Runs against `vite preview` of the production build, which must be
 * built with the Pages base so nested hub routes resolve their assets:
 *
 *   VITE_BASE=/weeks_on_fire/ npm run build && npm run test:e2e
 *
 * CI does exactly that in the Pages build job (see .github/workflows/deploy-pages.yml).
 */
const PORT = 4173;
const BASE_PATH = '/weeks_on_fire/';

if (!existsSync('dist/index.html')) {
  throw new Error(
    'e2e needs a production build in dist/. Run: VITE_BASE=/weeks_on_fire/ npm run build',
  );
}

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  // No retries: the film clock is paused for every frame, so a flaky frame is a real signal.
  retries: 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list']],
  outputDir: 'test-results',
  use: {
    // Trailing slash matters: specs navigate with relative URLs under the Pages base.
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    // Pinned so the canvas (a 16:9 box in the hub's 420px player column) is the same size on
    // every machine; GL lines are 1px wide, so canvas size changes frame brightness.
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    trace: 'off',
    launchOptions: {
      // Software GL on purpose, so a laptop GPU and a CI runner render the same frame.
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npx vite preview --base ${BASE_PATH} --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
