// tests/confrontation-store.spec.ts — the A4 store actions over the pure core:
// start/cite/verdict/finish + the funeral pair. The written record is asserted
// against canon 02's confrontations[]/funerals[]/wisdomCodex shapes, and the
// XP/Truth consequences stay DERIVED (asserted via metrics, never stored).

import { describe, expect, it } from 'vitest'
import { finisherAvailable, openConfrontation, pendingFunerals } from '../src/core/confrontation'
import { truth, xp } from '../src/core/metrics'
import { STORAGE_KEY, withDefaults, type QuestData } from '../src/core/schema'
import type { QuestStore } from '../src/core/store'
import { createQuestStore } from '../src/state/store'
import type { StoreApi } from 'zustand/vanilla'
import type { QuestState } from '../src/state/store'

const FIXED_NOW = '2026-07-11T12:00:00.000Z'

function memoryStore(): QuestStore & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    get: (key) => map.get(key) ?? null,
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
    degraded: false,
  }
}

/** Seed a record, build a store over it, with deterministic clock and ids. */
function makeStore(seed: Partial<QuestData> = {}): {
  store: StoreApi<QuestState>
  persisted: () => QuestData
} {
  const persistence = memoryStore()
  persistence.map.set(STORAGE_KEY, JSON.stringify({ ...withDefaults(null), ...seed }))
  let n = 0
  const store = createQuestStore({
    store: persistence,
    now: () => FIXED_NOW,
    makeId: (prefix: string) => `${prefix}-${++n}`,
  })
  return {
    store,
    persisted: () => withDefaults(JSON.parse(persistence.map.get(STORAGE_KEY) ?? '{}')),
  }
}

const GUARDIAN = {
  id: 'g1',
  statement: 'Everyone has this problem',
  originStageId: 's1',
  importance: 'dies',
  status: 'untested',
  killCriterion: 'Fewer than 3 of 10 name it unprompted',
  createdAt: '2026-07-01T00:00:00.000Z',
} as const

const LEDGER = [
  {
    id: 'hunch-1',
    tier: 0,
    text: 'gut says everyone',
    source: '',
    linkedAssumptionIds: [],
    stageId: '',
    date: '2026-07-02',
  },
  {
    id: 'word-1',
    tier: 2,
    text: '"I gave up and used a spreadsheet"',
    source: 'interview 3',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-03',
  },
  {
    id: 'deed-1',
    tier: 3,
    text: 'watched her rebuild the tracker by hand',
    source: 'shadowing session',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-04',
  },
  {
    id: 'gold-1',
    tier: 4,
    text: 'paid $40 for the manual workaround',
    source: 'receipt',
    linkedAssumptionIds: [],
    stageId: 's1',
    date: '2026-07-05',
  },
] as const

function seeded() {
  return makeStore({
    assumptions: [{ ...GUARDIAN }],
    evidence: LEDGER.map((e) => ({ ...e, linkedAssumptionIds: [...e.linkedAssumptionIds] })),
  })
}

describe('startConfrontation', () => {
  it('opens one record and moves untested → testing (entering IS testing)', () => {
    const { store, persisted } = seeded()
    store.getState().startConfrontation('g1')
    const data = persisted()
    expect(data.confrontations).toEqual([
      { guardianId: 'g1', startedAt: FIXED_NOW, citations: [] },
    ])
    expect(data.assumptions[0]?.status).toBe('testing')
  })

  it('is idempotent — one open confrontation per guardian', () => {
    const { store, persisted } = seeded()
    store.getState().startConfrontation('g1')
    store.getState().startConfrontation('g1')
    expect(persisted().confrontations).toHaveLength(1)
  })

  it('refuses unknown, resolved, and firstLight guardians', () => {
    const { store, persisted } = makeStore({
      assumptions: [
        { ...GUARDIAN, id: 'done', status: 'validated' },
        { ...GUARDIAN, id: 'fl', firstLight: true },
      ],
    })
    store.getState().startConfrontation('missing')
    store.getState().startConfrontation('done')
    store.getState().startConfrontation('fl')
    expect(persisted().confrontations).toEqual([])
  })
})

describe('citeInConfrontation', () => {
  it('E2+ appends the citation once and links the evidence to the guardian', () => {
    const { store, persisted } = seeded()
    store.getState().startConfrontation('g1')
    expect(store.getState().citeInConfrontation('g1', 'word-1')).toBe('hit')
    expect(store.getState().citeInConfrontation('g1', 'deed-1')).toBe('heavy')
    expect(store.getState().citeInConfrontation('g1', 'gold-1')).toBe('shatter')
    const data = persisted()
    expect(data.confrontations[0]?.citations).toEqual(['word-1', 'deed-1', 'gold-1'])
    for (const id of ['word-1', 'deed-1', 'gold-1']) {
      expect(data.evidence.find((e) => e.id === id)?.linkedAssumptionIds).toEqual(['g1'])
    }
  })

  it('B2 — a hunch bounces: returns the line, writes NOTHING', () => {
    const { store, persisted } = seeded()
    store.getState().startConfrontation('g1')
    const before = persisted()
    expect(store.getState().citeInConfrontation('g1', 'hunch-1')).toBe('bounce')
    const after = persisted()
    expect(after.confrontations[0]?.citations).toEqual([])
    expect(after.evidence.find((e) => e.id === 'hunch-1')?.linkedAssumptionIds).toEqual([])
    expect(after).toEqual(before) // never strengthens, never penalizes — zero delta
  })

  it('a coin spends once per confrontation; synthetic ammunition cannot land', () => {
    const { store, persisted } = seeded()
    store.getState().startConfrontation('g1')
    store.getState().citeInConfrontation('g1', 'word-1')
    expect(store.getState().citeInConfrontation('g1', 'word-1')).toBeNull()
    expect(store.getState().citeInConfrontation('g1', 'forged-id')).toBeNull()
    expect(store.getState().citeInConfrontation('nobody', 'word-1')).toBeNull()
    expect(persisted().confrontations[0]?.citations).toEqual(['word-1'])
  })
})

describe('the verdict and the finishing strike', () => {
  it('verdict is write-once and ignites the finisher; the strike resolves', () => {
    const { store, persisted } = seeded()
    const s = store.getState
    s().startConfrontation('g1')
    s().citeInConfrontation('g1', 'word-1')
    expect(finisherAvailable(openConfrontation(s().data, 'g1'))).toBe(false)
    s().recordConfrontationVerdict('g1', 'invalidated')
    s().recordConfrontationVerdict('g1', 'validated') // write-once: ignored
    expect(openConfrontation(s().data, 'g1')?.outcome).toBe('invalidated')
    expect(finisherAvailable(openConfrontation(s().data, 'g1'))).toBe(true)
    s().resolveConfrontation('g1')
    const data = persisted()
    expect(data.confrontations[0]).toEqual({
      guardianId: 'g1',
      startedAt: FIXED_NOW,
      resolvedAt: FIXED_NOW,
      outcome: 'invalidated',
      citations: ['word-1'],
    })
    expect(data.assumptions[0]?.status).toBe('invalidated')
    expect(data.assumptions[0]?.resolvedAt).toBe(FIXED_NOW)
  })

  it('no strike without the verdict; resolving twice writes once', () => {
    const { store, persisted } = seeded()
    const s = store.getState
    s().startConfrontation('g1')
    s().resolveConfrontation('g1') // thread not ignited — nothing happens
    expect(persisted().assumptions[0]?.status).toBe('testing')
    s().recordConfrontationVerdict('g1', 'validated')
    s().resolveConfrontation('g1')
    s().resolveConfrontation('g1')
    const data = persisted()
    expect(data.confrontations).toHaveLength(1)
    expect(data.assumptions[0]?.status).toBe('validated')
  })

  it('XP and Truth stay derived: invalidation pays the 1.5×, validation the base', () => {
    const invalidated = seeded()
    let s = invalidated.store.getState
    s().startConfrontation('g1')
    s().citeInConfrontation('g1', 'word-1') // links E2 → derived tier 2
    s().recordConfrontationVerdict('g1', 'invalidated')
    s().resolveConfrontation('g1')
    expect(xp(invalidated.persisted())).toBe(15)
    expect(truth(invalidated.persisted())).toBe(1)

    const validated = seeded()
    s = validated.store.getState
    s().startConfrontation('g1')
    s().citeInConfrontation('g1', 'word-1')
    s().recordConfrontationVerdict('g1', 'validated')
    s().resolveConfrontation('g1')
    expect(xp(validated.persisted())).toBe(10)
    expect(truth(validated.persisted())).toBe(1)
  })

  it('resolves calibration rows held/broke when seeded from a tagged hunch', () => {
    const base = {
      assumptions: [{ ...GUARDIAN }],
      evidence: LEDGER.map((e) => ({
        ...e,
        linkedAssumptionIds: e.id === 'hunch-1' ? ['g1'] : [],
        ...(e.id === 'hunch-1' ? { provenance: 'earned' as const } : {}),
      })),
      calibration: [{ hunchEvidenceId: 'hunch-1', taggedAt: '2026-07-02T00:00:00.000Z' }],
    }
    const held = makeStore(structuredClone(base))
    let s = held.store.getState
    s().startConfrontation('g1')
    s().citeInConfrontation('g1', 'word-1') // tier 2 — the record can score
    s().recordConfrontationVerdict('g1', 'validated')
    s().resolveConfrontation('g1')
    expect(held.persisted().calibration[0]).toEqual({
      hunchEvidenceId: 'hunch-1',
      taggedAt: '2026-07-02T00:00:00.000Z',
      resolvedAt: FIXED_NOW,
      outcome: 'held',
    })

    const broke = makeStore(structuredClone(base))
    s = broke.store.getState
    s().startConfrontation('g1')
    s().citeInConfrontation('g1', 'word-1')
    s().recordConfrontationVerdict('g1', 'invalidated')
    s().resolveConfrontation('g1')
    expect(broke.persisted().calibration[0]?.outcome).toBe('broke')
  })
})

describe('the funeral pair', () => {
  function buried() {
    const made = seeded()
    const s = made.store.getState
    s().startConfrontation('g1')
    s().citeInConfrontation('g1', 'word-1')
    s().recordConfrontationVerdict('g1', 'invalidated')
    s().resolveConfrontation('g1')
    return made
  }

  it('an invalidated belief queues; holding writes heldAt + epitaph + a codex line', () => {
    const { store, persisted } = buried()
    expect(pendingFunerals(store.getState().data).map((a) => a.id)).toEqual(['g1'])
    store.getState().holdFuneral('g1', '  It was never everyone. It was Sarah.  ')
    const data = persisted()
    expect(data.funerals).toEqual([
      { guardianId: 'g1', heldAt: FIXED_NOW, epitaph: 'It was never everyone. It was Sarah.' },
    ])
    expect(data.wisdomCodex).toEqual([
      {
        id: 'wisdom-1',
        text: 'It was never everyone. It was Sarah.',
        sourceGuardianId: 'g1',
        date: FIXED_NOW,
      },
    ])
    expect(pendingFunerals(data)).toEqual([])
  })

  it('holding twice writes once; an empty line holds the rite without a codex entry', () => {
    const { store, persisted } = buried()
    store.getState().holdFuneral('g1', '   ')
    store.getState().holdFuneral('g1', 'second try')
    const data = persisted()
    expect(data.funerals).toHaveLength(1)
    expect(data.funerals[0]?.epitaph).toBe('')
    expect(data.wisdomCodex).toEqual([])
  })

  it('skip is write-once and narrative-only: no XP change, ghost derivable', () => {
    const { store, persisted } = buried()
    const xpBefore = xp(persisted())
    store.getState().skipFuneral('g1')
    store.getState().skipFuneral('g1')
    const data = persisted()
    expect(data.funerals).toEqual([{ guardianId: 'g1', skippedAt: FIXED_NOW }])
    expect(xp(data)).toBe(xpBefore) // no XP loss, no streaks, ever
  })

  it('a delayed funeral lays the ghost to rest and KEEPS the skip history', () => {
    const { store, persisted } = buried()
    store.getState().skipFuneral('g1')
    store.getState().holdFuneral('g1', 'laid to rest, late but honest')
    const data = persisted()
    expect(data.funerals).toEqual([
      {
        guardianId: 'g1',
        skippedAt: FIXED_NOW,
        heldAt: FIXED_NOW,
        epitaph: 'laid to rest, late but honest',
      },
    ])
    expect(data.wisdomCodex).toHaveLength(1)
  })

  it('neither action touches a living or unknown guardian', () => {
    const { store, persisted } = seeded()
    store.getState().holdFuneral('g1', 'not dead yet')
    store.getState().skipFuneral('g1')
    store.getState().holdFuneral('missing', 'x')
    expect(persisted().funerals).toEqual([])
  })
})

describe('the Ego actions (A5)', () => {
  it('markTesting flips untested → testing and nothing else; firstLight refused', () => {
    const { store, persisted } = makeStore({
      assumptions: [
        { ...GUARDIAN },
        { ...GUARDIAN, id: 'fl', firstLight: true },
        { ...GUARDIAN, id: 'done', status: 'validated' },
      ],
    })
    store.getState().markTesting('g1')
    store.getState().markTesting('fl')
    store.getState().markTesting('done')
    const data = persisted()
    expect(data.assumptions.find((a) => a.id === 'g1')?.status).toBe('testing')
    expect(data.assumptions.find((a) => a.id === 'fl')?.status).toBe('untested')
    expect(data.assumptions.find((a) => a.id === 'done')?.status).toBe('validated')
  })

  it('integrateEgo writes ONE codex line under sourceGuardianId ego — write-once, non-empty', () => {
    const { store, persisted } = makeStore({})
    store.getState().integrateEgo('   ')
    expect(persisted().wisdomCodex).toEqual([])
    store.getState().integrateEgo('  I am not my idea.  ')
    store.getState().integrateEgo('second try never lands')
    const codex = persisted().wisdomCodex
    expect(codex).toHaveLength(1)
    expect(codex[0]).toEqual({
      id: 'wisdom-1',
      text: 'I am not my idea.',
      sourceGuardianId: 'ego',
      date: FIXED_NOW,
    })
  })
})
