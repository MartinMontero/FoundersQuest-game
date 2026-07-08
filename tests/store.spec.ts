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
