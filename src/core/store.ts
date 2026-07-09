// src/core/store.ts — the makeStore ladder per docs/canon/02-architecture.md:
// localStorage (probed in try/catch) → in-memory fallback + degraded flag
// (the UI's honest banner reads `degraded`; the copy for that banner lives in
// src/strings, not here — this module returns typed values only).
// Framework-free: no React/three/zustand imports (lint-enforced).

import { STORAGE_KEY, withDefaults, type QuestData } from './schema'

/** The subset of the Web Storage API the ladder needs. Injectable for tests. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface QuestStore {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  /** true = in-memory fallback: nothing survives a reload. The UI banner reads this. */
  readonly degraded: boolean
}

/** Distinctive probe key — written, read back, and deleted during the ladder probe. */
export const PROBE_KEY = 'founders-quest:probe'
const PROBE_VALUE = 'ok'

/** write + read + delete a probe key, all inside try/catch (canon 02). */
function probe(backend: StorageLike): boolean {
  try {
    backend.setItem(PROBE_KEY, PROBE_VALUE)
    const readBack = backend.getItem(PROBE_KEY)
    backend.removeItem(PROBE_KEY)
    return readBack === PROBE_VALUE
  } catch {
    return false
  }
}

/** Even *accessing* localStorage can throw (sandboxed iframes) — guard the lookup itself. */
function detectLocalStorage(): StorageLike | null {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage ?? null
  } catch {
    return null
  }
}

/**
 * The storage ladder: probe the backend (localStorage by default); if the probe
 * fails or no backend exists, fall back to an in-memory Map and report degraded.
 * Post-probe operations are also guarded so a late failure (e.g. quota) can never
 * throw through gameplay code — get degrades to null, set/remove to best-effort.
 */
export function makeStore(backend: StorageLike | null = detectLocalStorage()): QuestStore {
  if (backend !== null && probe(backend)) {
    // flips on the first swallowed post-probe write: from then on the record
    // is no longer reaching the device — the honest banner must say so
    let degradedNow = false
    return {
      get(key: string): string | null {
        try {
          return backend.getItem(key)
        } catch {
          return null
        }
      },
      set(key: string, value: string): void {
        try {
          backend.setItem(key, value)
        } catch {
          // best-effort: a post-probe write failure must not throw through gameplay
          degradedNow = true
        }
      },
      remove(key: string): void {
        try {
          backend.removeItem(key)
        } catch {
          // best-effort, as above
        }
      },
      get degraded(): boolean {
        return degradedNow
      },
    }
  }

  const memory = new Map<string, string>()
  return {
    get(key: string): string | null {
      return memory.get(key) ?? null
    },
    set(key: string, value: string): void {
      memory.set(key, value)
    },
    remove(key: string): void {
      memory.delete(key)
    },
    degraded: true,
  }
}

/** JSON.parse produced something withDefaults can safely spread over EMPTY_DATA? */
function isPlainRecord(value: unknown): value is Partial<QuestData> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Load the v3 record. Guarded end to end: missing key, corrupt JSON, or a
 * non-object payload all yield a fresh EMPTY_DATA copy (via withDefaults) —
 * this function never throws. Missing keys (incl. A-101) default in per canon 02.
 */
export function loadQuestData(store: QuestStore): QuestData {
  const raw = store.get(STORAGE_KEY)
  if (raw === null) return withDefaults(null)
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return withDefaults(null)
  }
  if (!isPlainRecord(parsed)) return withDefaults(null)
  return withDefaults(parsed)
}

/** Persist the v3 record under STORAGE_KEY. */
export function saveQuestData(store: QuestStore, data: QuestData): void {
  store.set(STORAGE_KEY, JSON.stringify(data))
}
