// src/key/keyManager.ts — the ONLY reader/writer of the player's key storage key.
// Canon: 02 ("Key storage: its own storage key via the same storage ladder — never
// inside founders-quest:v3, never in buildJournalMd, never in any export; visible
// remove control") + 04 routing note + CLAUDE.md BYOK rules.
//
// Structural containment: the key lives either in a closure variable here or under
// KEY_STORAGE_KEY in the injected store — never inside the QuestData record, so no
// serializer can ever reach it. src/core/serializer.ts must never import this module
// (repo-guard tested in tests/guards.spec.ts). getKey() returning a bare string is
// the ONLY accessor; no export returns the key inside an object that could be
// spread into QuestData.
//
// No player-facing copy here: refusals carry typed error codes only; the strings
// module maps 'consent-required' to canon 04 copy at the UI layer.
// No Date.now(): the consent timestamp is taken as a parameter (`consent.at`).

/** The key's OWN storage key — NEVER inside `founders-quest:v3`. */
export const KEY_STORAGE_KEY = 'founders-quest:key'

/** Typed refusal codes. 'consent-required': persist attempted without valid consent. */
export type KeyErrorCode = 'consent-required'

export class KeyManagerError extends Error {
  readonly code: KeyErrorCode
  constructor(code: KeyErrorCode) {
    super(code)
    this.name = 'KeyManagerError'
    this.code = code
  }
}

/** Consent record — accepted must be literally true; `at` is the caller's timestamp. */
export interface KeyConsent {
  accepted: true
  at: string
}

/** The store subset the manager needs (QuestStore satisfies it). Injectable for tests. */
export interface KeyStore {
  get(k: string): string | null
  set(k: string, v: string): void
  remove(k: string): void
}

export interface KeyManager {
  /** In-memory only — writes NOTHING to the store (session-only mode). */
  setSessionKey(key: string): void
  /** Consent-precedes-store: refuses with 'consent-required' before touching anything. */
  persistKey(key: string, consent: KeyConsent): void
  /** The ONLY accessor. Memory first, then store. Returns a bare string, never an object. */
  getKey(): string | null
  hasPersistedKey(): boolean
  isSessionOnly(): boolean
  /** Clears memory AND store — the visible remove control calls this. */
  removeKey(): void
  /** remove + persist; refuses (and removes nothing) without valid consent. */
  replaceKey(key: string, consent: KeyConsent): void
}

/**
 * Runtime validation, not just the type: callers outside TypeScript (or casting)
 * must not be able to slip an unaccepted consent past the gate.
 */
function isValidConsent(consent: unknown): consent is KeyConsent {
  if (typeof consent !== 'object' || consent === null) return false
  const rec = consent as Record<string, unknown>
  return rec['accepted'] === true && typeof rec['at'] === 'string' && rec['at'].length > 0
}

function assertConsent(consent: KeyConsent): void {
  if (!isValidConsent(consent)) throw new KeyManagerError('consent-required')
}

export function createKeyManager(store: KeyStore): KeyManager {
  // The single in-memory slot. Closure-scoped: unreachable from outside except via getKey().
  let memoryKey: string | null = null

  const manager: KeyManager = {
    setSessionKey(key: string): void {
      memoryKey = key
    },

    persistKey(key: string, consent: KeyConsent): void {
      assertConsent(consent) // consent precedes store — nothing below runs without it
      // The bare key string under its own storage key; the consent record itself is
      // NOT written anywhere — no JSON envelope exists that could ever be spread.
      store.set(KEY_STORAGE_KEY, key)
      memoryKey = key // keeps getKey() working even on a degraded (best-effort) store
    },

    getKey(): string | null {
      return memoryKey ?? store.get(KEY_STORAGE_KEY)
    },

    hasPersistedKey(): boolean {
      return store.get(KEY_STORAGE_KEY) !== null
    },

    isSessionOnly(): boolean {
      return memoryKey !== null && store.get(KEY_STORAGE_KEY) === null
    },

    removeKey(): void {
      memoryKey = null
      store.remove(KEY_STORAGE_KEY)
    },

    replaceKey(key: string, consent: KeyConsent): void {
      assertConsent(consent) // refuse BEFORE removing — no consentless destruction
      manager.removeKey()
      manager.persistKey(key, consent)
    },
  }

  return manager
}
