// src/settings/index.ts — persisted player settings, starting with the fallback
// acceptance ("the player's fallback choice persists" — 05 ruling, 2026-07-08;
// settings pattern = own storage key via the storage ladder, game-design OQ6).
//
// Structural containment, same shape as the key manager's: settings live under
// their OWN storage key — NEVER inside founders-quest:v3 (so no serializer can
// reach them) and NEVER in the key store. Framework-free; JSON-parse guarded:
// a corrupt or foreign-shaped record degrades to defaults, never throws.

/** The settings' OWN storage key — never inside `founders-quest:v3`, never the key store. */
export const SETTINGS_STORAGE_KEY = 'founders-quest:settings'

/** The store subset settings need (QuestStore satisfies it). Injectable for tests. */
export interface SettingsStore {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}

export interface Settings {
  /** Has the player accepted the fallback-model offer? Default: false. */
  getFallbackAccepted(): boolean
  /** Persist the acceptance — survives reloads via the storage ladder. */
  acceptFallback(): void
  /** Back to the pinned model: persist the acceptance away. */
  resetFallback(): void
}

interface SettingsShape {
  fallbackAccepted: boolean
}

const DEFAULTS: SettingsShape = { fallbackAccepted: false }

/** Guarded read: missing key, corrupt JSON, or a foreign shape → defaults. */
function load(store: SettingsStore): SettingsShape {
  const raw = store.get(SETTINGS_STORAGE_KEY)
  if (raw === null) return { ...DEFAULTS }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ...DEFAULTS }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ...DEFAULTS }
  }
  const rec = parsed as Record<string, unknown>
  // Whitelist-read: only the known key, only its exact type — foreign keys
  // and mistyped values never round-trip.
  return { fallbackAccepted: rec['fallbackAccepted'] === true }
}

function save(store: SettingsStore, settings: SettingsShape): void {
  store.set(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function createSettings(store: SettingsStore): Settings {
  return {
    getFallbackAccepted(): boolean {
      return load(store).fallbackAccepted
    },
    acceptFallback(): void {
      save(store, { ...load(store), fallbackAccepted: true })
    },
    resetFallback(): void {
      save(store, { ...load(store), fallbackAccepted: false })
    },
  }
}
