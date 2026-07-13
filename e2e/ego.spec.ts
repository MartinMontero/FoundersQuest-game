// e2e/ego.spec.ts — the A5 Ego at the W8 Launch Threshold, keyboard-only.
// Test 1: the full five-phase fight over a seeded REAL record — shields carry
// the founder's own override reason, denial yields only to E3/E4, sealed
// evidence beats rationalization, a projection is returned as a REAL test,
// the chain is cut by proof of non-returning investment, and identity-fusion
// ends by integration (a codex write) — the capstone Distance readout then
// survives a reload. Test 2: D-F trough delay + leave-without-penalty.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { EGO } from '../src/strings/ego'
import {
  readQuestData,
  recordRun,
  seedFounderName,
  tabToTarget,
  waitForWorldReady,
  type RunLog,
} from './helpers'

test.describe.configure({ timeout: 240_000 })

const OVERRIDE_REASON = 'demo day pressure — crossed unready'

/** the founder's record the Ego is assembled from */
const RECORD = {
  assumptions: [
    {
      id: 'u-heavy',
      statement: 'Enterprise buyers will self-serve',
      originStageId: 's7',
      importance: 'dies',
      status: 'untested',
      killCriterion: '',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'sealed-g',
      statement: 'Ops leads feel this weekly',
      originStageId: 's1',
      importance: 'wobbles',
      status: 'validated',
      resolvedAt: '2026-07-08T00:00:00.000Z',
      killCriterion: 'Fewer than 3 of 10 name it unprompted',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'dead-g',
      statement: 'They will prepay for a beta',
      originStageId: 's5',
      importance: 'wobbles',
      status: 'invalidated',
      resolvedAt: '2026-07-09T00:00:00.000Z',
      killCriterion: '',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  evidence: [
    {
      id: 'e-hunch',
      tier: 0,
      text: 'gut says launch now',
      source: '',
      linkedAssumptionIds: [],
      stageId: '',
      date: '2026-07-02',
    },
    {
      id: 'e-deed',
      tier: 3,
      text: 'watched three teams route around the tool',
      source: 'shadowing',
      linkedAssumptionIds: [],
      stageId: 's4',
      date: '2026-07-03',
    },
    {
      id: 'e-gold',
      tier: 4,
      text: 'two paid pilots signed',
      source: 'contracts',
      linkedAssumptionIds: [],
      stageId: 's7',
      date: '2026-07-04',
    },
    {
      id: 'e-sealed',
      tier: 2,
      text: '"we lose every Friday afternoon to this"',
      source: 'interview 7',
      linkedAssumptionIds: ['sealed-g'],
      stageId: 's1',
      date: '2026-07-05',
    },
    {
      id: 'e-dead',
      tier: 2,
      text: '"I would not pay for this today"',
      source: 'pricing call',
      linkedAssumptionIds: ['dead-g'],
      stageId: 's5',
      date: '2026-07-06',
    },
  ],
  gates: {
    act1: { status: 'overridden', reason: OVERRIDE_REASON, date: '2026-07-07' },
  },
  funerals: [{ guardianId: 'dead-g', skippedAt: '2026-07-09T01:00:00.000Z' }],
}

/** seed the quest record (merge-once) AND drop the founder in World 8 */
async function seedW8(page: import('@playwright/test').Page, extra: object = {}): Promise<void> {
  await page.addInitScript(
    ([storageKey, seedJson]) => {
      try {
        window.localStorage.setItem('founders-quest:journey', '8')
        const raw = window.localStorage.getItem(storageKey as string)
        const data = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>)
        const existing = data['assumptions']
        if (Array.isArray(existing) && existing.length > 0) return
        window.localStorage.setItem(
          storageKey as string,
          JSON.stringify({ ...data, ...(JSON.parse(seedJson as string) as object) }),
        )
      } catch {
        // storage blocked — not this spec's concern
      }
    },
    [STORAGE_KEY, JSON.stringify({ ...RECORD, ...extra })],
  )
}

function assertCleanRun(log: RunLog): void {
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
}

async function faceTheEgo(page: import('@playwright/test').Page): Promise<void> {
  await tabToTarget(page, 'ego-gate')
  await page.keyboard.press('KeyE')
}

test('the five-phase fight: shields, denial, sealed cites, projection, chains, integration', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seedW8(page)
  await page.goto('/')
  await waitForWorldReady(page)

  await faceTheEgo(page)
  await expect(page.getByTestId('ego-offer')).toBeVisible()
  await page.getByTestId('ego-enter').press('Enter')
  await expect(page.getByTestId('ego-fight')).toBeVisible()

  // the Ego formed from the record: 6 base + 3 (dies untested) ×2 + 1 ghost ×2
  await expect(page.getByTestId('ego-hp')).toHaveText('14/14')
  await expect(page.getByTestId('ego-shields')).toHaveText('1/1')
  await expect(page.getByTestId('ego-phase')).toHaveText(EGO.phases.denial.title)

  // B2 against the Ego: the hunch bounces, and is NOT consumed
  await page.getByTestId('ego-cite-1').press('Enter')
  await expect(page.getByTestId('ego-feedback')).toHaveText(EGO.fight.bounce)
  await expect(page.getByTestId('ego-cite-1')).toBeEnabled()

  // denial deflects E2 — and the deflected coin is NOT consumed either
  await page.getByTestId('ego-cite-4').press('Enter') // e-sealed (E2)
  await expect(page.getByTestId('ego-feedback')).toHaveText(EGO.phases.denial.deflect)
  await expect(page.getByTestId('ego-cite-4')).toBeEnabled()

  // E3 lands — but the WALL the founder built absorbs it, naming their reason
  await page.getByTestId('ego-cite-2').press('Enter') // e-deed (E3)
  await expect(page.getByTestId('ego-feedback')).toContainText(OVERRIDE_REASON)
  await expect(page.getByTestId('ego-hp')).toHaveText('14/14')
  await expect(page.getByTestId('ego-shields')).toHaveText('0/1')

  // Gold lands on the core: 6 + edge 2 = 8 → denial breaks at 2/3
  await page.getByTestId('ego-cite-3').press('Enter') // e-gold (E4)
  await expect(page.getByTestId('ego-hp')).toHaveText('6/14')
  await expect(page.getByTestId('ego-phase')).toHaveText(EGO.phases.rationalization.title)

  // rationalization deflects unsealed evidence, yields to the sealed thread
  await page.getByTestId('ego-cite-5').press('Enter') // e-dead — linked, but no sealed criterion
  await expect(page.getByTestId('ego-feedback')).toHaveText(EGO.phases.rationalization.deflect)
  await page.getByTestId('ego-cite-4').press('Enter') // e-sealed — the thread holds its shape
  await expect(page.getByTestId('ego-hp')).toHaveText('2/14')

  // projection: the untested belief comes back — return it as a REAL test
  await expect(page.getByTestId('ego-phase')).toHaveText(EGO.phases.projection.title)
  await expect(page.getByTestId('ego-projection')).toContainText(
    'Enterprise buyers will self-serve',
  )
  await page.getByTestId('ego-return-1').press('Enter')

  // sunk-cost: the chain is cut by proof the investment was not returning
  await expect(page.getByTestId('ego-phase')).toHaveText(EGO.phases.sunkCost.title)
  await page.getByTestId('ego-cite-5').press('Enter') // e-dead cuts — linked to the invalidated
  await expect(page.getByTestId('ego-hp')).toHaveText('0/14')

  // identity-fusion: no ledger, no damage — only the integration line ends it
  await expect(page.getByTestId('ego-phase')).toHaveText(EGO.phases.fusion.title)
  await expect(page.getByTestId('ego-ledger')).toBeHidden()
  await page.getByTestId('ego-line').fill('I am not my idea. I am the one who tests it.')
  await page.getByTestId('ego-integrate').press('Enter')
  await expect(page.getByTestId('ego-integrated')).toBeVisible()
  await expect(page.getByTestId('ego-capstone')).toHaveText(EGO.integration.capstone)
  await page.getByTestId('ego-done').press('Enter')

  // the capstone reads in the HUD — and SURVIVES a reload (codex-derived)
  await expect(page.getByTestId('hud-distance')).toBeVisible()
  await page.reload()
  await waitForWorldReady(page)
  await expect(page.getByTestId('hud-distance')).toBeVisible()

  // the record: the integration line, and the returned projection, persist
  const data = (await readQuestData(page)) as QuestData
  const capstone = data.wisdomCodex.find((w) => w.sourceGuardianId === 'ego')
  expect(capstone?.text).toBe('I am not my idea. I am the one who tests it.')
  expect(data.assumptions.find((a) => a.id === 'u-heavy')?.status).toBe('testing')

  assertCleanRun(log)
})

test('D-F: the trough delays the offer; leaving mid-fight writes nothing', async ({ page }) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seedW8(page, {
    weather: [
      { id: 'w1', date: '2026-07-09', value: 1 },
      { id: 'w2', date: '2026-07-10', value: 2 },
      { id: 'w3', date: '2026-07-11', value: 1 },
    ],
  })
  await page.goto('/')
  await waitForWorldReady(page)

  // low skies: the threshold shows the DELAY — no way into the fight, a way back
  await faceTheEgo(page)
  await expect(page.getByTestId('ego-trough')).toBeVisible()
  await expect(page.getByTestId('ego-enter')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('ego-trough')).toBeHidden()

  // clear skies (three good readings shift the last-3 window): the offer opens
  await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    const data = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>)
    const weather = Array.isArray(data['weather']) ? (data['weather'] as unknown[]) : []
    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        weather: [
          ...weather,
          { id: 'w4', date: '2026-07-11T06:00:00', value: 4 },
          { id: 'w5', date: '2026-07-11T07:00:00', value: 4 },
          { id: 'w6', date: '2026-07-11T08:00:00', value: 5 },
        ],
      }),
    )
  }, STORAGE_KEY)
  await page.reload()
  await waitForWorldReady(page)

  const before = (await readQuestData(page)) as QuestData
  await faceTheEgo(page)
  await expect(page.getByTestId('ego-offer')).toBeVisible()
  await page.getByTestId('ego-enter').press('Enter')
  await expect(page.getByTestId('ego-fight')).toBeVisible()
  await page.getByTestId('ego-cite-3').press('Enter') // one Gold lands
  await page.keyboard.press('Escape') // walk away mid-fight

  // no penalty, no hidden progress: the record is byte-identical
  const after = (await readQuestData(page)) as QuestData
  expect(after).toEqual(before)

  assertCleanRun(log)
})
