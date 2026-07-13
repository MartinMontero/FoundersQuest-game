// e2e/loop.spec.ts — a named loop's toll-portal, driven through the real world.
// The Reality Check (W5→W1) demands one learning line before it loops back: the
// line lands in the trail (type 'loop') and sets lastLoop. "Stay" backs out with
// no record and no travel. Keyboard only; zero Anthropic.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { JOURNEY_STORAGE_KEY } from '../src/state/journey'
import { STAGES } from '../src/strings'
import { recordRun, seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 240_000 })

function worldName(stage: number): string {
  const s = STAGES.find((st) => st.stage === stage)
  if (s === undefined) throw new Error(`no stage ${stage}`)
  return s.world
}

async function readData(page: import('@playwright/test').Page): Promise<QuestData> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
  if (raw === null) throw new Error('founders-quest:v3 not written')
  return JSON.parse(raw) as QuestData
}

test('Loop toll — The Reality Check (W5→W1): a learning line loops back; "Stay" backs out', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.addInitScript(
    ([jk]) => {
      try {
        window.localStorage.setItem(jk as string, '5') // start in World 5 (The Mirror)
      } catch {
        // storage blocked — not this spec's concern
      }
    },
    [JOURNEY_STORAGE_KEY],
  )
  await page.goto('/')
  await waitForWorldReady(page)
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(5)) // The Mirror

  // open the loop toll, then back out with "Stay" — no record, no travel
  await tabToTarget(page, 'portal-5-loop')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('loop-panel')).toBeVisible()
  await expect(page.getByTestId('loop-panel')).toContainText('The Reality Check')
  await expect(page.getByTestId('loop-pay')).toBeDisabled() // needs a learning line
  await page.getByTestId('loop-stay').press('Enter')
  await expect(page.getByTestId('loop-panel')).toBeHidden()
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(5)) // stayed

  // open again, pay the toll with a learning line → loop back to World 1
  await tabToTarget(page, 'portal-5-loop')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('loop-panel')).toBeVisible()
  const learning = 'my sample was all friends — the yeses were politeness, not demand'
  await page.getByTestId('loop-learning').fill(learning)
  await page.getByTestId('loop-pay').press('Enter')
  await expect(page.getByTestId('loop-panel')).toBeHidden()
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(1)) // Swirling Nebula

  const data = await readData(page)
  expect(data.lastLoop).toBe('The Reality Check')
  expect(
    data.trail.some(
      (t) => t.type === 'loop' && t.learning === learning && t.fromId === 's5' && t.toId === 's1',
    ),
  ).toBe(true)
  expect(log.consoleErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
