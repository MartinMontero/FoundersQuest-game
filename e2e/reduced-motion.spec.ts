// e2e/reduced-motion.spec.ts — prefers-reduced-motion honored (game-design §3):
// the trance framing is an instant cut (no dolly wait gates the panel), the
// writing panel opens immediately on kneel, and entering/exiting a trance
// throws nothing. Keyboard only.

import { expect, test } from '@playwright/test'
import { UI, WORLD_COPY } from '../src/strings'
import { questionText, recordRun, shot, tabToChip, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 120_000 })

test('reduced motion: boot, enter and exit a trance — instant panel, no exceptions', async ({ page }, testInfo) => {
  const log = recordRun(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.goto('/')
  await waitForWorldReady(page)
  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  ).toBe(true)
  await expect(page.getByTestId('onboarding-hint')).toBeVisible()
  await shot(page, 'reduced-before')

  // Tab to the threshold shrine, kneel
  await tabToChip(page, questionText('s1-th'))
  await expect(page.getByText(WORLD_COPY.prompts.shrine, { exact: true })).toBeVisible()
  const pressedAt = Date.now()
  await page.keyboard.press('KeyE')
  // no dolly wait: the panel is expected essentially immediately (2 s is the
  // hard ceiling for a headless software-GL container; measured ms annotated)
  await expect(page.getByTestId('trance-panel')).toBeVisible({ timeout: 2000 })
  const openMs = Date.now() - pressedAt
  testInfo.annotations.push({
    type: 'reduced-motion-panel-open-ms',
    description: `${openMs} ms from keypress to visible panel (headless container)`,
  })
  console.log(`[reduced-motion] trance panel visible ${openMs} ms after E`)
  expect(await page.getByTestId('trance-panel').locator('h2').textContent()).toBe(
    questionText('s1-th'),
  )
  await expect(page.getByText(UI.trance.keysHint, { exact: true })).toBeVisible()
  await shot(page, 'reduced-trance-open')

  // Esc — stand up (draft kept); back to roam with no exceptions
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  await expect(page.getByTestId('onboarding-hint')).toBeVisible() // roaming again
  await shot(page, 'reduced-after-exit')

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
