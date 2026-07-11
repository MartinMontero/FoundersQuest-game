// tests/confrontation.spec.ts — the A4 invariants, each shipped as a unit test
// (addendum conventions). The three Gate-0 rulings are pinned here:
// B2 bounce-is-feedback · B3 no-inverse-HP · finisher-never-RNG. Plus the
// funeral queue derivations (trough queueing is asserted at the offer level).

import { describe, expect, it } from 'vitest'
import {
  ARGUMENT_HP,
  CITATION_DAMAGE,
  COMPOSURE,
  applyCitation,
  arenaChallenger,
  argumentSpent,
  argumentStateFrom,
  finisherAvailable,
  funeralFor,
  initialArgumentState,
  openConfrontation,
  pendingFunerals,
  restlessGhosts,
} from '../src/core/confrontation'
import { riskiest, trough } from '../src/core/metrics'
import { withDefaults } from '../src/core/schema'
import type {
  Assumption,
  ConfrontationRecord,
  EvidenceTier,
  QuestData,
} from '../src/core/schema'

function guardian(over: Partial<Assumption> = {}): Assumption {
  return {
    id: 'g1',
    statement: 'Everyone has this problem',
    originStageId: 's1',
    importance: 'dies',
    status: 'untested',
    killCriterion: 'Fewer than 3 of 10 name it unprompted',
    createdAt: '2026-07-11T00:00:00.000Z',
    ...over,
  }
}

function data(over: Partial<QuestData> = {}): QuestData {
  return withDefaults({ ...over })
}

const coin = (id: string, tier: EvidenceTier): { id: string; tier: EvidenceTier } => ({
  id,
  tier,
})

describe('argument sizing (importance weight is the scale)', () => {
  it('dies > wobbles > shrugs in both HP and composure', () => {
    expect(ARGUMENT_HP.dies).toBeGreaterThan(ARGUMENT_HP.wobbles)
    expect(ARGUMENT_HP.wobbles).toBeGreaterThan(ARGUMENT_HP.shrugs)
    expect(COMPOSURE.dies).toBeGreaterThan(COMPOSURE.wobbles)
    expect(COMPOSURE.wobbles).toBeGreaterThan(COMPOSURE.shrugs)
  })

  it('initial state opens at full HP and full composure, unshattered', () => {
    const s = initialArgumentState('dies')
    expect(s).toEqual({
      hpMax: ARGUMENT_HP.dies,
      hp: ARGUMENT_HP.dies,
      composureMax: COMPOSURE.dies,
      composure: COMPOSURE.dies,
      shattered: false,
    })
  })
})

describe('B2 — E0/E1 bounce is PURE feedback', () => {
  it('E0 and E1 deal zero damage by the table', () => {
    expect(CITATION_DAMAGE[0]).toBe(0)
    expect(CITATION_DAMAGE[1]).toBe(0)
  })

  it('a bounce returns the SAME state object — reference-equal, nothing changed', () => {
    const s = initialArgumentState('wobbles')
    for (const tier of [0, 1] as const) {
      const { next, impact } = applyCitation(s, tier)
      expect(impact).toBe('bounce')
      expect(next).toBe(s) // never strengthens the guardian, never penalizes the founder
    }
  })

  it('a bounce mid-sequence changes nothing about the replay', () => {
    const withBounces = argumentStateFrom(
      'dies',
      ['e2', 'hunch', 'e3', 'rumor'],
      [coin('e2', 2), coin('hunch', 0), coin('e3', 3), coin('rumor', 1)],
    )
    const without = argumentStateFrom('dies', ['e2', 'e3'], [coin('e2', 2), coin('e3', 3)])
    expect(withBounces).toEqual(without)
  })
})

describe('citation damage — strictly tiered, composure soaks first', () => {
  it('E2 standard hit chips composure before HP', () => {
    const s = initialArgumentState('dies') // composure 4
    const { next, impact } = applyCitation(s, 2)
    expect(impact).toBe('hit')
    expect(next.composure).toBe(2)
    expect(next.hp).toBe(s.hpMax) // fully soaked
  })

  it('E3 heavy hit overflows past a thin shield into HP', () => {
    const s = initialArgumentState('shrugs') // composure 1, hp 5
    const { next, impact } = applyCitation(s, 3) // damage 4
    expect(impact).toBe('heavy')
    expect(next.composure).toBe(0)
    expect(next.hp).toBe(2) // 4 − 1 soaked = 3 to core
  })

  it('E4 shatters the WHOLE shield and lands full damage on the core', () => {
    const s = initialArgumentState('dies') // composure 4, hp 12
    const { next, impact } = applyCitation(s, 4)
    expect(impact).toBe('shatter')
    expect(next.composure).toBe(0) // shattered outright, not soaked
    expect(next.hp).toBe(s.hpMax - CITATION_DAMAGE[4]) // overflow: full 6 to core
    expect(next.shattered).toBe(true)
  })

  it('HP floors at zero — never negative', () => {
    let s = initialArgumentState('shrugs')
    for (let i = 0; i < 5; i += 1) s = applyCitation(s, 4).next
    expect(s.hp).toBe(0)
  })
})

describe('B3 — no inverse HP: a spent argument resolves NOTHING', () => {
  it('argumentSpent is a narration flag, not a verdict', () => {
    let s = initialArgumentState('shrugs')
    s = applyCitation(s, 4).next
    expect(argumentSpent(s)).toBe(true)
    // the finisher still requires the recorded verdict — an open confrontation
    // with every citation landed and hp 0 does NOT ignite the thread
    const record: ConfrontationRecord = {
      guardianId: 'g1',
      startedAt: '2026-07-11T00:00:00.000Z',
      citations: ['e4a', 'e4b'],
    }
    expect(finisherAvailable(record)).toBe(false)
  })
})

describe('the finisher — persistent once the verdict is recorded, never RNG', () => {
  const base: ConfrontationRecord = {
    guardianId: 'g1',
    startedAt: '2026-07-11T00:00:00.000Z',
    citations: [],
  }

  it('unavailable before the verdict, regardless of citations', () => {
    expect(finisherAvailable(base)).toBe(false)
    expect(finisherAvailable({ ...base, citations: ['a', 'b', 'c'] })).toBe(false)
    expect(finisherAvailable(undefined)).toBe(false)
  })

  it('available the moment the verdict is recorded — and STAYS available until used', () => {
    const withVerdict = { ...base, outcome: 'invalidated' as const }
    // deterministic: the same record answers the same way every time (no draw)
    for (let i = 0; i < 100; i += 1) expect(finisherAvailable(withVerdict)).toBe(true)
  })

  it('used = resolved: the thread retires with the strike', () => {
    expect(
      finisherAvailable({
        ...base,
        outcome: 'validated',
        resolvedAt: '2026-07-11T01:00:00.000Z',
      }),
    ).toBe(false)
  })
})

describe('replay determinism (derived, never stored)', () => {
  it('argumentStateFrom equals sequential applyCitation', () => {
    const ledger = [coin('a', 2), coin('b', 3), coin('c', 4), coin('d', 2)]
    const ids = ['a', 'b', 'c', 'd']
    let manual = initialArgumentState('dies')
    for (const id of ids) {
      const entry = ledger.find((e) => e.id === id)
      if (entry !== undefined) manual = applyCitation(manual, entry.tier).next
    }
    expect(argumentStateFrom('dies', ids, ledger)).toEqual(manual)
  })

  it('order matters and is preserved: E4-then-E2 ≠ E2-then-E4 in composure terms', () => {
    const ledger = [coin('e2', 2), coin('e4', 4)]
    const e2First = argumentStateFrom('dies', ['e2', 'e4'], ledger)
    const e4First = argumentStateFrom('dies', ['e4', 'e2'], ledger)
    // E2 first: soaked by shield (hp 12→12), then E4 shatters (hp 6). Total hp 6.
    expect(e2First.hp).toBe(6)
    // E4 first: shield gone + hp 6; then E2 hits bare core: hp 4.
    expect(e4First.hp).toBe(4)
  })

  it('a citation id missing from the ledger degrades to no damage — never fabricated', () => {
    const s = argumentStateFrom('dies', ['ghost-id'], [])
    expect(s).toEqual(initialArgumentState('dies'))
  })
})

describe('openConfrontation', () => {
  it('finds only the unresolved record for the guardian', () => {
    const d = data({
      confrontations: [
        {
          guardianId: 'g1',
          startedAt: 't0',
          resolvedAt: 't1',
          outcome: 'invalidated',
          citations: [],
        },
        { guardianId: 'g1', startedAt: 't2', citations: ['e1'] },
        { guardianId: 'g2', startedAt: 't3', citations: [] },
      ],
    })
    expect(openConfrontation(d, 'g1')?.startedAt).toBe('t2')
    expect(openConfrontation(d, 'g3')).toBeUndefined()
  })
})

describe('arenaChallenger — who steps into the circle (D-A: per-world)', () => {
  const pick = (d: QuestData, stageId: string): string | null =>
    arenaChallenger(d, stageId, (scoped) => riskiest(scoped))

  it('resumes an open confrontation first — the ignited thread persists', () => {
    const d = data({
      assumptions: [
        guardian({ id: 'risky', importance: 'dies' }),
        guardian({ id: 'started', importance: 'shrugs', status: 'testing' }),
      ],
      confrontations: [{ guardianId: 'started', startedAt: 't0', citations: [] }],
    })
    expect(pick(d, 's1')).toBe('started') // resume beats riskier
  })

  it('otherwise the riskiest eligible guardian of THIS world answers', () => {
    const d = data({
      assumptions: [
        guardian({ id: 'w1-light', importance: 'shrugs' }),
        guardian({ id: 'w1-heavy', importance: 'dies' }),
        guardian({ id: 'w2-heavy', importance: 'dies', originStageId: 's2' }),
      ],
    })
    expect(pick(d, 's1')).toBe('w1-heavy')
    expect(pick(d, 's2')).toBe('w2-heavy')
  })

  it('resolved, firstLight, and foreign-world guardians never answer — empty circle', () => {
    const d = data({
      assumptions: [
        guardian({ id: 'done', status: 'invalidated' }),
        guardian({ id: 'fl', firstLight: true }),
        guardian({ id: 'elsewhere', originStageId: 's3' }),
      ],
    })
    expect(pick(d, 's1')).toBeNull()
  })
})

describe('the funeral queue (derived)', () => {
  const dead = guardian({ id: 'dead', status: 'invalidated', resolvedAt: 't1' })
  const alive = guardian({ id: 'alive', status: 'testing' })
  const firstLightKill = guardian({
    id: 'fl',
    status: 'invalidated',
    resolvedAt: 't1',
    firstLight: true,
  })

  it('pending = invalidated, non-firstLight, and NO funeral record at all', () => {
    const d = data({ assumptions: [dead, alive, firstLightKill] })
    expect(pendingFunerals(d).map((a) => a.id)).toEqual(['dead'])
  })

  it('a held OR skipped funeral leaves the queue — a skip is not re-prompted', () => {
    const held = data({
      assumptions: [dead],
      funerals: [{ guardianId: 'dead', heldAt: 't2', epitaph: 'it was never everyone' }],
    })
    const skipped = data({
      assumptions: [dead],
      funerals: [{ guardianId: 'dead', skippedAt: 't2' }],
    })
    expect(pendingFunerals(held)).toEqual([])
    expect(pendingFunerals(skipped)).toEqual([])
  })

  it('restless ghosts = skipped and never since held; laying to rest clears it', () => {
    const skipped = data({ funerals: [{ guardianId: 'dead', skippedAt: 't2' }] })
    expect(restlessGhosts(skipped)).toHaveLength(1)
    const laidToRest = data({
      funerals: [{ guardianId: 'dead', skippedAt: 't2', heldAt: 't3', epitaph: 'rest' }],
    })
    expect(restlessGhosts(laidToRest)).toEqual([]) // the Ego loses that weapon
    expect(funeralFor(laidToRest, 'dead')?.skippedAt).toBe('t2') // history stays honest
  })

  it('the rite never fires in the trough — the offer gates on !trough and queues', () => {
    // the trough itself is canon 02 math (three low readings); the rite offer is
    // pendingFunerals().length > 0 && !trough(data) — asserted here at the same
    // level the UI reads it, so the queueing rule has a unit anchor.
    const low = data({
      assumptions: [dead],
      weather: [
        { id: 'w1', date: '2026-07-09', value: 1 },
        { id: 'w2', date: '2026-07-10', value: 2 },
        { id: 'w3', date: '2026-07-11', value: 1 },
      ],
    })
    expect(pendingFunerals(low)).toHaveLength(1) // still queued...
    expect(trough(low)).toBe(true) // ...but the offer must hold fire
    const clear = data({ assumptions: [dead] })
    expect(trough(clear)).toBe(false) // upswing: the offer may fire
  })
})
