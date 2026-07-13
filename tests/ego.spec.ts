// tests/ego.spec.ts — the Ego's derivation (A5). The centerpiece is the
// OUTRANKING INVARIANT property test: across seeded-random records, capturing
// an assumption and resolving it at E2+ never leaves the founder worse off
// against the Ego than not capturing it at all — on EVERY axis the formula
// has. The formula is tuned to this test, never the reverse (addendum §8).

import { describe, expect, it } from 'vitest'
import {
  EGO_BASE_HP,
  EGO_EDGE_CAP,
  EGO_HP_PER_GHOST,
  EGO_HP_PER_WEIGHT,
  EGO_PHASES,
  EGO_SOURCE_ID,
  citationLands,
  damagePhaseFor,
  deriveEgo,
  egoCiteDamage,
  egoIntegrated,
  resolvedAtE2Plus,
} from '../src/core/ego'
import { withDefaults } from '../src/core/schema'
import type {
  Assumption,
  EvidenceEntry,
  EvidenceTier,
  Importance,
  QuestData,
} from '../src/core/schema'

const MILESTONES = ['s8-m1', 's8-m2', 's8-m3'] as const

function guardian(over: Partial<Assumption>): Assumption {
  return {
    id: 'g',
    statement: 'a belief',
    originStageId: 's1',
    importance: 'wobbles',
    status: 'untested',
    killCriterion: 'sealed line',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }
}

function coin(over: Partial<EvidenceEntry>): EvidenceEntry {
  return {
    id: 'e',
    tier: 2,
    text: 'their words',
    source: 'call',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-02',
    ...over,
  }
}

function data(over: Partial<QuestData>): QuestData {
  return withDefaults({ ...over })
}

describe('deriveEgo — assembled from the real record, never stored', () => {
  it('HP = base + weight of the UNTESTED/testing pool + the ghosts', () => {
    const d = data({
      assumptions: [
        guardian({ id: 'u1', importance: 'dies' }), // +3 weight
        guardian({ id: 'u2', importance: 'shrugs', status: 'testing' }), // +1
        guardian({ id: 'done', status: 'invalidated' }), // excluded (resolved)
        guardian({ id: 'fl', firstLight: true }), // excluded (tutorial)
      ],
      funerals: [
        { guardianId: 'done', skippedAt: 't' }, // one restless ghost
      ],
    })
    const ego = deriveEgo(d, MILESTONES)
    expect(ego.hp).toBe(EGO_BASE_HP + 4 * EGO_HP_PER_WEIGHT + 1 * EGO_HP_PER_GHOST)
    expect(ego.ghostIds).toEqual(['done'])
    expect(ego.untestedIds).toEqual(['u1']) // projection ammo = strictly untested
  })

  it('shields are the overridden gates, each carrying its logged reason verbatim', () => {
    const d = data({
      gates: {
        act1: { status: 'overridden', reason: 'shipping anyway — investor demo', date: 't' },
        act2: { status: 'passed', date: 't' },
      },
    })
    expect(deriveEgo(d, MILESTONES).shields).toEqual([
      { gateId: 'act1', reason: 'shipping anyway — investor demo' },
    ])
  })

  it('a delayed funeral removes the ghost — the Ego loses that weapon', () => {
    const skipped = data({ funerals: [{ guardianId: 'x', skippedAt: 't' }] })
    const laid = data({ funerals: [{ guardianId: 'x', skippedAt: 't', heldAt: 't2' }] })
    expect(deriveEgo(skipped, MILESTONES).hp - deriveEgo(laid, MILESTONES).hp).toBe(
      EGO_HP_PER_GHOST,
    )
    expect(deriveEgo(laid, MILESTONES).ghostIds).toEqual([])
  })

  it('founderEdge counts E2+-resolved assumptions, capped', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      guardian({ id: `r${i}`, status: 'validated' }),
    )
    const links = many.map((a, i) => coin({ id: `e${i}`, tier: 2, linkedAssumptionIds: [a.id] }))
    const d = data({ assumptions: many, evidence: links })
    expect(resolvedAtE2Plus(d)).toBe(5)
    expect(deriveEgo(d, MILESTONES).founderEdge).toBe(EGO_EDGE_CAP)
  })

  it('an unproven resolution (tier < 2) earns no edge', () => {
    const d = data({ assumptions: [guardian({ id: 'r', status: 'invalidated' })] })
    expect(resolvedAtE2Plus(d)).toBe(0)
  })
})

describe('the phase ladder (deterministic; B2 holds against the Ego too)', () => {
  const opts = { sealed: false, cutsChain: false }

  it('E0/E1 never land in ANY phase', () => {
    for (const phase of EGO_PHASES) {
      expect(citationLands(phase, 0, { sealed: true, cutsChain: true })).toBe(false)
      expect(citationLands(phase, 1, { sealed: true, cutsChain: true })).toBe(false)
    }
  })

  it('denial: only E3/E4 land — denial cannot survive Gold', () => {
    expect(citationLands('denial', 2, opts)).toBe(false)
    expect(citationLands('denial', 3, opts)).toBe(true)
    expect(citationLands('denial', 4, opts)).toBe(true)
  })

  it('rationalization: only sealed-criterion evidence lands (the thread cannot be re-framed)', () => {
    expect(citationLands('rationalization', 4, { sealed: false, cutsChain: false })).toBe(false)
    expect(citationLands('rationalization', 2, { sealed: true, cutsChain: false })).toBe(true)
  })

  it('projection and identity-fusion take NO damage — fusion cannot be won by damage', () => {
    for (const tier of [2, 3, 4] as const) {
      expect(citationLands('projection', tier, { sealed: true, cutsChain: true })).toBe(false)
      expect(citationLands('identity-fusion', tier, { sealed: true, cutsChain: true })).toBe(
        false,
      )
    }
  })

  it('sunk-cost: cut by proof the investment was not returning, or by Gold', () => {
    expect(citationLands('sunk-cost', 2, { sealed: false, cutsChain: true })).toBe(true)
    expect(citationLands('sunk-cost', 4, opts)).toBe(true)
    expect(citationLands('sunk-cost', 2, opts)).toBe(false)
  })

  it('damage phases hand over at 2/3 and 1/3 of max HP', () => {
    expect(damagePhaseFor(12, 12)).toBe('denial')
    expect(damagePhaseFor(12, 9)).toBe('denial')
    expect(damagePhaseFor(12, 8)).toBe('rationalization')
    expect(damagePhaseFor(12, 5)).toBe('rationalization')
    expect(damagePhaseFor(12, 4)).toBe('sunk-cost')
    expect(damagePhaseFor(12, 0)).toBe('sunk-cost')
  })

  it('the edge sharpens every landed cite, capped', () => {
    expect(egoCiteDamage(3, 0)).toBe(4)
    expect(egoCiteDamage(3, 1)).toBe(5)
    expect(egoCiteDamage(3, 99)).toBe(4 + EGO_EDGE_CAP)
    expect(egoCiteDamage(0, 99)).toBe(EGO_EDGE_CAP) // never reached: E0 never lands
  })
})

describe('the capstone derivation (no new schema key)', () => {
  it('integration = a wisdomCodex line from the Ego, and only that', () => {
    expect(egoIntegrated(data({}))).toBe(false)
    const other = data({
      wisdomCodex: [{ id: 'w1', text: 'x', sourceGuardianId: 'g1', date: 't' }],
    })
    expect(egoIntegrated(other)).toBe(false)
    const integrated = data({
      wisdomCodex: [
        { id: 'w2', text: 'I am not my idea.', sourceGuardianId: EGO_SOURCE_ID, date: 't' },
      ],
    })
    expect(egoIntegrated(integrated)).toBe(true)
  })
})

// ---- THE OUTRANKING INVARIANT (property test, seeded — deterministic) ----

/** small LCG so the sweep is reproducible run to run */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const IMPORTANCES: readonly Importance[] = ['dies', 'wobbles', 'shrugs']

function randomRecord(rand: () => number, tag: string): QuestData {
  const assumptions: Assumption[] = []
  const evidence: EvidenceEntry[] = []
  const n = Math.floor(rand() * 6)
  for (let i = 0; i < n; i += 1) {
    const id = `${tag}-a${i}`
    const roll = rand()
    const status =
      roll < 0.4 ? 'untested' : roll < 0.6 ? 'testing' : roll < 0.8 ? 'validated' : 'invalidated'
    assumptions.push(
      guardian({
        id,
        importance: IMPORTANCES[Math.floor(rand() * 3)] ?? 'shrugs',
        status,
        firstLight: rand() < 0.15 ? true : undefined,
      }),
    )
    if (rand() < 0.7) {
      evidence.push(
        coin({
          id: `${tag}-e${i}`,
          tier: Math.floor(rand() * 5) as EvidenceTier,
          linkedAssumptionIds: [id],
        }),
      )
    }
  }
  const gates: QuestData['gates'] = {}
  if (rand() < 0.4) gates.act1 = { status: 'overridden', reason: 'pushed through', date: 't' }
  if (rand() < 0.3) gates.act2 = { status: rand() < 0.5 ? 'passed' : 'overridden', date: 't' }
  const funerals: QuestData['funerals'] = []
  const dead = assumptions.filter((a) => a.status === 'invalidated')
  for (const a of dead) {
    if (rand() < 0.5) {
      funerals.push(
        rand() < 0.5
          ? { guardianId: a.id, skippedAt: 't' }
          : { guardianId: a.id, skippedAt: 't', heldAt: 't2' },
      )
    }
  }
  const milestones: Record<string, boolean> = {}
  for (const id of MILESTONES) milestones[id] = rand() < 0.5
  return data({ assumptions, evidence, gates, funerals, milestones })
}

describe('THE INVARIANT THAT OUTRANKS THE FORMULA (addendum §8)', () => {
  it('capture + resolve at E2+ is NEVER worse than not capturing — 200 seeded states', () => {
    const rand = lcg(0xf0cade) // fixed seed — the sweep is identical every run
    for (let iter = 0; iter < 200; iter += 1) {
      const without = randomRecord(rand, `s${iter}`)
      // the founder captures one more belief and RESOLVES it at E2+
      const outcome = rand() < 0.5 ? 'validated' : 'invalidated'
      const captured = guardian({
        id: `s${iter}-captured`,
        importance: IMPORTANCES[Math.floor(rand() * 3)] ?? 'dies',
        status: outcome,
      })
      const proof = coin({
        id: `s${iter}-proof`,
        tier: (2 + Math.floor(rand() * 3)) as EvidenceTier, // E2..E4
        linkedAssumptionIds: [captured.id],
      })
      const withResolved: QuestData = {
        ...without,
        assumptions: [...without.assumptions, captured],
        evidence: [...without.evidence, proof],
      }
      const before = deriveEgo(without, MILESTONES)
      const after = deriveEgo(withResolved, MILESTONES)

      // every axis the formula has — never worse off:
      expect(after.hp).toBeLessThanOrEqual(before.hp)
      expect(after.founderEdge).toBeGreaterThanOrEqual(before.founderEdge)
      expect(after.divergence).toBeLessThanOrEqual(before.divergence + 1e-9)
      expect(after.shields).toEqual(before.shields)
      expect(after.ghostIds).toEqual(before.ghostIds)
      for (const tier of [2, 3, 4] as const) {
        expect(egoCiteDamage(tier, after.founderEdge)).toBeGreaterThanOrEqual(
          egoCiteDamage(tier, before.founderEdge),
        )
      }
    }
  })
})
