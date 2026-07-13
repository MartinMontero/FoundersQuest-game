// e2e/storage-degraded.spec.ts — the storage ladder's honest fallback (canon
// 02): with localStorage blocked (a throwing shim installed before any app
// code runs), the DegradedBanner shows the src/strings copy and the game stays
// playable in memory — one full inscribed answer, keyboard only.

import { expect, test } from '@playwright/test'
import { UI } from '../src/strings'
import {
  inscribe,
  questionText,
  recordRun,
  shot,
  tabToChip,
  waitForWorldReady,
} from './helpers'

const STORY =
  'I watched a shop owner copy the same stock count into three notebooks before opening.'

test.describe.configure({ timeout: 120_000 })

test('storage degraded: throwing localStorage → honest banner, still playable in memory', async ({ page }) => {
  const log = recordRun(page)
  // the shim: even ACCESSING window.localStorage throws (sandboxed-iframe class
  // of failure) — installed in the context before any document script runs
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('e2e: storage disabled by degraded-mode shim')
      },
    })
  })

  await page.goto('/')
  await waitForWorldReady(page)

  // the shim really blocks storage in this page
  expect(
    await page.evaluate(() => {
      try {
        void window.localStorage
        return false
      } catch {
        return true
      }
    }),
  ).toBe(true)

  // the honest banner, canon-derived copy from src/strings, verbatim
  const banner = page.getByTestId('degraded-banner')
  await expect(banner).toBeVisible()
  expect(await banner.textContent()).toBe(UI.banner.degraded)
  await shot(page, 'degraded-banner')

  // the naming card also works in memory mode: skip it (seed can't apply here —
  // localStorage throws), adopting the default name, then the card closes
  await page.getByTestId('founder-name-skip').press('Enter')
  await expect(page.getByTestId('founder-naming')).toBeHidden()

  // a fresh-memory session IS a first run: the First Light invitation offers
  // itself (correctly — nothing persisted says otherwise). Skip it, in memory.
  await page.getByTestId('opening-skip').press('Enter')
  await expect(page.getByTestId('opening-invitation')).toBeHidden()

  // still playable: kneel at the threshold shrine and inscribe one answer.
  // A skipper's first kneel raises the one-time re-entry offer (by design) —
  // declining proceeds straight into the trance, like any player who skipped.
  await tabToChip(page, questionText('s1-th'))
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('reentry-decline')).toBeVisible()
  await page.getByTestId('reentry-decline').press('Enter')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await page.getByTestId('input-text').pressSequentially(STORY)
  await inscribe(page, 'input-text')

  // the answer landed in the in-memory store: first-run hint gone…
  await expect(page.getByTestId('onboarding-hint')).toBeHidden()
  // …and re-kneeling shows the inscribed text read back from that store
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('input-text')).toHaveValue(STORY)
  await shot(page, 'degraded-inscribed')
  await page.keyboard.press('Escape')

  expect(log.pageErrors).toEqual([])
  expect(log.consoleErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
