import { defineConfig, devices } from '@playwright/test'

// Chromium comes pre-baked at PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
// (revision 1194 = @playwright/test 1.56.x). NEVER run `playwright install`
// in the remote container — browser CDNs are egress-blocked. CI installs its own.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // browser e2e under load (heavy WebGL + the CSP spec's extra servers) can flake
  // a strict "zero console errors" assertion; one retry absorbs contention in CI
  // without masking a real, repeatable failure.
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    port: 5199,
    reuseExistingServer: !process.env.CI,
  },
})
