// tests/store.spec.ts — the makeStore ladder + guarded load/save (canon 02).
import { describe, expect, it } from 'vitest'
import { EMPTY_DATA, STORAGE_KEY, withDefaults, type QuestData } from '../src/core/schema'
import { PROBE_KEY, loadQuestData, makeStore, saveQuestData, type StorageLike } from '../src/core/store'

/** A working localStorage stand-in backed by a Map we can inspect. */
function fakeBackend(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

/** A shim whose every operation throws — Safari-private-mode-shaped failure. */
function throwingBackend(): StorageLike {
  return {
    getItem: () => {
      throw new Error('storage disabled')
    },
    setItem: () => {
      throw new Error('storage disabled')
    },
    removeItem: () => {
      throw new Error('storage disabled')
    },
  }
}

describe('makeStore ladder', () => {
  it('uses the injected backend when the probe passes, degraded:false', () => {
    const backend = fakeBackend()
    const store = makeStore(backend)
    expect(store.degraded).toBe(false)
    store.set('k', 'v')
    expect(backend.map.get('k')).toBe('v')
    expect(store.get('k')).toBe('v')
    store.remove('k')
    expect(backend.map.has('k')).toBe(false)
    expect(store.get('k')).toBeNull()
  })

  it('cleans up the probe key after probing', () => {
    const backend = fakeBackend()
    makeStore(backend)
    expect(backend.map.has(PROBE_KEY)).toBe(false)
  })

  it('falls back to memory when the backend throws (degraded:true), leaving it untouched', () => {
    const store = makeStore(throwingBackend())
    expect(store.degraded).toBe(true)
    // the memory store fully works
    store.set('k', 'v')
    expect(store.get('k')).toBe('v')
    store.remove('k')
    expect(store.get('k')).toBeNull()
  })

  it('falls back when the probe read-back mismatches', () => {
    const backend = fakeBackend()
    // writes are silently dropped: setItem "succeeds" but nothing is stored
    backend.setItem = () => {}
    const store = makeStore(backend)
    expect(store.degraded).toBe(true)
  })

  it('falls back to memory when no backend exists (null)', () => {
    const store = makeStore(null)
    expect(store.degraded).toBe(true)
    store.set('a', '1')
    expect(store.get('a')).toBe('1')
  })

  it('makeStore() with no argument never throws (node has no localStorage)', () => {
    expect(() => makeStore()).not.toThrow()
    const store = makeStore()
    store.set('x', 'y')
    expect(store.get('x')).toBe('y')
  })

  it('memory stores are isolated from each other', () => {
    const a = makeStore(null)
    const b = makeStore(null)
    a.set('k', 'v')
    expect(b.get('k')).toBeNull()
  })

  it('guards post-probe failures: get degrades to null, set/remove never throw', () => {
    const backend = fakeBackend()
    let armed = false
    const original = { get: backend.getItem, set: backend.setItem, remove: backend.removeItem }
    backend.getItem = (key) => {
      if (armed) throw new Error('late failure')
      return original.get(key)
    }
    backend.setItem = (key, value) => {
      if (armed) throw new Error('quota exceeded')
      original.set(key, value)
    }
    backend.removeItem = (key) => {
      if (armed) throw new Error('late failure')
      original.remove(key)
    }
    const store = makeStore(backend) // probe passes while disarmed
    expect(store.degraded).toBe(false)
    armed = true
    expect(() => store.set('k', 'v')).not.toThrow()
    expect(store.get('k')).toBeNull()
    expect(() => store.remove('k')).not.toThrow()
  })

  it('the FIRST swallowed post-probe setItem flips the runtime degraded flag (review 8e)', () => {
    const backend = fakeBackend()
    let armed = false
    const originalSet = backend.setItem
    backend.setItem = (key, value) => {
      if (armed) throw new Error('quota exceeded')
      originalSet(key, value)
    }
    const store = makeStore(backend) // probe passes while disarmed
    store.set('a', '1')
    expect(store.degraded).toBe(false) // healthy writes leave the flag down
    armed = true
    expect(() => store.set('b', '2')).not.toThrow()
    expect(store.degraded).toBe(true) // the swallowed write is no longer silent
    armed = false
    store.set('c', '3')
    expect(store.degraded).toBe(true) // once degraded, stays degraded — honesty holds
  })
})

describe('loadQuestData / saveQuestData', () => {
  it('empty store → EMPTY_DATA equivalent, as a fresh copy', () => {
    const store = makeStore(null)
    const loaded = loadQuestData(store)
    expect(loaded).toEqual(EMPTY_DATA)
    expect(loaded).not.toBe(EMPTY_DATA)
  })

  it('corrupt JSON → EMPTY_DATA copy, never throws', () => {
    const store = makeStore(null)
    store.set(STORAGE_KEY, '{ this is not JSON')
    expect(() => loadQuestData(store)).not.toThrow()
    expect(loadQuestData(store)).toEqual(EMPTY_DATA)
  })

  it.each(['"a string"', '42', 'true', 'null', '[1,2,3]'])(
    'non-object JSON payload %s → EMPTY_DATA',
    (raw) => {
      const store = makeStore(null)
      store.set(STORAGE_KEY, raw)
      expect(loadQuestData(store)).toEqual(EMPTY_DATA)
    },
  )

  it('missing keys default in — incl. the A-101 keys', () => {
    const store = makeStore(null)
    // a partial, pre-A-101-shaped record: no huntList/fieldJournal/momentum/fieldDay
    store.set(
      STORAGE_KEY,
      JSON.stringify({
        milestones: { 'm-1': true },
        fieldNotes: { 'stage-1': 'a note' },
        vaultUnlocked: true,
      }),
    )
    const loaded = loadQuestData(store)
    expect(loaded.milestones).toEqual({ 'm-1': true })
    expect(loaded.fieldNotes).toEqual({ 'stage-1': 'a note' })
    expect(loaded.vaultUnlocked).toBe(true)
    // A-101 keys default in via { ...EMPTY_DATA, ...loaded } (canon 02)
    expect(loaded.huntList).toEqual({ profiles: [], slots: [] })
    expect(loaded.fieldJournal).toEqual({ attempts: [], imports: [] })
    expect(loaded.momentum).toEqual({ value: 0, lastAttemptDate: null, lastTickDate: null })
    expect(loaded.fieldDay).toEqual({ current: null, log: [] })
    // pre-A-101 keys default in too
    expect(loaded.council).toEqual([])
    expect(loaded.lastLoop).toBeNull()
  })

  it('save → load round-trips through the store', () => {
    const store = makeStore(null)
    const data: QuestData = {
      ...withDefaults(null),
      milestones: { 'm-1': true },
      fieldNotes: { 'stage-2': 'went outside' },
      lastLoop: 'loop-1',
      vaultUnlocked: true,
    }
    saveQuestData(store, data)
    expect(loadQuestData(store)).toEqual(data)
  })

  it('saves under STORAGE_KEY as JSON', () => {
    const backend = fakeBackend()
    const store = makeStore(backend)
    saveQuestData(store, withDefaults(null))
    const raw = backend.map.get(STORAGE_KEY)
    expect(raw).toBeDefined()
    expect(JSON.parse(raw as string)).toEqual(EMPTY_DATA)
  })
})

describe('withDefaults shape-hardening (ruled fix 6): corrupted records hydrate to safe values', () => {
  /** a hand-mangled record: every guarded class of corruption at once */
  const CORRUPTED = {
    milestones: ['not', 'a', 'record'],
    answers: 42,
    fieldNotes: null,
    assumptions: [
      {
        id: 'g-1',
        statement: 'people will pay',
        originStageId: 's1',
        importance: 'CRITICAL', // unknown enum → shrugs
        status: 'PENDING', // unknown enum → untested
        killCriterion: '',
        createdAt: '2026-07-01T00:00:00.000Z',
      },
      'not an object', // dropped
    ],
    evidence: [
      {
        id: 'e-1',
        tier: 99, // unknown tier → 0 (a corrupt coin can never move Truth)
        text: 'words',
        source: 'call',
        linkedAssumptionIds: 'g-1', // not an array → []
        stageId: 's1',
        date: '2026-07-02',
      },
    ],
    vault: { not: 'an array' },
    vaultUnlocked: 'yes', // not a boolean → false
    trail: 7,
    lastLoop: 7, // not string|null → null
    council: 'nope',
    weather: [{ id: 'w-1', date: '2026-07-01', value: 'stormy' }], // → 3, never fakes a trough
    sideQuests: [],
    dinnerCard: 'text',
    dinnerSession: [1, 2],
    dinnerLog: 'nope',
    huntList: { profiles: 'nope', slots: [{ id: 's-1', state: 'BROKEN' }] },
    fieldJournal: [],
    momentum: 'yes', // not a record → EMPTY default
    fieldDay: 42,
  }

  it('hydrates every corrupted field to a safe value', () => {
    const store = makeStore(null)
    store.set(STORAGE_KEY, JSON.stringify(CORRUPTED))
    const loaded = loadQuestData(store)

    expect(loaded.milestones).toEqual({})
    expect(loaded.answers).toEqual({})
    expect(loaded.fieldNotes).toEqual({})
    expect(loaded.assumptions).toHaveLength(1) // the non-object element is dropped
    expect(loaded.assumptions[0]).toMatchObject({
      id: 'g-1',
      importance: 'shrugs',
      status: 'untested',
    })
    expect(loaded.evidence).toHaveLength(1)
    expect(loaded.evidence[0]?.tier).toBe(0)
    expect(loaded.evidence[0]?.linkedAssumptionIds).toEqual([])
    expect(loaded.vault).toEqual([])
    expect(loaded.vaultUnlocked).toBe(false)
    expect(loaded.trail).toEqual([])
    expect(loaded.lastLoop).toBeNull()
    expect(loaded.council).toEqual([])
    expect(loaded.weather).toEqual([{ id: 'w-1', date: '2026-07-01', value: 3 }])
    expect(loaded.sideQuests).toEqual({})
    expect(loaded.dinnerCard).toBeNull()
    expect(loaded.dinnerSession).toBeNull()
    expect(loaded.dinnerLog).toEqual([])
    expect(loaded.huntList).toEqual({
      profiles: [],
      slots: [{ id: 's-1', state: 'open' }],
    })
    expect(loaded.fieldJournal).toEqual({ attempts: [], imports: [] })
    expect(loaded.momentum).toEqual(EMPTY_DATA.momentum)
    expect(loaded.fieldDay).toEqual({ current: null, log: [] })
  })

  it('non-finite momentum.value defaults; finite survives', () => {
    expect(
      withDefaults({ momentum: { value: Number.NaN, lastAttemptDate: null, lastTickDate: null } })
        .momentum.value,
    ).toBe(0)
    expect(
      withDefaults(
        JSON.parse('{"momentum":{"value":"7","lastAttemptDate":null,"lastTickDate":null}}') as Partial<QuestData>,
      ).momentum.value,
    ).toBe(0)
    expect(
      withDefaults({ momentum: { value: 4, lastAttemptDate: null, lastTickDate: null } }).momentum,
    ).toEqual({ value: 4, lastAttemptDate: null, lastTickDate: null })
  })

  it('momentum missing its sub-keys defaults them in', () => {
    const loaded = withDefaults(JSON.parse('{"momentum":{}}') as Partial<QuestData>)
    expect(loaded.momentum).toEqual({ value: 0, lastAttemptDate: null, lastTickDate: null })
  })

  it('a healthy record passes through unchanged', () => {
    const store = makeStore(null)
    const data: QuestData = {
      ...withDefaults(null),
      milestones: { 'm-1': true },
      assumptions: [
        {
          id: 'g-1',
          statement: 's',
          originStageId: 's1',
          importance: 'dies',
          status: 'testing',
          killCriterion: 'k',
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      evidence: [
        {
          id: 'e-1',
          tier: 2,
          text: 't',
          source: 's',
          linkedAssumptionIds: ['g-1'],
          stageId: 's1',
          date: '2026-07-02',
        },
      ],
      weather: [{ id: 'w-1', date: '2026-07-01', value: 5 }],
      momentum: { value: 3, lastAttemptDate: '2026-07-01', lastTickDate: null },
    }
    saveQuestData(store, data)
    expect(loadQuestData(store)).toEqual(data)
  })
})
