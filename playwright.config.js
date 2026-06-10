import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // Tests run against the production build served under the GitHub Pages
    // base path, so base-path regressions are caught too
    baseURL: 'http://localhost:4173/WebTerminal/',
    trace: 'on-first-retry',
  },
  projects: [
    // Existing desktop suite, unchanged (default desktop chromium)
    { name: 'desktop', testIgnore: /mobile\.spec\.js/ },
    {
      // Mobile device emulation: sets isMobile, hasTouch, mobile viewport
      // and a coarse pointer — which is what gates the KeyBar/chips UI
      name: 'mobile',
      testMatch: /mobile\.spec\.js/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/WebTerminal/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
