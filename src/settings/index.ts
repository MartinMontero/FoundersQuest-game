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

/** clamp a stored volume to [0,1]; anything malformed falls back */
function vol(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback
}

export interface Settings {
  /** Has the player accepted the fallback-model offer? Default: false. */
  getFallbackAccepted(): boolean
  /** Persist the acceptance — survives reloads via the storage ladder. */
  acceptFallback(): void
  /** Back to the pinned model: persist the acceptance away. */
  resetFallback(): void
  /** The founder's chosen name; '' means unnamed (the UI shows the default). */
  getFounderName(): string
  /** Persist the founder's name (device-local; never serialized, never sent). */
  setFounderName(name: string): void
  /** Independent audio sliders (game-design §7) — 0..1, master defaults to 0. */
  getAudio(): { master: number; ambient: number; cues: number }
  setAudio(volumes: Partial<{ master: number; ambient: number; cues: number }>): void
}

interface SettingsShape {
  fallbackAccepted: boolean
  founderName: string
  /** audio volumes 0..1 — default 0: SILENCE until the player opts in (§7) */
  audioMaster: number
  audioAmbient: number
  audioCues: number
}

const DEFAULTS: SettingsShape = {
  fallbackAccepted: false,
  founderName: '',
  audioMaster: 0,
  audioAmbient: 0.7,
  audioCues: 0.7,
}

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
  // Whitelist-read: only the known keys, only their exact types — foreign keys
  // and mistyped values never round-trip.
  return {
    fallbackAccepted: rec['fallbackAccepted'] === true,
    founderName: typeof rec['founderName'] === 'string' ? rec['founderName'] : '',
    audioMaster: vol(rec['audioMaster'], DEFAULTS.audioMaster),
    audioAmbient: vol(rec['audioAmbient'], DEFAULTS.audioAmbient),
    audioCues: vol(rec['audioCues'], DEFAULTS.audioCues),
  }
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
    getFounderName(): string {
      return load(store).founderName
    },
    setFounderName(name: string): void {
      save(store, { ...load(store), founderName: name })
    },
    getAudio(): { master: number; ambient: number; cues: number } {
      const s = load(store)
      return { master: s.audioMaster, ambient: s.audioAmbient, cues: s.audioCues }
    },
    setAudio(volumes: Partial<{ master: number; ambient: number; cues: number }>): void {
      const s = load(store)
      save(store, {
        ...s,
        audioMaster: vol(volumes.master, s.audioMaster),
        audioAmbient: vol(volumes.ambient, s.audioAmbient),
        audioCues: vol(volumes.cues, s.audioCues),
      })
    },
  }
}
