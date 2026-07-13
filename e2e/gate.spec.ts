// e2e/gate.spec.ts — the Act Gate threshold, driven through the real world + store.
// Gates WARN, never block (canon 01): a met bar crosses cleanly and records a
// gate-pass; an unmet bar can be backed out of ("Not yet") with no record, or
// crossed with a written reason that lands in gates[] AND the trail (exported).
// Keyboard only; zero Anthropic.

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

/** Seed founders-quest:v3 + start world before goto. */
async function seed(
  page: import('@playwright/test').Page,
  data: Partial<QuestData>,
  stage: number,
): Promise<void> {
  await page.addInitScript(
    ([sk, jk, d, st]) => {
      try {
        window.localStorage.setItem(sk as string, d as string)
        window.localStorage.setItem(jk as string, st as string)
      } catch {
        // storage blocked — not this spec's concern
      }
    },
    [STORAGE_KEY, JOURNEY_STORAGE_KEY, JSON.stringify(data), String(stage)],
  )
}

// Act I bar (after W2): s1 threshold answered · ≥5 E2+ · ≥1 E3+ · a written kill criterion
const ACT1_MET: Partial<QuestData> = {
  answers: { s1: { 's1-th': { text: 'watched Priya lose a crate to spoilage' } } },
  assumptions: [
    {
      id: 'g1',
      statement: 'cafés will pay to cut spoilage',
      originStageId: 's1',
      importance: 'dies',
      status: 'untested',
      killCriterion: 'ask 5; 4 refuse',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  evidence: [2, 2, 2, 2, 3].map((tier, i) => ({
    id: `e-${i}`,
    tier: tier as 2 | 3,
    text: `they said it (${i})`,
    source: 'call',
    linkedAssumptionIds: ['g1'],
    stageId: 's2',
    date: '2026-07-03',
  })),
}

test('Act Gate — a met bar crosses cleanly and records a gate-pass', async ({ page }) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seed(page, ACT1_MET, 2)
  await page.goto('/')
  await waitForWorldReady(page)
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(2)) // The Raven

  await tabToTarget(page, 'portal-2-onward')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('gate-panel')).toBeVisible()
  await expect(page.getByTestId('gate-status')).toContainText('open') // "…the way is open"
  await page.getByTestId('gate-cross').press('Enter')
  await expect(page.getByTestId('gate-panel')).toBeHidden()
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(3)) // The Phoenix

  const data = await readData(page)
  expect(data.gates.act1?.status).toBe('passed')
  expect(data.trail.some((t) => t.type === 'gate-pass')).toBe(true)
  expect(log.consoleErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})

test('Act Gate — an unmet bar backs out with no record, then overrides with a reason', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seed(page, {}, 2) // nothing banked → Act I unmet
  await page.goto('/')
  await waitForWorldReady(page)
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(2))

  // back out with "Not yet" — no record, stay in World 2
  await tabToTarget(page, 'portal-2-onward')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('gate-panel')).toBeVisible()
  await expect(page.getByTestId('gate-status')).toContainText('not met')
  await expect(page.getByTestId('gate-cross')).toBeDisabled() // override needs a reason
  await page.getByTestId('gate-back').press('Enter')
  await expect(page.getByTestId('gate-panel')).toBeHidden()
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(2)) // stayed
  // no record on back-out — and nothing has persisted yet, so `gates` may be absent
  expect((await readData(page)).gates?.act1).toBeUndefined()

  // now override with a written reason
  await tabToTarget(page, 'portal-2-onward')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('gate-panel')).toBeVisible()
  const reason = 'demoing the spine before the evidence is in'
  await page.getByTestId('gate-reason').fill(reason)
  await page.getByTestId('gate-cross').press('Enter')
  await expect(page.getByTestId('gate-panel')).toBeHidden()
  await expect(page.getByTestId('stage-banner')).toContainText(worldName(3))

  const data = await readData(page)
  expect(data.gates.act1).toMatchObject({ status: 'overridden', reason })
  expect(data.trail.some((t) => t.type === 'gate-override' && t.reason === reason)).toBe(true)
  expect(log.consoleErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
})
