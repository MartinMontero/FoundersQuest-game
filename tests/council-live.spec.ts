// tests/council-live.spec.ts — the live rite's store + guard primitives (B-4
// resolved 2026-07-13): thinInk (04 Input bullet — <3 answers AND empty
// ledger), addLiveReading (source 'live'; the snapshot is the EXACT string the
// caller sent, never a recomputation), setReadingCommitment (write-once —
// change first, rebuttal after; never overwrites, ignores empty/unknown).

import { describe, expect, it } from 'vitest'
import { thinInk } from '../src/core/metrics'
import { STORAGE_KEY, withDefaults, type Answer, type EvidenceEntry, type QuestData } from '../src/core/schema'
import type { QuestStore } from '../src/core/store'
import { createQuestStore } from '../src/state/store'
import type { StoreApi } from 'zustand/vanilla'
import type { QuestState } from '../src/state/store'

const FIXED_NOW = '2026-07-13T12:00:00.000Z'

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

const ANSWER: Answer = { text: 'ink' }
const EVIDENCE: EvidenceEntry = {
  id: 'e-1',
  tier: 2,
  text: 'a signed word',
  source: 'interview',
  linkedAssumptionIds: [],
  stageId: 's1',
  date: FIXED_NOW,
}

describe('thinInk — 04: <3 answers and empty ledger', () => {
  it('a fresh record is thin', () => {
    expect(thinInk(withDefaults(null))).toBe(true)
  })

  it('two answers and no evidence is still thin', () => {
    const data: QuestData = {
      ...withDefaults(null),
      answers: { s1: { 's1-th': ANSWER, 's1-l1': ANSWER } },
    }
    expect(thinInk(data)).toBe(true)
  })

  it('three answers lift the guard — counted ACROSS stages', () => {
    const data: QuestData = {
      ...withDefaults(null),
      answers: { s1: { 's1-th': ANSWER, 's1-l1': ANSWER }, s2: { 's2-th': ANSWER } },
    }
    expect(thinInk(data)).toBe(false)
  })

  it('any ledger entry lifts the guard even with zero answers', () => {
    const data: QuestData = { ...withDefaults(null), evidence: [EVIDENCE] }
    expect(thinInk(data)).toBe(false)
  })
})

describe('addLiveReading — source live, snapshot as sent', () => {
  it('records reading, model, and the EXACT journal string passed in', () => {
    const { store, persisted } = makeStore()
    const sent = '# Journal — as it crossed the wire\n(none)\n'
    store.getState().addLiveReading({
      reading: '  The record shows courage.  ',
      model: 'claude-fable-5',
      journal: sent,
    })
    const rec = persisted()
    expect(rec.council).toHaveLength(1)
    const reading = rec.council[0]
    expect(reading?.source).toBe('live')
    expect(reading?.model).toBe('claude-fable-5')
    expect(reading?.reading).toBe('The record shows courage.')
    expect(reading?.journal).toBe(sent) // never recomputed
    expect(reading?.followups).toEqual([])
    expect(reading?.commitment).toBeUndefined()
    expect(reading?.date).toBe(FIXED_NOW)
  })

  it('a fallback reading names the sage who spoke', () => {
    const { store, persisted } = makeStore()
    store.getState().addLiveReading({ reading: 'r', model: 'claude-sonnet-4-6', journal: 'j' })
    expect(persisted().council[0]?.model).toBe('claude-sonnet-4-6')
  })

  it('empty reading text is refused outright', () => {
    const { store, persisted } = makeStore()
    store.getState().addLiveReading({ reading: '   ', model: 'claude-fable-5', journal: 'j' })
    expect(persisted().council).toEqual([])
  })
})

describe('setReadingCommitment — write-once (change first; rebuttal after)', () => {
  function withOneReading(): ReturnType<typeof makeStore> {
    const made = makeStore()
    made.store.getState().addLiveReading({ reading: 'r', model: 'claude-fable-5', journal: 'j' })
    return made
  }

  it('seals a trimmed commitment onto its reading', () => {
    const { store, persisted } = withOneReading()
    const id = store.getState().data.council[0]?.id ?? ''
    store.getState().setReadingCommitment(id, '  call five churned users  ')
    expect(persisted().council[0]?.commitment).toBe('call five churned users')
  })

  it('never overwrites an existing commitment', () => {
    const { store, persisted } = withOneReading()
    const id = store.getState().data.council[0]?.id ?? ''
    store.getState().setReadingCommitment(id, 'first')
    store.getState().setReadingCommitment(id, 'second')
    expect(persisted().council[0]?.commitment).toBe('first')
  })

  it('ignores empty text and unknown ids', () => {
    const { store, persisted } = withOneReading()
    const id = store.getState().data.council[0]?.id ?? ''
    store.getState().setReadingCommitment(id, '   ')
    store.getState().setReadingCommitment('reading-nope', 'anything')
    expect(persisted().council[0]?.commitment).toBeUndefined()
  })
})
