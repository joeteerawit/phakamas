import { defineConfig, devices } from '@playwright/test'

// E2E_PORT lets parallel worktrees run e2e without sharing a preview server.
const PORT = Number(process.env.E2E_PORT ?? 4173)
const BASE_URL = `http://localhost:${PORT}`

/**
 * E2E runs headless against `vite preview`, so `dist/` must exist first.
 * `turbo run test:e2e` builds before running; standalone, run `vite build` first.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    headless: true,
    locale: 'th-TH',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI && !process.env.E2E_PORT,
    timeout: 60_000,
  },
})
