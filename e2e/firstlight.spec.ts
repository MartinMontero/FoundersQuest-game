// e2e/firstlight.spec.ts — First Light (Mind & Myth A3), driven end to end.
// Test 1 walks all 11 beats and asserts every REAL artifact lands in
// founders-quest:v3: the founder's solution in the Vault, a firstLight-tagged
// guardian with a sealed kill criterion (D-I — s1-l1 untouched), a verbatim E2
// quote linked to it, the first kill resolved by the founder's own admission
// (fixed First-Light XP; Truth denominator untouched), the Chart handed over.
// Test 2 walks the courtesy skip: World 1 opens with the Chart in the HUD, the
// one-time re-entry prompt fires exactly once, and nothing was override-logged.
// Keyboard-only; zero Anthropic.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { recordRun, seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 240_000 })

async function readData(page: import('@playwright/test').Page): Promise<QuestData> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
  if (raw === null) throw new Error('founders-quest:v3 not written')
  return JSON.parse(raw) as QuestData
}

/** press the beat's continue button (it re-renders per step, same testid) */
async function cont(page: import('@playwright/test').Page): Promise<void> {
  await page.getByTestId('opening-continue').press('Enter')
}

test('First Light: the 11 beats produce real artifacts and hand over the Chart', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page, 'Tester', { freshOpening: true })
  await page.goto('/')
  await waitForWorldReady(page)

  // beat 1 — the invitation (value-prop + the small findable skip on one screen)
  await expect(page.getByTestId('opening-invitation')).toBeVisible()
  await expect(page.getByTestId('opening-skip')).toBeVisible() // findable, never hidden
  await page.getByTestId('opening-accept').press('Enter')

  // beat 2 — cold open (two lines)
  await expect(page.getByTestId('opening-dialogue')).toBeVisible()
  await cont(page)
  await cont(page)

  // beat 3 — mentor meet + controls: the line asks for movement; move, then continue
  await cont(page) // second mentor line ("walk with WASD")
  await page.keyboard.press('KeyW') // FIRST MEANINGFUL INPUT — movement
  await cont(page) // mentorMeetDone → continue to vault

  // beat 4 — the Vault: name the solution (REAL capture, sealed)
  const SOLUTION = 'an app that tracks café spoilage'
  await page.getByTestId('opening-vault-text').fill(SOLUTION)
  await cont(page) // capture
  await cont(page) // sealed line 1 → 2
  await cont(page) // → tiers

  // beat 5 — tiers + classify ("friends said so" = E1 Rumor)
  await cont(page) // tiers line 1 → 2
  await cont(page) // → classify
  await page.getByTestId('opening-classify-1').press('Enter')
  await cont(page) // right answer → assumption

  // beat 6 — first assumption (D-I distinct elicitation) + sealed kill criterion
  const BELIEF = 'independent cafés will pay monthly to cut spoilage'
  await page.getByTestId('opening-assumption-text').fill(BELIEF)
  await cont(page)
  await page.getByTestId('opening-kill-criterion').fill('IF I ask 5 owners THEN 4 shrug — dead')
  await cont(page)
  await cont(page) // sealed → evidence

  // beat 7 — first evidence: a VERBATIM quote logged as E2 Word
  await page.getByTestId('opening-evidence-text').fill('I hate my spreadsheet, it is the worst part of my week')
  await page.getByTestId('opening-evidence-source').fill('Sarah, verbatim')
  await cont(page)
  await cont(page) // logged line → kill

  // beat 8 — the first kill: the founder's own real admission
  await cont(page) // killAsk line 1 → 2
  await page.getByTestId('opening-kill-admit').press('Enter')
  await expect(page.getByTestId('opening-kill-xp')).toContainText('+15') // real celebration
  await cont(page) // → legend

  // beat 9 — the Legend hands over; closing it advances
  await page.getByTestId('opening-continue').press('Enter') // opens the Legend
  await expect(page.getByTestId('legend-panel')).toBeVisible()
  await expect(page.getByTestId('legend-truth')).toContainText('Only Deed and Gold')
  await page.keyboard.press('Escape')

  // beat 10 — the Chart: road, position, consent line; closing advances
  await cont(page) // chartHandoff line 1 → 2
  await page.getByTestId('opening-continue').press('Enter') // opens the Chart
  await expect(page.getByTestId('chart-panel')).toBeVisible()
  await expect(page.getByTestId('chart-here')).toBeVisible()
  await expect(page.getByTestId('chart-consent')).toContainText('The Chart is yours')
  await page.keyboard.press('Escape')

  // beat 11 — threshold: the fence drops
  await cont(page)
  await expect(page.getByTestId('opening-dialogue')).toBeHidden()

  // ---- every artifact is REAL in founders-quest:v3 ----
  const data = await readData(page)
  expect(data.openingCompletedAt).toBeTruthy()
  expect(data.chartUnlocked).toBe(true)
  expect(data.vault[0]?.text).toBe(SOLUTION)
  const flGuardians = data.assumptions.filter((a) => a.firstLight === true)
  expect(flGuardians).toHaveLength(2) // the venture belief + the customer belief
  expect(flGuardians[0]).toMatchObject({ statement: BELIEF, status: 'untested' })
  expect(flGuardians[0]?.killCriterion).toContain('4 shrug')
  expect(flGuardians[1]?.status).toBe('invalidated') // the first kill — real
  expect(data.evidence[0]).toMatchObject({ tier: 2, source: 'Sarah, verbatim' })
  expect(data.evidence[0]?.linkedAssumptionIds).toEqual([flGuardians[0]?.id])
  expect(data.firstLightArtifactIds.length).toBeGreaterThanOrEqual(3)
  // s1-l1 untouched (D-I) — no canon question consumed
  expect(data.answers['s1']).toBeUndefined()

  // the Chart is in the HUD and M recalls it
  await expect(page.getByTestId('hud-chart')).toBeVisible()
  await page.keyboard.press('KeyM')
  await expect(page.getByTestId('chart-panel')).toBeVisible()
  await page.keyboard.press('Escape')

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([]) // pre-written text only (D-E)
})

test('First Light skip: World 1 opens with the Chart; the re-entry offer fires exactly once', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page, 'Tester', { freshOpening: true })
  await page.goto('/')
  await waitForWorldReady(page)

  await expect(page.getByTestId('opening-invitation')).toBeVisible()
  await page.getByTestId('opening-skip').press('Enter')
  await expect(page.getByTestId('opening-invitation')).toBeHidden()

  // the skipper still receives the Chart — nothing is gated
  await expect(page.getByTestId('hud-chart')).toBeVisible()
  await page.keyboard.press('KeyM')
  await expect(page.getByTestId('chart-panel')).toBeVisible()
  await page.keyboard.press('Escape')

  // the skip is a courtesy, never an override: no gate record, no trail entry
  const data = await readData(page)
  expect(data.openingSkippedAt).toBeTruthy()
  expect(data.gates).toEqual({})
  expect(data.trail).toEqual([])

  // first kneel → the one-time offer; decline drops into the trance itself
  await tabToTarget(page, 's1-th')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('reentry-prompt')).toBeVisible()
  await page.getByTestId('reentry-decline').press('Enter')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trance-panel')).toBeHidden()

  // second kneel → straight to the trance; the offer never returns
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('reentry-prompt')).toHaveCount(0)

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
