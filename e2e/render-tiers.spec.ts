import { expect, test } from '@playwright/test'
import { WORLD_COPY } from '../src/strings'

// A phone-like context (small viewport, touch, high DPR) — explicit props
// rather than a device preset, which would drag in defaultBrowserType and
// force a new worker inside a describe group.
const PHONE = { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, hasTouch: true }

// The Gate-2b crash shipped because e2e only ever ran the automation render
// tier (perf.ts gated on navigator.webdriver), so the effect stack + DPR that
// real devices get was NEVER exercised. These specs force each SHIPPING tier
// via the ?render= override and prove it boots to first frame with no console
// errors and no error boundary. A mobile viewport must also AUTO-DETECT the
// constrained tier — the root-cause logic (a phone was handed desktop settings).

async function bootsCleanly(page: import('@playwright/test').Page, path: string): Promise<void> {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => pageErrors.push(String(e)))

  await page.goto(path)
  // the world reaches its first rendered frame → the loading line leaves
  await expect(page.getByTestId('world-loading')).toBeHidden({ timeout: 60_000 })
  // the error boundary never shows
  await expect(page.getByTestId('app-crashed')).toBeHidden()
  expect(pageErrors, `page errors on ${path}`).toEqual([])
  expect(consoleErrors, `console errors on ${path}`).toEqual([])
}

test.describe('render tiers — every shipping path boots', () => {
  test('full tier (desktop GPU path: Bloom/Vignette + dpr 1.5) boots clean', async ({ page }) => {
    await bootsCleanly(page, '/?render=full')
    expect(await page.evaluate(() => (window as Window & { __fq_tier?: string }).__fq_tier)).toBe(
      'full',
    )
  })

  test.describe('on a phone viewport', () => {
    test.use(PHONE)

    test('constrained tier (forced) boots clean', async ({ page }) => {
      await bootsCleanly(page, '/?render=constrained')
    })

    test('AUTO-DETECTS constrained — a phone is never handed the desktop tier', async ({
      page,
    }) => {
      // a real phone does not set navigator.webdriver; without this the detector
      // correctly short-circuits to 'automation' under Playwright and the mobile
      // branch (the logic under test) never runs.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
      })
      await page.goto('/')
      await expect(page.getByTestId('world-loading')).toBeHidden({ timeout: 60_000 })
      const tier = await page.evaluate(
        () => (window as Window & { __fq_tier?: string }).__fq_tier,
      )
      expect(tier, 'coarse-pointer phone must route to the safe tier').toBe('constrained')
      await expect(page.getByTestId('app-crashed')).toBeHidden()
    })
  })

  test('the app title still renders regardless of tier', async ({ page }) => {
    await page.goto('/?render=constrained')
    await expect(page.getByRole('heading', { name: WORLD_COPY.appTitle })).toBeVisible()
  })
})
