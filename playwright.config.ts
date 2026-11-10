import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // In CI: fail on a stray test.only, keep an HTML report for failures, and never retry — a flaky test gets fixed (PLAYBOOK).
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', locale: 'he-IL', ...devices['Desktop Chrome'] },
  webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
})
