// e2e/confrontation.spec.ts — the A4 vertical slice, keyboard-only.
// Branch A: press → strike-stagger → cite (bounce + hit + shatter) → verdict
//           → finisher (persists across a RELOAD until used) → shatter staging
//           → the full funeral rite (Vigil → Eulogy verbatim → Committal → XP).
// Branch B: the validation win — zero strikes the whole fight (D-C invariant:
//           the idle window alone grants evidence access), verdict held,
//           pillar staging, equal celebration.
// Plus: skip → ghost → delayed funeral via the HUD ember; the trough queues
// the rite offer; the empty circle is honest.

import { expect, test } from '@playwright/test'
import { STORAGE_KEY, type QuestData } from '../src/core/schema'
import { CONFRONTATION, RITE } from '../src/strings/confrontation'
import {
  readQuestData,
  recordRun,
  seedFounderName,
  tabToTarget,
  waitForWorldReady,
  type RunLog,
} from './helpers'

test.describe.configure({ timeout: 240_000 })

const GUARDIAN = {
  id: 'g-arena',
  statement: 'Everyone has this problem',
  originStageId: 's1',
  importance: 'dies',
  status: 'untested',
  killCriterion: 'Fewer than 3 of 10 name it unprompted',
  createdAt: '2026-07-01T00:00:00.000Z',
}

const LEDGER = [
  {
    id: 'e-hunch',
    tier: 0,
    text: 'gut says everyone wants this',
    source: '',
    linkedAssumptionIds: [],
    stageId: '',
    date: '2026-07-02',
  },
  {
    id: 'e-word',
    tier: 2,
    text: '"I gave up and went back to my spreadsheet"',
    source: 'interview 3',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-03',
  },
  {
    id: 'e-deed',
    tier: 3,
    text: 'watched her rebuild the tracker by hand, twice',
    source: 'shadowing session',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-04',
  },
  {
    id: 'e-gold',
    tier: 4,
    text: 'paid $40/mo for the manual workaround',
    source: 'receipt',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-05',
  },
]

/** Merge the seed into the record ONCE (skipped when assumptions already
 * exist — i.e. on every reload after the app has saved). Runs after
 * seedFounderName's init script, so the returning-founder keys are present. */
async function seedArena(page: import('@playwright/test').Page, extra: object = {}): Promise<void> {
  await page.addInitScript(
    ([storageKey, seedJson]) => {
      try {
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
    [STORAGE_KEY, JSON.stringify({ assumptions: [GUARDIAN], evidence: LEDGER, ...extra })],
  )
}

function assertCleanRun(log: RunLog): void {
  expect(log.consoleErrors).toEqual([])
  expect(log.pageErrors).toEqual([])
  expect(log.anthropicRequests).toEqual([])
}

async function enterArena(page: import('@playwright/test').Page): Promise<void> {
  await tabToTarget(page, 'arena')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('arena-overlay')).toBeVisible()
}

test('invalidation branch: strike-stagger, cite, verdict, persistent finisher, the full rite', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seedArena(page)
  await page.goto('/')
  await waitForWorldReady(page)

  await enterArena(page)
  await expect(page.getByTestId('arena-statement')).toHaveText(GUARDIAN.statement)
  await expect(page.getByTestId('arena-hp')).toHaveText('12/12')
  await expect(page.getByTestId('arena-composure')).toHaveText('4/4')

  // press phase: the window is closed, the thread is NOT (never skill-locked)
  await expect(page.getByTestId('arena-press')).toBeVisible()
  await expect(page.getByTestId('arena-ledger')).toBeHidden()
  await expect(page.getByTestId('arena-verdict-tripped')).toBeVisible()

  // stagger the guardian: four strikes break a dies-weight poise (4) early
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('Space')
  await expect(page.getByTestId('arena-window')).toBeVisible()
  await expect(page.getByTestId('arena-ledger')).toBeVisible()

  // B2 — the hunch bounces: the line teaches, nothing changes, window stays
  await page.getByTestId('arena-cite-1').press('Enter')
  await expect(page.getByTestId('arena-feedback')).toHaveText(CONFRONTATION.impact.bounce)
  await expect(page.getByTestId('arena-hp')).toHaveText('12/12')
  await expect(page.getByTestId('arena-ledger')).toBeVisible()

  // E2 lands: soaked by composure, the guardian counters, the press resumes
  await page.getByTestId('arena-cite-2').press('Enter')
  await expect(page.getByTestId('arena-hp')).toHaveText('12/12')
  await expect(page.getByTestId('arena-composure')).toHaveText('2/4')
  await expect(page.getByTestId('arena-press')).toBeVisible()

  // D-C mid-fight: touch nothing — the idle window opens on its own
  await expect(page.getByTestId('arena-window')).toBeVisible({ timeout: 10_000 })

  // E4 shatters: whole shield gone, full overflow to the core
  await page.getByTestId('arena-cite-4').press('Enter')
  await expect(page.getByTestId('arena-feedback')).toHaveText(CONFRONTATION.impact.shatter)
  await expect(page.getByTestId('arena-hp')).toHaveText('6/12')
  await expect(page.getByTestId('arena-composure')).toHaveText('0/4')

  // verdict before interpretation — the thread ignites
  await page.getByTestId('arena-verdict-tripped').press('Enter')
  await expect(page.getByTestId('arena-finisher')).toBeVisible()

  // the finisher PERSISTS until used: leave, reload, return — still ignited
  await page.keyboard.press('Escape')
  await page.reload()
  await waitForWorldReady(page)
  await enterArena(page)
  await expect(page.getByTestId('arena-hp')).toHaveText('6/12') // replayed citations
  await expect(page.getByTestId('arena-finisher')).toBeVisible()

  // the strike — shatter staging, honest 1.5× honors, the rite offer
  await page.getByTestId('arena-finisher').press('Enter')
  await expect(page.getByTestId('arena-outcome')).toContainText(
    CONFRONTATION.outcome.invalidated.title,
  )
  await expect(page.getByTestId('arena-xp')).toHaveText(
    CONFRONTATION.outcome.invalidated.xpProven,
  )
  await page.getByTestId('arena-to-rite').press('Enter')

  // the rite: Vigil → Eulogy (verbatim Ledger) → Committal → inheritance
  await expect(page.getByTestId('rite-vigil')).toBeVisible()
  await expect(page.getByTestId('rite-belief')).toContainText(GUARDIAN.statement)
  await page.getByTestId('rite-continue').press('Enter')
  await expect(page.getByTestId('rite-eulogy')).toBeVisible()
  const evidenceQuotes = page.getByTestId('rite-evidence')
  await expect(evidenceQuotes).toHaveCount(2) // the two coins actually cited
  await expect(evidenceQuotes.nth(0)).toHaveText(LEDGER[1]?.text ?? '')
  await expect(evidenceQuotes.nth(1)).toHaveText(LEDGER[3]?.text ?? '')
  await page.getByTestId('rite-continue').press('Enter')
  await expect(page.getByTestId('rite-committal')).toBeVisible()
  await page.getByTestId('rite-line').fill('It was never everyone. It was ops leads.')
  await page.getByTestId('rite-seal').press('Enter')
  await expect(page.getByTestId('rite-grant')).toBeVisible()
  await expect(page.getByTestId('rite-xp')).toHaveText(RITE.grant.xpProven)
  await page.getByTestId('rite-done').press('Enter')
  await expect(page.getByTestId('rite-overlay')).toBeHidden()

  // the record — canon shapes, everything derived stays derivable
  const data = (await readQuestData(page)) as QuestData
  const confrontation = data.confrontations[0]
  expect(confrontation?.guardianId).toBe(GUARDIAN.id)
  expect(confrontation?.outcome).toBe('invalidated')
  expect(confrontation?.resolvedAt).toBeTruthy()
  expect(confrontation?.citations).toEqual(['e-word', 'e-gold']) // the bounce wrote NOTHING
  const guardian = data.assumptions.find((a) => a.id === GUARDIAN.id)
  expect(guardian?.status).toBe('invalidated')
  const funeral = data.funerals[0]
  expect(funeral?.guardianId).toBe(GUARDIAN.id)
  expect(funeral?.heldAt).toBeTruthy()
  expect(funeral?.epitaph).toBe('It was never everyone. It was ops leads.')
  expect(data.wisdomCodex).toHaveLength(1)
  expect(data.wisdomCodex[0]?.text).toBe('It was never everyone. It was ops leads.')
  // citing linked the coins — derived tier is honest
  expect(
    data.evidence.find((e) => e.id === 'e-word')?.linkedAssumptionIds,
  ).toContain(GUARDIAN.id)

  assertCleanRun(log)
})

test('validation branch: zero strikes (D-C idle window), verdict held, the pillar stands', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seedArena(page)
  await page.goto('/')
  await waitForWorldReady(page)

  await enterArena(page)
  await expect(page.getByTestId('arena-press')).toBeVisible()

  // D-C invariant: touch NOTHING — no strike ever lands, the window opens
  await expect(page.getByTestId('arena-window')).toBeVisible({ timeout: 10_000 })
  await page.getByTestId('arena-cite-2').press('Enter') // the E2 verbatim quote

  // the world said the criterion HELD — the belief stands proven
  await page.getByTestId('arena-verdict-held').press('Enter')
  await page.getByTestId('arena-finisher').press('Enter')
  await expect(page.getByTestId('arena-outcome')).toContainText(
    CONFRONTATION.outcome.validated.title,
  )
  await expect(page.getByTestId('arena-xp')).toHaveText(
    CONFRONTATION.outcome.validated.xpProven,
  )
  // no funeral for a living pillar — the offer never appears
  await expect(page.getByTestId('arena-to-rite')).toBeHidden()
  await page.getByTestId('arena-outcome-leave').press('Enter')
  await expect(page.getByTestId('arena-overlay')).toBeHidden()
  await expect(page.getByTestId('hud-funeral')).toBeHidden()

  const data = (await readQuestData(page)) as QuestData
  expect(data.assumptions.find((a) => a.id === GUARDIAN.id)?.status).toBe('validated')
  expect(data.confrontations[0]?.outcome).toBe('validated')
  expect(data.funerals).toEqual([])

  assertCleanRun(log)
})

const DEAD_GUARDIAN = {
  ...GUARDIAN,
  status: 'invalidated',
  resolvedAt: '2026-07-10T00:00:00.000Z',
}

const LINKED_LEDGER = LEDGER.map((e) =>
  e.id === 'e-word' ? { ...e, linkedAssumptionIds: [GUARDIAN.id] } : e,
)

test('skip logs once, the ghost lingers, a delayed funeral lays it to rest', async ({ page }) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seedArena(page, { assumptions: [DEAD_GUARDIAN], evidence: LINKED_LEDGER })
  await page.goto('/')
  await waitForWorldReady(page)

  // an unburied invalidation queues — the HUD ember offers the rite
  const ember = page.getByTestId('hud-funeral')
  await expect(ember).toBeVisible()
  await expect(ember).toHaveText(RITE.hud.pending)

  // skip: ONE warning, then it is a choice; the skip is logged
  await ember.press('Enter')
  await expect(page.getByTestId('rite-vigil')).toBeVisible()
  await page.getByTestId('rite-skip').press('Enter')
  await expect(page.getByTestId('rite-skip-warning')).toBeVisible()
  await page.getByTestId('rite-skip-confirm').press('Enter')
  await expect(page.getByTestId('rite-overlay')).toBeHidden()

  let data = (await readQuestData(page)) as QuestData
  expect(data.funerals[0]?.skippedAt).toBeTruthy()
  expect(data.funerals[0]?.heldAt).toBeUndefined()

  // the ghost lingers (narrative-only) — the ember now offers to lay it to rest
  await expect(ember).toBeVisible()
  await expect(ember).toHaveText(RITE.hud.ghost)

  // the delayed funeral: full rite, the ghost is laid to rest, history stays
  await ember.press('Enter')
  await expect(page.getByTestId('rite-vigil')).toBeVisible()
  await page.getByTestId('rite-continue').press('Enter')
  await expect(page.getByTestId('rite-evidence')).toHaveText(LEDGER[1]?.text ?? '')
  await page.getByTestId('rite-continue').press('Enter')
  await page.getByTestId('rite-line').fill('Laid to rest, late but honest.')
  await page.getByTestId('rite-seal').press('Enter')
  await page.getByTestId('rite-done').press('Enter')

  data = (await readQuestData(page)) as QuestData
  expect(data.funerals).toHaveLength(1)
  expect(data.funerals[0]?.skippedAt).toBeTruthy() // honest history
  expect(data.funerals[0]?.heldAt).toBeTruthy()
  expect(data.wisdomCodex).toHaveLength(1)
  await expect(ember).toBeHidden()

  assertCleanRun(log)
})

test('the trough queues the rite; a world with no challenger shows the honest empty circle', async ({
  page,
}) => {
  const log = recordRun(page)
  await seedFounderName(page)
  await seedArena(page, {
    assumptions: [DEAD_GUARDIAN],
    evidence: LINKED_LEDGER,
    weather: [
      { id: 'w1', date: '2026-07-09', value: 1 },
      { id: 'w2', date: '2026-07-10', value: 2 },
      { id: 'w3', date: '2026-07-11', value: 1 },
    ],
  })
  await page.goto('/')
  await waitForWorldReady(page)

  // the funeral is pending but the skies are low — the ember holds fire
  await expect(page.getByTestId('hud-funeral')).toBeHidden()

  // the only W1 belief is resolved — the circle is honestly empty
  await tabToTarget(page, 'arena')
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('arena-empty')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('arena-empty')).toBeHidden()

  assertCleanRun(log)
})
