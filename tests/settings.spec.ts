// tests/settings.spec.ts — persisted fallback acceptance (05 ruling: "the
// player's fallback choice persists"; settings pattern = own storage key via
// the ladder, game-design OQ6). Pins: default false, persistence under exactly
// SETTINGS_STORAGE_KEY (spy store enumerates every key touched), corrupt-JSON
// degradation, reset, and a cross-instance round-trip.

import { describe, expect, it } from 'vitest'
import { SETTINGS_STORAGE_KEY, createSettings } from '../src/settings'
import type { SettingsStore } from '../src/settings'
import { STORAGE_KEY } from '../src/core/schema'
import { KEY_STORAGE_KEY } from '../src/key/keyManager'

/** An in-memory store that records EVERY key touched by set/remove. */
function spyStore(): {
  store: SettingsStore
  writtenKeys: string[]
  removedKeys: string[]
  storedKeys: () => string[]
  seed: (key: string, value: string) => void
} {
  const map = new Map<string, string>()
  const writtenKeys: string[] = []
  const removedKeys: string[] = []
  return {
    store: {
      get: (key) => map.get(key) ?? null,
      set: (key, value) => {
        writtenKeys.push(key)
        map.set(key, value)
      },
      remove: (key) => {
        removedKeys.push(key)
        map.delete(key)
      },
    },
    writtenKeys,
    removedKeys,
    storedKeys: () => [...map.keys()],
    seed: (key, value) => {
      map.set(key, value)
    },
  }
}

describe('settings — own storage key (never v3, never the key store)', () => {
  it('SETTINGS_STORAGE_KEY is its own key, distinct from v3 and the key store', () => {
    expect(SETTINGS_STORAGE_KEY).toBe('founders-quest:settings')
    expect(SETTINGS_STORAGE_KEY).not.toBe(STORAGE_KEY)
    expect(SETTINGS_STORAGE_KEY).not.toBe(KEY_STORAGE_KEY)
  })

  it('acceptFallback persists under exactly SETTINGS_STORAGE_KEY and no other key', () => {
    const { store, writtenKeys, removedKeys, storedKeys } = spyStore()
    createSettings(store).acceptFallback()
    expect(writtenKeys).toEqual([SETTINGS_STORAGE_KEY])
    expect(removedKeys).toEqual([])
    expect(storedKeys()).toEqual([SETTINGS_STORAGE_KEY])
  })
})

describe('settings — fallback acceptance', () => {
  it('defaults to false on an empty store (and reads without writing)', () => {
    const { store, writtenKeys } = spyStore()
    const settings = createSettings(store)
    expect(settings.getFallbackAccepted()).toBe(false)
    expect(writtenKeys).toEqual([])
  })

  it('acceptFallback persists true', () => {
    const { store } = spyStore()
    const settings = createSettings(store)
    settings.acceptFallback()
    expect(settings.getFallbackAccepted()).toBe(true)
  })

  it('resetFallback returns the choice to false', () => {
    const { store } = spyStore()
    const settings = createSettings(store)
    settings.acceptFallback()
    settings.resetFallback()
    expect(settings.getFallbackAccepted()).toBe(false)
  })

  it('round-trips across two createSettings instances — persistence proven', () => {
    const { store } = spyStore()
    createSettings(store).acceptFallback()
    // a fresh instance over the same store (a reload) still sees the choice
    expect(createSettings(store).getFallbackAccepted()).toBe(true)
    createSettings(store).resetFallback()
    expect(createSettings(store).getFallbackAccepted()).toBe(false)
  })
})

describe('settings — guarded reads (corrupt or foreign records degrade to defaults)', () => {
  it.each(['{ not json', '"a string"', '[1,2,3]', 'null', '42'])(
    'corrupt/foreign payload %s → default false, no throw',
    (raw) => {
      const { store, seed } = spyStore()
      seed(SETTINGS_STORAGE_KEY, raw)
      const settings = createSettings(store)
      expect(() => settings.getFallbackAccepted()).not.toThrow()
      expect(settings.getFallbackAccepted()).toBe(false)
    },
  )

  it('a mistyped fallbackAccepted value reads as false', () => {
    const { store, seed } = spyStore()
    seed(SETTINGS_STORAGE_KEY, JSON.stringify({ fallbackAccepted: 'yes' }))
    expect(createSettings(store).getFallbackAccepted()).toBe(false)
  })

  it('accepting over a corrupt record repairs it', () => {
    const { store, seed } = spyStore()
    seed(SETTINGS_STORAGE_KEY, '{ definitely broken')
    const settings = createSettings(store)
    settings.acceptFallback()
    expect(settings.getFallbackAccepted()).toBe(true)
    expect(createSettings(store).getFallbackAccepted()).toBe(true)
  })
})
