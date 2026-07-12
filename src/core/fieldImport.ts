// src/core/fieldImport.ts — Field Mode's import pipeline (A-101 §8).
// Three transports (QR beam, file, pasted fragment), ONE pipeline, one
// rule-set, applied in order. Framework-free and pure: validation and the
// merge PLAN live here; the single atomic write lives in the store action
// (applyFieldImport), which is the ONLY evidence-writing import path — that
// atomicity IS the F-103 derived-provenance invariant.
//
// Structural exclusion first (rule 1's deepest layer): the envelope simply
// has no Dinner, answers, milestones, gates, council, weather, vault, trail,
// assumptions, or key fields — an import CANNOT express a write to them.

import type {
  EvidenceEntry,
  FieldAttempt,
  FieldDayLogEntry,
  FieldImportRecord,
  HuntProfile,
  HuntSlot,
  QuestData,
} from './schema'

export const BEAM_KIND = 'founders-quest/field-beam'
export const BEAM_VERSION = 1
/** caps — R-G tunables, code constants only (never canon) */
export const IMPORT_CAP_FILE_BYTES = 256 * 1024
export const IMPORT_CAP_QR_BYTES = 64 * 1024
export const IMPORT_TEXT_MAX = 4000
export const IMPORT_SOURCE_MAX = 120
export const IMPORT_ID_MAX = 128

export type ImportVia = FieldImportRecord['via']

export interface BeamPayload {
  profiles: HuntProfile[]
  slots: HuntSlot[]
  attempts: FieldAttempt[]
  evidence: EvidenceEntry[]
  fieldDayLog: FieldDayLogEntry[]
}

export interface BeamEnvelope {
  kind: typeof BEAM_KIND
  v: typeof BEAM_VERSION
  beamId: string
  createdAt: string
  payload: BeamPayload
}

// rule 1 — allowlisted fields per record type; ANY unknown key → named error.
// `beamedAt` is local bookkeeping: stripped from payloads before encoding and
// tolerated-then-ignored here (rule 4's comparison excludes it).
const PROFILE_KEYS = new Set(['id', 'label', 'fromQid', 'createdAt', 'retiredAt'])
const SLOT_KEYS = new Set([
  'id', 'profileId', 'kind', 'spawnedByAttemptId', 'state', 'createdAt',
  'attemptedAt', 'resolvedAt', 'attemptId',
])
const ATTEMPT_KEYS = new Set([
  'id', 'slotId', 'channel', 'startedAt', 'outcome', 'resolvedAt', 'evidenceIds',
  'rarity', 'evolution', 'fieldDayId', 'origin', 'importedAt', 'beamId', 'beamedAt',
])
const EVIDENCE_KEYS = new Set([
  'id', 'tier', 'text', 'source', 'linkedAssumptionIds', 'stageId', 'date',
])
const FIELDDAY_KEYS = new Set([
  'id', 'date', 'goalAttempts', 'attemptCount', 'filled', 'hollow', 'retro',
])
/** defense-in-depth: any Dinner-named key ANYWHERE in a payload → reject */
const DINNER_RE = /dinner/i

export type ValidationResult =
  | { ok: true; envelope: BeamEnvelope }
  | { ok: false; error: string }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function boundedString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max
}

function checkKeys(
  record: Record<string, unknown>,
  allow: ReadonlySet<string>,
  where: string,
): string | null {
  for (const key of Object.keys(record)) {
    if (DINNER_RE.test(key)) return `rejected: dinner-named key "${key}" in ${where}`
    if (!allow.has(key)) return `rejected: unknown key "${key}" in ${where}`
  }
  return null
}

/** rules 1 + 2, in order: size cap first, then strict schema. Pure. */
export function validateBeam(raw: string, via: ImportVia): ValidationResult {
  const cap = via === 'qr' ? IMPORT_CAP_QR_BYTES : IMPORT_CAP_FILE_BYTES
  if (new TextEncoder().encode(raw).byteLength > cap) {
    return { ok: false, error: `rejected: envelope exceeds the ${via} size cap` }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'rejected: not valid JSON' }
  }
  if (!isRecord(parsed)) return { ok: false, error: 'rejected: envelope is not an object' }
  const envKeyError = checkKeys(parsed, new Set(['kind', 'v', 'beamId', 'createdAt', 'payload']), 'envelope')
  if (envKeyError !== null) return { ok: false, error: envKeyError }
  if (parsed['kind'] !== BEAM_KIND) return { ok: false, error: 'rejected: kind mismatch' }
  if (parsed['v'] !== BEAM_VERSION) return { ok: false, error: 'rejected: version mismatch' }
  if (!boundedString(parsed['beamId'], IMPORT_ID_MAX)) return { ok: false, error: 'rejected: bad beamId' }
  if (typeof parsed['createdAt'] !== 'string') return { ok: false, error: 'rejected: bad createdAt' }
  const payload = parsed['payload']
  if (!isRecord(payload)) return { ok: false, error: 'rejected: payload is not an object' }
  const payloadKeyError = checkKeys(
    payload, new Set(['profiles', 'slots', 'attempts', 'evidence', 'fieldDayLog']), 'payload')
  if (payloadKeyError !== null) return { ok: false, error: payloadKeyError }

  const sections: [string, ReadonlySet<string>][] = [
    ['profiles', PROFILE_KEYS], ['slots', SLOT_KEYS], ['attempts', ATTEMPT_KEYS],
    ['evidence', EVIDENCE_KEYS], ['fieldDayLog', FIELDDAY_KEYS],
  ]
  for (const [section, allow] of sections) {
    const list = payload[section]
    if (!Array.isArray(list)) return { ok: false, error: `rejected: payload.${section} is not an array` }
    for (const [i, element] of list.entries()) {
      if (!isRecord(element)) return { ok: false, error: `rejected: payload.${section}[${i}] is not an object` }
      const keyError = checkKeys(element, allow, `payload.${section}[${i}]`)
      if (keyError !== null) return { ok: false, error: keyError }
      if (!boundedString(element['id'], IMPORT_ID_MAX)) {
        return { ok: false, error: `rejected: bad id in payload.${section}[${i}]` }
      }
    }
  }
  // terminal-only (R6) + bounded content per type
  for (const [i, s] of (payload['slots'] as Record<string, unknown>[]).entries()) {
    if (s['state'] !== 'hollow' && s['state'] !== 'filled') {
      return { ok: false, error: `rejected: non-terminal slot state in payload.slots[${i}]` }
    }
  }
  for (const [i, a] of (payload['attempts'] as Record<string, unknown>[]).entries()) {
    if (typeof a['outcome'] !== 'string' || typeof a['resolvedAt'] !== 'string') {
      return { ok: false, error: `rejected: unresolved attempt in payload.attempts[${i}]` }
    }
  }
  for (const [i, e] of (payload['evidence'] as Record<string, unknown>[]).entries()) {
    const tier = e['tier']
    if (tier !== 2 && tier !== 3 && tier !== 4) {
      return { ok: false, error: `rejected: beamed evidence tier out of bounds in payload.evidence[${i}]` }
    }
    if (typeof e['text'] !== 'string' || e['text'].length > IMPORT_TEXT_MAX) {
      return { ok: false, error: `rejected: evidence text too long in payload.evidence[${i}]` }
    }
    if (typeof e['source'] !== 'string' || e['source'].length > IMPORT_SOURCE_MAX) {
      return { ok: false, error: `rejected: evidence source too long in payload.evidence[${i}]` }
    }
    if (!Array.isArray(e['linkedAssumptionIds'])) {
      return { ok: false, error: `rejected: bad links in payload.evidence[${i}]` }
    }
  }
  return { ok: true, envelope: parsed as unknown as BeamEnvelope }
}

/** rule 4's content comparison — local bookkeeping (`beamedAt`) excluded */
function contentEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const strip = (r: Record<string, unknown>): Record<string, unknown> => {
    const { beamedAt: _omit, ...rest } = r
    return rest
  }
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b))
}

export interface ImportPlan {
  writes: BeamPayload
  skippedExistingIds: string[]
  conflicts: string[]
  /** evidence links blanked because the id is absent from the HOME registry (rule 7) */
  blankedLinks: { evidenceId: string; blanked: string[] }[]
}

/**
 * Rules 4 + 7 as a pure PLAN over the home record: append-only, dedupe by id,
 * never overwrite; same-id-same-content → skip; same-id-different-content →
 * conflict (also skipped); links validated against the home registry.
 */
export function planImport(data: QuestData, envelope: BeamEnvelope): ImportPlan {
  const skipped: string[] = []
  const conflicts: string[] = []
  const homeIds = {
    profiles: new Map(data.huntList.profiles.map((r) => [r.id, r])),
    slots: new Map(data.huntList.slots.map((r) => [r.id, r])),
    attempts: new Map(data.fieldJournal.attempts.map((r) => [r.id, r])),
    evidence: new Map(data.evidence.map((r) => [r.id, r])),
    fieldDayLog: new Map(data.fieldDay.log.map((r) => [r.id, r])),
  }
  function sift<T extends { id: string }>(incoming: T[], home: Map<string, T>): T[] {
    const out: T[] = []
    for (const record of incoming) {
      const existing = home.get(record.id)
      if (existing === undefined) out.push(record)
      else if (contentEqual(existing as Record<string, unknown>, record as Record<string, unknown>)) {
        skipped.push(record.id)
      } else conflicts.push(record.id)
    }
    return out
  }
  const assumptionIds = new Set(data.assumptions.map((a) => a.id))
  const blankedLinks: ImportPlan['blankedLinks'] = []
  const evidence = sift(envelope.payload.evidence, homeIds.evidence).map((e) => {
    const kept = e.linkedAssumptionIds.filter((id) => assumptionIds.has(id))
    const blanked = e.linkedAssumptionIds.filter((id) => !assumptionIds.has(id))
    if (blanked.length > 0) blankedLinks.push({ evidenceId: e.id, blanked })
    return { ...e, linkedAssumptionIds: kept }
  })
  return {
    writes: {
      profiles: sift(envelope.payload.profiles, homeIds.profiles),
      slots: sift(envelope.payload.slots, homeIds.slots),
      attempts: sift(envelope.payload.attempts, homeIds.attempts),
      evidence,
      fieldDayLog: sift(envelope.payload.fieldDayLog, homeIds.fieldDayLog),
    },
    skippedExistingIds: skipped,
    conflicts,
    blankedLinks,
  }
}
