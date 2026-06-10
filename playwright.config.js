import { defineConfig } from '@playwright/test'

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
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/WebTerminal/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
