// tests/earned-hunch.spec.ts — the Earned Hunch invariants (Mind & Myth A2;
// v3 §3.3 blocks 1, 5, 6, 7). The constitutional floor, as executable checks:
//   - provenance is UNREADABLE by tierOf/Truth/XP (static + mutation tests)
//   - capture is one commit with provenance untouched (D-M)
//   - calibration entries never alter any metric
//   - the earned bump reorders ONLY the priority queue
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { riskiest, seededFromEarnedHunch, tierOf, truth, xp } from '../src/core/metrics'
import {
  STORAGE_KEY,
  withDefaults,
  type Assumption,
  type EvidenceEntry,
  type HunchProvenance,
  type QuestData,
} from '../src/core/schema'
import { createQuestStore } from '../src/state/store'
import { EARNED_HUNCH_BUMP } from '../src/state/tunables'
import { tallyByRung } from '../src/ui/CalibrationPanel'

const FIXED_NOW = '2026-07-11T12:00:00.000Z'

function makeDeps() {
  const map = new Map<string, string>()
  let n = 0
  return {
    map,
    deps: {
      store: {
        get: (k: string) => map.get(k) ?? null,
        set: (k: string, v: string) => void map.set(k, v),
        remove: (k: string) => void map.delete(k),
        degraded: false,
      },
      now: () => FIXED_NOW,
      makeId: (prefix: string) => `${prefix}-${++n}`,
    },
  }
}

function guardian(id: string, over: Partial<Assumption> = {}): Assumption {
  return {
    id,
    statement: `statement ${id}`,
    originStageId: 's1',
    importance: 'dies',
    status: 'untested',
    killCriterion: 'k',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }
}

function hunch(id: string, linked: string[] = [], provenance?: HunchProvenance): EvidenceEntry {
  const e: EvidenceEntry = {
    id,
    tier: 0,
    text: `whisper ${id}`,
    source: '',
    linkedAssumptionIds: linked,
    stageId: '',
    date: '2026-07-02',
  }
  if (provenance !== undefined) e.provenance = provenance
  return e
}

function e2(id: string, linked: string[]): EvidenceEntry {
  return {
    id,
    tier: 2,
    text: 'their words',
    source: 'call',
    linkedAssumptionIds: linked,
    stageId: 's2',
    date: '2026-07-03',
  }
}

function data(over: Partial<QuestData>): QuestData {
  return { ...withDefaults(null), ...over }
}

// ---------------------------------------------------------------------------
// Invariant 1 — provenance is unreadable by tierOf/Truth/XP
// ---------------------------------------------------------------------------

describe('provenance is unreadable by tierOf/Truth/XP', () => {
  it('STATIC: the tierOf/truth/xp function bodies never mention provenance', () => {
    const source = readFileSync(join(__dirname, '..', 'src', 'core', 'metrics.ts'), 'utf8')
    for (const name of ['tierOf', 'truth', 'xp']) {
      const start = source.indexOf(`export function ${name}(`)
      expect(start).toBeGreaterThan(-1)
      // the body ends before the NEXT declaration's docblock — stop at whichever
      // of `/**` or `export` comes first so a neighbor's JSDoc never bleeds in
      const nextDoc = source.indexOf('/**', start + 1)
      const nextExport = source.indexOf('export', start + 1)
      const candidates = [nextDoc, nextExport].filter((i) => i !== -1)
      const end = candidates.length > 0 ? Math.min(...candidates) : undefined
      const body = source.slice(start, end)
      expect(body.includes('provenance')).toBe(false)
    }
  })

  it('MUTATION: sweeping provenance across every rung (and off) moves no metric', () => {
    const base = data({
      assumptions: [
        guardian('g-1', { status: 'validated' }),
        guardian('g-2', { status: 'invalidated', importance: 'wobbles' }),
        guardian('g-3'),
      ],
      evidence: [
        hunch('h-1', ['g-1']),
        hunch('h-2', ['g-3']),
        e2('e-1', ['g-1']),
        e2('e-2', ['g-2']),
      ],
      calibration: [{ hunchEvidenceId: 'h-1', taggedAt: FIXED_NOW }],
    })
    const baselineTruth = truth(base)
    const baselineXp = xp(base)
    const baselineTiers = base.assumptions.map((a) => tierOf(a, base.evidence))

    const sweeps: (HunchProvenance | undefined)[] = ['earned', 'adjacent', 'wild', 'borrowed', undefined]
    for (const rung of sweeps) {
      const mutated = data({
        ...base,
        evidence: base.evidence.map((e) => {
          const next = { ...e }
          if (rung === undefined) delete next.provenance
          else if (next.tier === 0) next.provenance = rung
          return next
        }),
      })
      expect(truth(mutated)).toBe(baselineTruth)
      expect(xp(mutated)).toBe(baselineXp)
      expect(mutated.assumptions.map((a) => tierOf(a, mutated.evidence))).toEqual(baselineTiers)
    }
  })

  it('linking an E0 hunch to a guardian never raises its derived tier', () => {
    const g = guardian('g-1')
    expect(tierOf(g, [hunch('h-1', ['g-1'], 'earned')])).toBe(0)
    expect(tierOf(g, [hunch('h-1', ['g-1'], 'earned'), e2('e-1', ['g-1'])])).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Invariant 2 — capture is one commit, provenance untouched (D-M)
// ---------------------------------------------------------------------------

describe('hunch capture (D-M: two taps, zero justification)', () => {
  it('addHunch is a single action producing an E0 entry with NO provenance', () => {
    const { map, deps } = makeDeps()
    const store = createQuestStore(deps)
    const before = map.size
    const entry = store.getState().addHunch('cafés would pay for this')
    expect(entry).toEqual({
      id: 'evidence-1',
      tier: 0,
      text: 'cafés would pay for this',
      source: '',
      linkedAssumptionIds: [],
      stageId: '',
      date: FIXED_NOW,
    })
    expect('provenance' in entry).toBe(false)
    expect(map.size).toBeGreaterThanOrEqual(before) // persisted through the ladder
    expect(store.getState().data.calibration).toEqual([]) // no row until a tag
  })
})

// ---------------------------------------------------------------------------
// tagHunch — optional, post-capture, editable; opens the calibration row once
// ---------------------------------------------------------------------------

describe('tagHunch', () => {
  it('tags tier-0 only, opens ONE calibration row, keeps taggedAt across re-tags', () => {
    const store = createQuestStore(makeDeps().deps)
    const h = store.getState().addHunch('a whisper')
    store.getState().tagHunch(h.id, 'wild')
    expect(store.getState().data.evidence[0]?.provenance).toBe('wild')
    expect(store.getState().data.calibration).toEqual([
      { hunchEvidenceId: h.id, taggedAt: FIXED_NOW },
    ])
    // re-tag switches the rung, does not duplicate the row
    store.getState().tagHunch(h.id, 'earned')
    expect(store.getState().data.evidence[0]?.provenance).toBe('earned')
    expect(store.getState().data.calibration).toHaveLength(1)
  })

  it('refuses to tag a non-hunch (tier>0) entry', () => {
    const store = createQuestStore(makeDeps().deps)
    const coin = store.getState().addEvidence({
      tier: 2,
      text: 'quote',
      source: 'call',
      linkedAssumptionIds: [],
      stageId: 's2',
    })
    store.getState().tagHunch(coin.id, 'earned')
    expect(store.getState().data.evidence[0] !== undefined && 'provenance' in store.getState().data.evidence[0]!).toBe(false)
    expect(store.getState().data.calibration).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// seedGuardianFromHunch — the test bench
// ---------------------------------------------------------------------------

describe('seedGuardianFromHunch', () => {
  it('creates the guardian from the hunch text and links the hunch (tier stays 0)', () => {
    const store = createQuestStore(makeDeps().deps)
    const h = store.getState().addHunch('regulars would prepay')
    const g = store.getState().seedGuardianFromHunch(h.id, 'dies', 'ask 5; 4 refuse', 's1')
    expect(g).toMatchObject({
      statement: 'regulars would prepay',
      importance: 'dies',
      status: 'untested',
      killCriterion: 'ask 5; 4 refuse',
      originStageId: 's1',
    })
    const { data: d } = store.getState()
    expect(d.evidence[0]?.linkedAssumptionIds).toEqual([g?.id])
    expect(tierOf(d.assumptions[0]!, d.evidence)).toBe(0)
  })

  it('returns null (and writes nothing) for a non-hunch id', () => {
    const store = createQuestStore(makeDeps().deps)
    expect(store.getState().seedGuardianFromHunch('nope', 'dies', '', 's1')).toBeNull()
    expect(store.getState().data.assumptions).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Invariant 3 — the bump reorders ONLY the priority queue
// ---------------------------------------------------------------------------

describe('earned-hunch priority bump', () => {
  const plain = guardian('g-a', { createdAt: '2026-07-01T00:00:00.000Z' })
  const seeded = guardian('g-b', { createdAt: '2026-07-05T00:00:00.000Z' }) // later — loses ties
  const fixture = data({
    assumptions: [plain, seeded],
    evidence: [hunch('h-1', ['g-b'], 'earned')],
  })

  it('without the bump the earlier guardian wins the tie; with it the seeded one leads', () => {
    expect(riskiest(fixture)?.id).toBe('g-a')
    expect(riskiest(fixture, EARNED_HUNCH_BUMP)?.id).toBe('g-b')
    expect(seededFromEarnedHunch(seeded, fixture.evidence)).toBe(true)
    expect(seededFromEarnedHunch(plain, fixture.evidence)).toBe(false)
  })

  it('only Earned seeds bump — other rungs do not', () => {
    for (const rung of ['adjacent', 'wild', 'borrowed'] as const) {
      const f = data({
        assumptions: [plain, seeded],
        evidence: [hunch('h-1', ['g-b'], rung)],
      })
      expect(riskiest(f, EARNED_HUNCH_BUMP)?.id).toBe('g-a')
    }
  })

  it('the bump never touches Truth or XP', () => {
    expect(truth(fixture)).toBe(0) // nothing resolved — bump changes nothing
    expect(xp(fixture)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Invariant 4 — calibration entries never alter any metric; resolution at E2+
// ---------------------------------------------------------------------------

describe('the calibration record', () => {
  it('rows never alter Truth/XP/tierOf (mutation test on calibration[])', () => {
    const base = data({
      assumptions: [guardian('g-1', { status: 'invalidated' })],
      evidence: [e2('e-1', ['g-1']), hunch('h-1', ['g-1'], 'earned')],
    })
    const withRows = data({
      ...base,
      calibration: [
        { hunchEvidenceId: 'h-1', taggedAt: FIXED_NOW, resolvedAt: FIXED_NOW, outcome: 'broke' },
      ],
    })
    expect(truth(withRows)).toBe(truth(base))
    expect(xp(withRows)).toBe(xp(base))
    expect(tierOf(withRows.assumptions[0]!, withRows.evidence)).toBe(
      tierOf(base.assumptions[0]!, base.evidence),
    )
  })

  it('a funeral resolves the seeded hunch "broke" — but ONLY at derived tier ≥ 2', () => {
    const { map, deps } = makeDeps()
    const store = createQuestStore(deps)
    const h = store.getState().addHunch('regulars would prepay')
    store.getState().tagHunch(h.id, 'earned')
    const g = store.getState().seedGuardianFromHunch(h.id, 'dies', 'ask 5', 's1')

    // resolve WITHOUT E2 evidence: the funeral stands but the record stays open
    store.getState().invalidateAssumption(g!.id)
    expect(store.getState().data.calibration[0]?.outcome).toBeUndefined()

    // fresh store: same path but with E2 linked before the funeral → 'broke'
    void map
    const store2 = createQuestStore(makeDeps().deps)
    const h2 = store2.getState().addHunch('regulars would prepay')
    store2.getState().tagHunch(h2.id, 'earned')
    const g2 = store2.getState().seedGuardianFromHunch(h2.id, 'dies', 'ask 5', 's1')
    store2.getState().addEvidence({
      tier: 2,
      text: '"never prepaid in 20 years"',
      source: 'Priya, call',
      linkedAssumptionIds: [g2!.id],
      stageId: 's2',
    })
    store2.getState().invalidateAssumption(g2!.id)
    expect(store2.getState().data.calibration[0]).toEqual({
      hunchEvidenceId: h2.id,
      taggedAt: FIXED_NOW,
      resolvedAt: FIXED_NOW,
      outcome: 'broke',
    })
  })

  it('tallyByRung reads the hunch’s CURRENT rung and counts held/resolved/total', () => {
    const rows = [
      { hunchEvidenceId: 'h-1', taggedAt: FIXED_NOW, resolvedAt: FIXED_NOW, outcome: 'held' as const },
      { hunchEvidenceId: 'h-2', taggedAt: FIXED_NOW, resolvedAt: FIXED_NOW, outcome: 'broke' as const },
      { hunchEvidenceId: 'h-3', taggedAt: FIXED_NOW },
      { hunchEvidenceId: 'h-missing', taggedAt: FIXED_NOW }, // no matching hunch → tallies nowhere
    ]
    const evidence = [hunch('h-1', [], 'earned'), hunch('h-2', [], 'earned'), hunch('h-3', [], 'wild')]
    const t = tallyByRung(rows, evidence)
    expect(t.earned).toEqual({ held: 1, resolved: 2, total: 2 })
    expect(t.wild).toEqual({ held: 0, resolved: 0, total: 1 })
    expect(t.adjacent.total).toBe(0)
  })

  it('no key store is ever touched by the new actions', () => {
    const { map, deps } = makeDeps()
    const store = createQuestStore(deps)
    const h = store.getState().addHunch('x')
    store.getState().tagHunch(h.id, 'earned')
    store.getState().seedGuardianFromHunch(h.id, 'dies', '', 's1')
    expect([...map.keys()].every((k) => k === STORAGE_KEY)).toBe(true)
  })
})
