// src/core/migration.ts — v2 legacy READ-ONLY migration per docs/canon/02-architecture.md:
//   - v2 reflections → v3 fieldNotes
//   - v2 milestone CHECKS never migrate (changed criteria; a carried checkmark is a
//     fabricated fact) — the migrated record gets an empty milestones map
//   - everything else that shape-matches v3 carries over via withDefaults
//   - the v2 record is never modified or deleted (read-only source)
//   - unknown v2 shape → EMPTY_DATA, no throw
// R-K: the exact v2 shape is unavailable (artifact not in repo) — this module codes
// defensively against { reflections?, milestones?, answers?, ... } with light,
// per-key template checks. Framework-free; typed reason codes, no player copy.

import { EMPTY_DATA, LEGACY_V2_KEY, STORAGE_KEY, withDefaults, type QuestData } from './schema'
import type { QuestStore } from './store'

export type MigrationSkipReason =
  /** a v3 record already exists under STORAGE_KEY — never overwrite it */
  | 'v3-already-present'
  /** nothing stored under LEGACY_V2_KEY */
  | 'no-v2-data'
  /** v2 payload is corrupt JSON or not an object — nothing is fabricated from it */
  | 'v2-unreadable'

export type MigrationResult =
  | { migrated: true; data: QuestData }
  | { migrated: false; reason: MigrationSkipReason }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Keep only string-valued entries (fieldNotes/reflections are Record<string, string>). */
function stringEntries(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

/**
 * Light per-key shape gate against the EMPTY_DATA template: arrays must be arrays,
 * records must be plain objects, primitives must match by typeof. Nullable keys
 * (lastLoop: string|null; dinnerCard/dinnerSession: object|null) accept null.
 * Deliberately shallow — the v2 shape is an R-K unknown, so element-level
 * validation is not attempted here.
 */
function matchesTemplate(key: keyof QuestData, value: unknown): boolean {
  const template = EMPTY_DATA[key]
  if (Array.isArray(template)) return Array.isArray(value)
  if (template === null) {
    if (value === null) return true
    return key === 'lastLoop' ? typeof value === 'string' : isRecord(value)
  }
  if (typeof template === 'object') return isRecord(value)
  return typeof value === typeof template
}

/**
 * Pure mapper: an already-parsed v2 payload → a v3 QuestData.
 * Unknown shape (not a plain object) → fresh EMPTY_DATA copy. Never throws.
 */
export function migrateV2Data(v2: unknown): QuestData {
  if (!isRecord(v2)) return withDefaults(null)

  const carried: Partial<QuestData> = {}
  for (const key of Object.keys(EMPTY_DATA) as (keyof QuestData)[]) {
    if (key === 'milestones') continue // checks never migrate (02)
    if (key === 'fieldNotes') continue // handled below via the reflections mapping
    const value = v2[key]
    if (value === undefined) continue
    if (matchesTemplate(key, value)) {
      // the light shape gate above is the admission check — see R-K note
      ;(carried as Record<string, unknown>)[key] = value
    }
  }

  // v2 reflections → v3 fieldNotes. If a v2 record unexpectedly already carries the
  // v3 name, keep its string entries too — reflections win on key collision.
  const notes: Record<string, string> = {}
  const v2FieldNotes = v2['fieldNotes']
  if (isRecord(v2FieldNotes)) Object.assign(notes, stringEntries(v2FieldNotes))
  const v2Reflections = v2['reflections']
  if (isRecord(v2Reflections)) Object.assign(notes, stringEntries(v2Reflections))
  if (Object.keys(notes).length > 0) carried.fieldNotes = notes

  // v2 milestone checks DO NOT migrate — a fresh empty map, never a shared reference.
  carried.milestones = {}

  return withDefaults(carried)
}

/**
 * Orchestrator: if no v3 data exists and LEGACY_V2_KEY holds a readable record,
 * migrate it and persist the result under STORAGE_KEY. The v2 record is never
 * written to or removed. Never throws.
 */
export function migrateV2IfNeeded(store: QuestStore): MigrationResult {
  if (store.get(STORAGE_KEY) !== null) return { migrated: false, reason: 'v3-already-present' }

  const rawV2 = store.get(LEGACY_V2_KEY)
  if (rawV2 === null) return { migrated: false, reason: 'no-v2-data' }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawV2)
  } catch {
    return { migrated: false, reason: 'v2-unreadable' }
  }
  if (!isRecord(parsed)) return { migrated: false, reason: 'v2-unreadable' }

  const data = migrateV2Data(parsed)
  store.set(STORAGE_KEY, JSON.stringify(data))
  return { migrated: true, data }
}
