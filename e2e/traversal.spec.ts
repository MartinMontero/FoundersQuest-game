// e2e/traversal.spec.ts — the 8-world spine's backbone: the founder walks World 1
// → 8 through the onward path portals and back through a back portal, the HUD
// banner tracks the world, a shrine in a later world writes answers[sN], and a
// reload resumes the world you were in (currentStage persists under its own key,
// never inside founders-quest:v3). Keyboard only; zero Anthropic calls.

import { expect, test } from '@playwright/test'
import { STAGES } from '../src/strings'
import { recordRun, seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 240_000 })

function worldName(stage: number): string {
  const s = STAGES.find((st) => st.stage === stage)
  if (s === undefined) throw new Error(`no stage ${stage}`)
  return s.world
}

test('traversal: World 1 → 8 and back, a later-world shrine writes its answers, reload resumes', async ({ page }) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.goto('/')
  await waitForWorldReady(page)

  const banner = page.getByTestId('stage-banner')
  await expect(banner).toContainText(worldName(1)) // Swirling Nebula

  // walk onward through every world; the banner must land on each in turn.
  // Navigate by the portal's exact interactable id (deterministic — immune to
  // the drei <Html> chip label lag at the low FPS of a headless container).
  for (let s = 2; s <= STAGES.length; s += 1) {
    await tabToTarget(page, `portal-${s - 1}-onward`)
    await page.keyboard.press('KeyE')
    // entering an act's far side (W3/W6/W8) meets its Act Gate; a pure-traversal
    // run leaves every bar unmet, so cross with a written override reason
    if (s === 3 || s === 6 || s === 8) {
      await expect(page.getByTestId('gate-panel')).toBeVisible()
      await page.getByTestId('gate-reason').fill(`crossing to ${worldName(s)} for the traversal check`)
      await page.getByTestId('gate-cross').press('Enter')
      await expect(page.getByTestId('gate-panel')).toBeHidden()
    }
    await expect(banner).toContainText(worldName(s))
  }
  await expect(banner).toContainText(worldName(STAGES.length)) // The Rocket (World 8)

  // answer a prose shrine in World 8 → writes the exact 02 key answers.s8['s8-l4']
  await tabToTarget(page, 's8-l4')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  const ANSWER = 'Yes — with eyes open and the thread sealed.'
  await page.getByTestId('input-text').fill(ANSWER)
  await page.getByTestId('input-text').press('Control+Enter')
  await expect(page.getByTestId('trance-panel')).toBeHidden()
  const saved = await page.evaluate(() => {
    const raw = window.localStorage.getItem('founders-quest:v3')
    return raw === null ? null : (JSON.parse(raw) as { answers?: Record<string, Record<string, unknown>> }).answers?.['s8']?.['s8-l4']
  })
  expect(saved).toEqual({ text: ANSWER })

  // walk back one world (World 8 → World 7 · The Bridge)
  await tabToTarget(page, 'portal-8-back')
  await page.keyboard.press('KeyE')
  await expect(banner).toContainText(worldName(7))

  // reload resumes the world you were in — currentStage persists under its own key
  await page.reload()
  await waitForWorldReady(page)
  await expect(banner).toContainText(worldName(7))

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([]) // the spine makes ZERO Anthropic calls
})
