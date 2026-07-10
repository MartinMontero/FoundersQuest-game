// e2e/traversal.spec.ts — the 8-world spine's backbone: the founder walks World 1
// → 8 through the onward path portals and back through a back portal, the HUD
// banner tracks the world, a shrine in a later world writes answers[sN], and a
// reload resumes the world you were in (currentStage persists under its own key,
// never inside founders-quest:v3). Keyboard only; zero Anthropic calls.

import { expect, test } from '@playwright/test'
import { STAGES, WORLD_COPY } from '../src/strings'
import { recordRun, seedFounderName, tabToChip, waitForWorldReady } from './helpers'

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

  // walk onward through every world; the banner must land on each in turn
  for (let s = 2; s <= STAGES.length; s += 1) {
    await tabToChip(page, `${WORLD_COPY.portalOnward} · ${worldName(s)}`)
    await page.keyboard.press('KeyE')
    await expect(banner).toContainText(worldName(s))
  }
  await expect(banner).toContainText(worldName(STAGES.length)) // The Rocket (World 8)

  // answer a prose shrine in World 8 → writes the exact 02 key answers.s8['s8-l4']
  const q = STAGES[7]?.questions.find((x) => x.id === 's8-l4')
  if (q === undefined) throw new Error('s8-l4 missing')
  await tabToChip(page, q.text)
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
  await tabToChip(page, `${WORLD_COPY.portalBack} · ${worldName(7)}`)
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
