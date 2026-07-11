// e2e/feelpack.spec.ts — the feel-checkpoint screenshot pack (art-direction §4).
// Skipped unless FEEL_PACK=1: run explicitly per phase and ARCHIVE the output
// (docs/feel-packs/<phase>/) — one image per checkable criterion. Honest note:
// these are software-GL headless captures — colors/light are representative,
// fps is not. The operator's eye remains the verdict; this pack is the record.

import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { seedFounderName, tabToTarget, waitForWorldReady } from './helpers'

const PHASE = process.env['FEEL_PACK_PHASE'] ?? 'a3'
const DIR = `docs/feel-packs/${PHASE}`

test.describe.configure({ timeout: 240_000 })

test.skip(process.env['FEEL_PACK'] !== '1', 'feel pack runs only when FEEL_PACK=1')

test('feel pack a3: spawn, shrine, trance frame, opening, chart, legend', async ({ page }) => {
  test.skip(PHASE !== 'a3', 'a3 shots run under FEEL_PACK_PHASE=a3')
  mkdirSync(DIR, { recursive: true })

  // 1-2: fresh opening — invitation + dialogue over the live world
  await seedFounderName(page, 'Tester', { freshOpening: true })
  await page.goto('/')
  await waitForWorldReady(page)
  await page.screenshot({ path: `${DIR}/01-invitation.png` })
  await page.getByTestId('opening-accept').press('Enter')
  await page.waitForTimeout(1200) // let the typewriter ink a line
  await page.screenshot({ path: `${DIR}/02-dialogue-over-world.png` })

  // 3: spawn view — horizon, landmarks (skip the rest of the induction)
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('founders-quest:v3')
    const data = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>)
    window.localStorage.setItem(
      'founders-quest:v3',
      JSON.stringify({
        ...data,
        openingCompletedAt: '2026-07-11T00:00:00.000Z',
        openingBeatProgress: null,
        chartUnlocked: true,
        invitationSeen: true,
      }),
    )
  })
  await page.reload()
  await waitForWorldReady(page)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}/03-spawn-horizon.png` })

  // 4: shrine approach + 5: trance frame (world visible around the panel)
  await tabToTarget(page, 's1-th')
  await page.screenshot({ path: `${DIR}/04-shrine-focus.png` })
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(900) // the trance dolly
  await page.screenshot({ path: `${DIR}/05-trance-frame.png` })
  await page.keyboard.press('Escape')

  // 6: the Chart · 7: the Legend
  await page.keyboard.press('KeyM')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/06-chart.png` })
  await page.keyboard.press('Escape')
  await page.keyboard.press('KeyL')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/07-legend.png` })
})

// ---- A4: the Proving Circle + the Funeral rite (art floor: the arena and
// ---- rite must sit over the LIVE world — a rite over a void fails the phase)

const A4_GUARDIAN = {
  id: 'g-feel',
  statement: 'Everyone has this problem',
  originStageId: 's1',
  importance: 'dies',
  status: 'untested',
  killCriterion: 'Fewer than 3 of 10 name it unprompted',
  createdAt: '2026-07-01T00:00:00.000Z',
}

const A4_LEDGER = [
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
    id: 'e-gold',
    tier: 4,
    text: 'paid $40/mo for the manual workaround',
    source: 'receipt',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-05',
  },
]

test('feel pack a4: arena set-piece, press, window, thread, shatter, rite, graveside', async ({
  page,
}) => {
  test.skip(PHASE !== 'a4', 'a4 shots run under FEEL_PACK_PHASE=a4')
  mkdirSync(DIR, { recursive: true })

  await seedFounderName(page)
  await page.addInitScript(
    ([storageKey, seedJson]) => {
      const raw = window.localStorage.getItem(storageKey as string)
      const data = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>)
      const existing = data['assumptions']
      if (Array.isArray(existing) && existing.length > 0) return
      window.localStorage.setItem(
        storageKey as string,
        JSON.stringify({ ...data, ...(JSON.parse(seedJson as string) as object) }),
      )
    },
    [
      'founders-quest:v3',
      JSON.stringify({ assumptions: [A4_GUARDIAN], evidence: A4_LEDGER }),
    ],
  )
  await page.goto('/')
  await waitForWorldReady(page)

  // 1: the circle from the field — challenger menhir, braziers, golden thread
  await tabToTarget(page, 'arena')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${DIR}/01-arena-setpiece.png` })

  // 2: the press — poise, strike, the world holding the frame
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${DIR}/02-arena-press.png` })

  // 3: the citation window broken open early (four strikes at dies-weight)
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/03-citation-window.png` })

  // 4: the golden thread ignited (verdict recorded, finisher persistent)
  await page.getByTestId('arena-cite-2').press('Enter')
  await page.getByTestId('arena-verdict-tripped').press('Enter')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/04-thread-ignited.png` })

  // 5: the shatter — both-outcomes-win staging
  await page.getByTestId('arena-finisher').press('Enter')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/05-shatter.png` })

  // 6-7: the rite over the live world — vigil, then the verbatim eulogy
  await page.getByTestId('arena-to-rite').press('Enter')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${DIR}/06-rite-vigil.png` })
  await page.getByTestId('rite-continue').press('Enter')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/07-rite-eulogy.png` })

  // 8: committal sealed → the graveside (tombstone by the circle)
  await page.getByTestId('rite-continue').press('Enter')
  await page.getByTestId('rite-line').fill('It was never everyone.')
  await page.getByTestId('rite-seal').press('Enter')
  await page.getByTestId('rite-done').press('Enter')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${DIR}/08-graveside.png` })
})
