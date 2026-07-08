// tests/key.spec.ts — key manager: consent-precedes-store, session-only mode,
// own-storage-key containment, remove/replace (canon 02/04 + CLAUDE.md BYOK).
import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../src/core/schema'
import {
  KEY_STORAGE_KEY,
  KeyManagerError,
  createKeyManager,
  type KeyConsent,
  type KeyStore,
} from '../src/key/keyManager'

/** Spy store: Map-backed, records every write/removal, keys enumerable. */
function spyStore(): KeyStore & {
  map: Map<string, string>
  writes: { key: string; value: string }[]
  removals: string[]
} {
  const map = new Map<string, string>()
  const writes: { key: string; value: string }[] = []
  const removals: string[] = []
  return {
    map,
    writes,
    removals,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      writes.push({ key: k, value: v })
      map.set(k, v)
    },
    remove: (k) => {
      removals.push(k)
      map.delete(k)
    },
  }
}

// Fabricated, non-allowlisted key material — 'sk-ant-'-shaped for the round-trip
// proof, deliberately NOT matching any real Anthropic key format, and assembled by
// concatenation so no contiguous credential-shaped literal exists in the repo.
const FAKE_KEY = ['sk-ant', 'test00', 'fabricated-for-key-spec', '0'.repeat(24)].join('-')

const CONSENT: KeyConsent = { accepted: true, at: '2026-07-08T12:00:00.000Z' }

/** Run fn, return the KeyManagerError code it threw (null = no throw / wrong type). */
function refusalCode(fn: () => void): string | null {
  try {
    fn()
  } catch (e) {
    return e instanceof KeyManagerError ? e.code : null
  }
  return null
}

describe('KEY_STORAGE_KEY', () => {
  it("is its own key, distinct from founders-quest:v3", () => {
    expect(KEY_STORAGE_KEY).toBe('founders-quest:key')
    expect(KEY_STORAGE_KEY).not.toBe(STORAGE_KEY)
  })
})

describe('session-only mode', () => {
  it('setSessionKey writes NOTHING to the store', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.setSessionKey(FAKE_KEY)
    expect(store.writes).toEqual([])
    expect(store.map.size).toBe(0)
    expect(mgr.getKey()).toBe(FAKE_KEY)
    expect(mgr.isSessionOnly()).toBe(true)
    expect(mgr.hasPersistedKey()).toBe(false)
  })

  it('a fresh manager with no key reports neither mode', () => {
    const mgr = createKeyManager(spyStore())
    expect(mgr.getKey()).toBeNull()
    expect(mgr.isSessionOnly()).toBe(false)
    expect(mgr.hasPersistedKey()).toBe(false)
  })
})

describe('consent-precedes-store', () => {
  const invalidConsents: [string, unknown][] = [
    ['accepted:false', { accepted: false, at: '2026-07-08T12:00:00.000Z' }],
    ['missing at', { accepted: true }],
    ['empty at', { accepted: true, at: '' }],
    ['null consent', null],
    ['accepted truthy but not true', { accepted: 1, at: '2026-07-08T12:00:00.000Z' }],
  ]

  it.each(invalidConsents)(
    'persistKey refuses %s with consent-required, store untouched',
    (_label, consent) => {
      const store = spyStore()
      const mgr = createKeyManager(store)
      expect(refusalCode(() => mgr.persistKey(FAKE_KEY, consent as KeyConsent))).toBe(
        'consent-required',
      )
      expect(store.writes).toEqual([])
      expect(store.map.size).toBe(0)
      expect(mgr.getKey()).toBeNull()
      expect(mgr.hasPersistedKey()).toBe(false)
    },
  )

  it('a refused persist leaves an existing session key intact and unpersisted', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.setSessionKey(FAKE_KEY)
    expect(refusalCode(() => mgr.persistKey('other-key', { accepted: false } as unknown as KeyConsent))).toBe('consent-required')
    expect(mgr.getKey()).toBe(FAKE_KEY)
    expect(store.map.size).toBe(0)
    expect(mgr.isSessionOnly()).toBe(true)
  })
})

describe('persistKey with consent', () => {
  it('lands under KEY_STORAGE_KEY exactly — and NOT under founders-quest:v3', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.persistKey(FAKE_KEY, CONSENT)
    expect(store.map.get(KEY_STORAGE_KEY)).toBe(FAKE_KEY)
    expect([...store.map.keys()]).toEqual([KEY_STORAGE_KEY])
    expect(store.map.has(STORAGE_KEY)).toBe(false)
    expect(mgr.hasPersistedKey()).toBe(true)
    expect(mgr.isSessionOnly()).toBe(false)
    expect(mgr.getKey()).toBe(FAKE_KEY)
  })

  it('stores the bare key string — no JSON envelope, no consent record anywhere', () => {
    const store = spyStore()
    createKeyManager(store).persistKey(FAKE_KEY, CONSENT)
    expect(store.writes).toEqual([{ key: KEY_STORAGE_KEY, value: FAKE_KEY }])
    for (const value of store.map.values()) {
      expect(value).not.toContain('accepted')
      expect(value).not.toContain(CONSENT.at)
    }
  })
})

describe('removeKey', () => {
  it('clears memory AND store', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.setSessionKey(FAKE_KEY)
    mgr.persistKey(FAKE_KEY, CONSENT)
    mgr.removeKey()
    expect(mgr.getKey()).toBeNull()
    expect(mgr.hasPersistedKey()).toBe(false)
    expect(mgr.isSessionOnly()).toBe(false)
    expect(store.map.size).toBe(0)
    expect(store.removals).toContain(KEY_STORAGE_KEY)
  })

  it('clears a session-only key too', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.setSessionKey(FAKE_KEY)
    mgr.removeKey()
    expect(mgr.getKey()).toBeNull()
  })
})

describe('replaceKey', () => {
  it('remove + persist: the new key replaces the old under KEY_STORAGE_KEY only', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.persistKey('old-key-material', CONSENT)
    mgr.replaceKey(FAKE_KEY, { accepted: true, at: '2026-07-09T09:00:00.000Z' })
    expect(mgr.getKey()).toBe(FAKE_KEY)
    expect(store.map.get(KEY_STORAGE_KEY)).toBe(FAKE_KEY)
    expect([...store.map.keys()]).toEqual([KEY_STORAGE_KEY])
    for (const value of store.map.values()) {
      expect(value).not.toContain('old-key-material')
    }
  })

  it('without valid consent: refuses with consent-required and removes NOTHING', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.persistKey(FAKE_KEY, CONSENT)
    expect(
      refusalCode(() => mgr.replaceKey('new-key', { accepted: false } as unknown as KeyConsent)),
    ).toBe('consent-required')
    expect(mgr.getKey()).toBe(FAKE_KEY)
    expect(store.map.get(KEY_STORAGE_KEY)).toBe(FAKE_KEY)
    expect(store.removals).toEqual([])
  })
})

describe('getKey precedence', () => {
  it('memory wins over store', () => {
    const store = spyStore()
    const mgr = createKeyManager(store)
    mgr.persistKey('stored-key', CONSENT)
    mgr.setSessionKey('memory-key')
    expect(mgr.getKey()).toBe('memory-key')
    // the persisted value is untouched by the session override
    expect(store.map.get(KEY_STORAGE_KEY)).toBe('stored-key')
  })

  it('falls back to the store when memory is empty (next-visit read)', () => {
    const store = spyStore()
    store.map.set(KEY_STORAGE_KEY, 'stored-key') // pre-seeded, as after a prior visit
    const mgr = createKeyManager(store)
    expect(mgr.getKey()).toBe('stored-key')
    expect(mgr.hasPersistedKey()).toBe(true)
    expect(mgr.isSessionOnly()).toBe(false)
  })
})

describe('containment proof: the fabricated key never leaks to another storage key', () => {
  it('round-trips under KEY_STORAGE_KEY and appears under NO other key', () => {
    const store = spyStore()
    // simulate an existing v3 record sharing the same storage
    store.map.set(STORAGE_KEY, JSON.stringify({ council: [], milestones: {} }))
    const mgr = createKeyManager(store)
    mgr.setSessionKey(FAKE_KEY)
    mgr.persistKey(FAKE_KEY, CONSENT)
    expect(mgr.getKey()).toBe(FAKE_KEY) // round-trip
    // enumerate EVERY key the spy store holds
    for (const [key, value] of store.map.entries()) {
      if (key === KEY_STORAGE_KEY) {
        expect(value).toBe(FAKE_KEY)
      } else {
        expect(value).not.toContain(FAKE_KEY)
      }
    }
    // every write ever issued targeted the key's own storage key
    for (const write of store.writes) {
      if (write.value.includes(FAKE_KEY)) expect(write.key).toBe(KEY_STORAGE_KEY)
    }
    expect(store.map.get(STORAGE_KEY)).not.toContain(FAKE_KEY)
  })

  it('the manager object itself never carries the key (spread/serialize-safe)', () => {
    const mgr = createKeyManager(spyStore())
    mgr.setSessionKey(FAKE_KEY)
    mgr.persistKey(FAKE_KEY, CONSENT)
    expect(JSON.stringify(mgr)).not.toContain(FAKE_KEY)
    for (const value of Object.values({ ...mgr })) {
      expect(typeof value).toBe('function')
    }
  })
})
