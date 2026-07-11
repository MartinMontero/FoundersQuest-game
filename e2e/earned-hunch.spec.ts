// e2e/earned-hunch.spec.ts — the Earned Hunch (Mind & Myth A2), driven through
// the real world + store: capture a hunch (zero justification) → tag it Earned
// → send it to the test bench (seed a guardian) → the bump makes it Riskiest →
// link E2 evidence → the funeral resolves it → the calibration record shows
// 'broke'. The Registry monument stands in World 1; the funeral shrine (s5-l5)
// stands at the Mirror — the spec hops worlds via the product's own
// reload-resume path (journey key + reload). Keyboard-only (the provenance
// <select> is set via selectOption — programmatic, no mouse events); zero
// Anthropic.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { JOURNEY_STORAGE_KEY } from '../src/state/journey'
import { recordRun, seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

test.describe.configure({ timeout: 240_000 })

const HUNCH = 'regulars would prepay a month of coffee'

/** The Mirror's verdict already ruled (unlocks s5-l5 for the funeral hop) + one
 * PLAIN dies-guardian created EARLIER — the tie the earned bump must break. */
const SEED: Partial<QuestData> = {
  answers: { s5: { 's5-th': { verdict: 'yes' } } },
  assumptions: [
    {
      id: 'g-plain',
      statement: 'cafés will pay to track spoilage',
      originStageId: 's1',
      importance: 'dies',
      status: 'untested',
      killCriterion: 'ask 5; 4 refuse',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ],
}

async function readData(page: import('@playwright/test').Page): Promise<QuestData> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
  if (raw === null) throw new Error('founders-quest:v3 not written')
  return JSON.parse(raw) as QuestData
}

test('Earned Hunch: capture → tag → seed → bump → E2 → funeral → the record shows broke', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await page.addInitScript(
    ([sk, seed]) => {
      try {
        // merge ONCE over the helper's returning-founder pre-seed; on later
        // reloads (this spec world-hops) the marker prevents re-wiping the
        // test's own writes
        const existing = window.localStorage.getItem(sk as string)
        const parsed = existing === null ? {} : (JSON.parse(existing) as Record<string, unknown>)
        if (parsed['__seeded'] === undefined && parsed['assumptions'] === undefined) {
          window.localStorage.setItem(
            sk as string,
            JSON.stringify({ ...parsed, ...(JSON.parse(seed as string) as object), __seeded: true }),
          )
        }
      } catch {
        // storage blocked — not this spec's concern
      }
    },
    [STORAGE_KEY, JSON.stringify(SEED)],
  )
  await page.goto('/') // World 1 — where the Registry monument stands
  await waitForWorldReady(page)

  // ---- open the Registry, capture the whisper (one field + Enter — no
  //      provenance prompt anywhere in the capture path, D-M) ----
  await tabToTarget(page, 'registry')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('registry-panel')).toBeVisible()
  await page.getByTestId('hunch-capture-text').fill(HUNCH)
  await page.getByTestId('hunch-capture-text').press('Enter')
  await expect(page.getByTestId('hunch-1')).toContainText(HUNCH)
  // captured untagged — the E0 entry exists with no provenance
  expect((await readData(page)).evidence[0]).toMatchObject({ tier: 0, text: HUNCH })
  expect('provenance' in ((await readData(page)).evidence[0] ?? {})).toBe(false)

  // ---- tag it Earned (optional, post-capture) ----
  await page.getByTestId('hunch-provenance-1').selectOption('earned')
  await expect
    .poll(async () => (await readData(page)).evidence[0]?.provenance)
    .toBe('earned')
  // the calibration row opened
  expect((await readData(page)).calibration).toHaveLength(1)

  // ---- send it to the test bench (seed a guardian) ----
  await page.getByTestId('hunch-seed-1').press('Enter')
  await page.getByTestId('hunch-seed-kill').fill('ask 5 regulars; 4 refuse to prepay')
  await page.getByTestId('hunch-seed-confirm').press('Enter')
  await expect(page.getByTestId('hunch-seeded-1')).toBeVisible()

  // ---- the bump: the seeded guardian outranks the earlier equal-weight one ----
  const riskiestRow = page.locator('[data-testid="registry-guardian"][data-riskiest="true"]')
  await expect(riskiestRow).toContainText(HUNCH)

  // ---- link E2 evidence to the seeded guardian (it sorts FIRST as riskiest) ----
  await riskiestRow.getByTestId('registry-link-toggle').press('Enter')
  await page.getByTestId('registry-evidence-text').fill('"never prepaid once in 20 years"')
  await page.getByTestId('registry-evidence-source').fill('Priya, call')
  await page.getByTestId('registry-evidence-add').press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('registry-panel')).toBeHidden()

  // ---- hop to the Mirror via the product's reload-resume path ----
  await page.evaluate((jk) => window.localStorage.setItem(jk as string, '5'), JOURNEY_STORAGE_KEY)
  await page.reload()
  await waitForWorldReady(page)
  await expect(page.getByTestId('stage-banner')).toContainText('The Mirror')

  // ---- the funeral (s5-l5) buries the seeded belief (choice 2 — seeded second) ----
  await tabToTarget(page, 's5-l5')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('trance-panel')).toBeVisible()
  await expect(page.getByTestId('input-funeral-choice-2')).toBeVisible()
  await page.getByTestId('input-funeral-choice-2').press('Space')
  await page.getByTestId('input-funeral-hold').press('Enter')
  await page.getByTestId('input-funeral-confirm').press('Enter')
  await expect(page.getByTestId('trance-panel')).toBeHidden()

  // ---- back to World 1: your gut's record shows the resolution ----
  await page.evaluate((jk) => window.localStorage.setItem(jk as string, '1'), JOURNEY_STORAGE_KEY)
  await page.reload()
  await waitForWorldReady(page)
  await tabToTarget(page, 'registry')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('registry-panel')).toBeVisible()
  await page.getByTestId('calibration-open').press('Enter')
  await expect(page.getByTestId('calibration-panel')).toBeVisible()
  await expect(page.getByTestId('calibration-row')).toContainText(HUNCH)
  await expect(page.getByTestId('calibration-outcome')).toHaveText('broke')
  await expect(page.getByTestId('calibration-rate-earned')).toContainText('0 of 1 held')

  const data = await readData(page)
  expect(data.calibration[0]?.outcome).toBe('broke')

  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([]) // zero API surface (D-E)
})
