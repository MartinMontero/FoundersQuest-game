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
  await page.goto('/?render=constrained') // P0-4: rigged rogue, never the capsule (full-tier postFX is untenable in software GL)
  await waitForWorldReady(page)
  await page.waitForTimeout(2500) // let rogue.glb stream + skin before any shot
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
  await page.goto('/?render=constrained') // P0-4: rigged rogue, never the capsule (full-tier postFX is untenable in software GL)
  await waitForWorldReady(page)
  await page.waitForTimeout(2500) // let rogue.glb stream + skin before any shot

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

// ---- A5: the Ego at the W8 Launch Threshold ----

test('feel pack a5: threshold monolith, offer, denial, projection, fusion, integration', async ({
  page,
}) => {
  test.skip(PHASE !== 'a5', 'a5 shots run under FEEL_PACK_PHASE=a5')
  mkdirSync(DIR, { recursive: true })

  // the exact record + drive proven in e2e/ego.spec.ts test 1 — with shots
  await seedFounderName(page)
  await page.addInitScript(
    ([storageKey, seedJson]) => {
      window.localStorage.setItem('founders-quest:journey', '8')
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
      JSON.stringify({
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
          { id: 'e-hunch', tier: 0, text: 'gut says launch now', source: '', linkedAssumptionIds: [], stageId: '', date: '2026-07-02' },
          { id: 'e-deed', tier: 3, text: 'watched three teams route around the tool', source: 'shadowing', linkedAssumptionIds: [], stageId: 's4', date: '2026-07-03' },
          { id: 'e-gold', tier: 4, text: 'two paid pilots signed', source: 'contracts', linkedAssumptionIds: [], stageId: 's7', date: '2026-07-04' },
          { id: 'e-sealed', tier: 2, text: '"we lose every Friday afternoon to this"', source: 'interview 7', linkedAssumptionIds: ['sealed-g'], stageId: 's1', date: '2026-07-05' },
          { id: 'e-dead', tier: 2, text: '"I would not pay for this today"', source: 'pricing call', linkedAssumptionIds: ['dead-g'], stageId: 's5', date: '2026-07-06' },
        ],
        gates: {
          act1: { status: 'overridden', reason: 'demo day pressure — crossed unready', date: '2026-07-07' },
        },
        funerals: [{ guardianId: 'dead-g', skippedAt: '2026-07-09T01:00:00.000Z' }],
      }),
    ],
  )
  await page.goto('/?render=constrained') // P0-4: rigged rogue, never the capsule (full-tier postFX is untenable in software GL)
  await waitForWorldReady(page)
  await page.waitForTimeout(2500) // let rogue.glb stream + skin before any shot

  // 1: the monolith at the pad's threshold · 2: the offer over the live world
  await tabToTarget(page, 'ego-gate')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${DIR}/01-threshold.png` })
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${DIR}/02-offer.png` })

  // 3: denial (conviction 14, walls 1, the unmourned 1)
  await page.getByTestId('ego-enter').press('Enter')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/03-denial.png` })

  // 4: the wall breaks, naming the founder's own override reason
  await page.getByTestId('ego-cite-2').press('Enter') // E3 → absorbed by the wall
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/04-wall-breaks.png` })

  // 5: rationalization after Gold lands
  await page.getByTestId('ego-cite-3').press('Enter') // E4 → 14→6
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/05-rationalization.png` })

  // 6: projection — the untested belief thrown back
  await page.getByTestId('ego-cite-4').press('Enter') // sealed E2 → 6→2
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/06-projection.png` })

  // 7: identity-fusion after the chain is cut
  await page.getByTestId('ego-return-1').press('Enter')
  await page.getByTestId('ego-cite-5').press('Enter') // the chain cutter → 0
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/07-fusion.png` })

  // 8: the integration — it does not die; it sits down beside you
  await page.getByTestId('ego-line').fill('I am not my idea. I am the one who tests it.')
  await page.getByTestId('ego-integrate').press('Enter')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${DIR}/08-integration.png` })
})


// ---- the per-world feel gate (E-1..E-8): one spawn shot + one set-piece-side
// ---- shot per world, on the constrained tier (rigged rogue, real palette)

test('feel pack worlds: spawn + set-piece sightline for every world', async ({ page }) => {
  test.skip(PHASE !== 'worlds', 'world shots run under FEEL_PACK_PHASE=worlds')
  test.setTimeout(1_200_000)
  mkdirSync(DIR, { recursive: true })

  await seedFounderName(page)
  for (let stage = 1; stage <= 8; stage += 1) {
    await page.addInitScript((n) => {
      window.localStorage.setItem('founders-quest:journey', String(n))
    }, stage)
    await page.goto('/?render=constrained')
    await waitForWorldReady(page)
    await page.waitForTimeout(2200) // rogue + dressing settle
    await page.screenshot({ path: `${DIR}/w${stage}-1-spawn.png` })
    // approach the landmark: camera spawns facing -z; W+A drives northwest —
    // straight toward the SETPIECE_ANCHOR quarter (~35u in ~8s of run)
    await page.keyboard.down('KeyW')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(7500)
    await page.keyboard.up('KeyW')
    await page.keyboard.up('KeyA')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${DIR}/w${stage}-2-setpiece-side.png` })
  }
})

// ---- E-9 gate: the Chart with a LIVED record at the crowded end (W7/W8) —
// ---- staggered two-line labels + per-world Truth/Action pips, no collisions

const E9_RECORD = {
  chartUnlocked: true,
  assumptions: [
    // W1: one proven kill, one open — pips ● ○ + a tombstone
    { id: 'g1', statement: 'Everyone has this', originStageId: 's1', importance: 'dies',
      status: 'invalidated', killCriterion: 'k', createdAt: '2026-07-01T00:00:00.000Z' },
    { id: 'g2', statement: 'They want a dashboard', originStageId: 's1', importance: 'hurts',
      status: 'untested', killCriterion: 'k', createdAt: '2026-07-01T00:00:00.000Z' },
    // W7: seven beliefs — the pip cap + "+n" tail under the crowded label
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `g7-${i}`, statement: `W7 belief ${i}`, originStageId: 's7',
      importance: 'hurts', status: i < 2 ? 'validated' : 'untested',
      killCriterion: 'k', createdAt: '2026-07-01T00:00:00.000Z',
    })),
    // W8: one resolved on the founder's word alone — the half pip ◐
    { id: 'g8', statement: 'The price holds', originStageId: 's8', importance: 'dies',
      status: 'validated', killCriterion: 'k', createdAt: '2026-07-01T00:00:00.000Z' },
  ],
  evidence: [
    { id: 'ev1', tier: 3, text: 'watched them do it', source: 'visit', linkedAssumptionIds: ['g1'],
      stageId: 's1', date: '2026-07-02' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `ev7-${i}`, tier: 2, text: `"quote ${i}"`, source: 'interview',
      linkedAssumptionIds: i < 2 ? [`g7-${i}`] : [], stageId: 's7', date: '2026-07-03',
    })),
  ],
}

// ---- E-10/E-11 gate: the Cartographer's raven present at First Light, the
// ---- chart mid-unfurl, and the credits page — all on the constrained tier

test('feel pack e10: raven at the threshold, chart unfurl, credits page', async ({ page }) => {
  test.skip(PHASE !== 'e10', 'e10 shots run under FEEL_PACK_PHASE=e10')
  test.setTimeout(600_000) // three full world boots on software GL
  mkdirSync(DIR, { recursive: true })

  // 1: the raven during the DIALOGUE (letterboxed, world visible — the
  // invitation card blurs the backdrop, so the shot comes after accepting)
  await seedFounderName(page, 'Tester', { freshOpening: true })
  await page.goto('/?render=constrained')
  await waitForWorldReady(page)
  await page.waitForTimeout(2500) // rogue + raven settle
  await page.getByTestId('opening-accept').press('Enter')
  await page.waitForTimeout(1400) // typewriter inks; camera holds the world
  await page.screenshot({ path: `${DIR}/01-raven-at-first-light.png` })

  // 2: the settled chart (the 650ms unfurl itself outruns software-GL
  // screenshot latency — its presence is asserted by computed style in the
  // firstlight e2e instead; the shot records the destination frame)
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
  await page.keyboard.press('KeyM')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${DIR}/02-chart-settled.png` })
  await page.keyboard.press('Escape')

  // 3: the credits page — from the campfire desk (W2: W1 has no campfire)
  await page.addInitScript(() => {
    window.localStorage.setItem('founders-quest:journey', '2')
  })
  await page.reload()
  await waitForWorldReady(page)
  await tabToTarget(page, 'campfire')
  await page.keyboard.press('KeyE')
  await page.getByTestId('campfire-credits').press('Enter')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}/03-credits.png` })
})

test('feel pack e9: chart at W7 and W8 — labels clear, pips honest', async ({ page }) => {
  test.skip(PHASE !== 'e9', 'e9 shots run under FEEL_PACK_PHASE=e9')
  mkdirSync(DIR, { recursive: true })

  await seedFounderName(page)
  await page.addInitScript(
    ([storageKey, seedJson]) => {
      const raw = window.localStorage.getItem(storageKey as string)
      const data = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>)
      window.localStorage.setItem(
        storageKey as string,
        JSON.stringify({ ...data, ...(JSON.parse(seedJson as string) as object) }),
      )
    },
    ['founders-quest:v3', JSON.stringify(E9_RECORD)] as const,
  )
  for (const stage of [7, 8] as const) {
    await page.addInitScript((n) => {
      window.localStorage.setItem('founders-quest:journey', String(n))
    }, stage)
    await page.goto('/?render=constrained')
    await waitForWorldReady(page)
    await page.keyboard.press('KeyM')
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${DIR}/chart-w${stage}.png` })
    await page.keyboard.press('Escape')
  }
})
