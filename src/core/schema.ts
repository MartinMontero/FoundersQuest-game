// src/core/schema.ts — the founders-quest:v3 contract, exactly per docs/canon/02-architecture.md
// (as amended by the applied Phase 0 canon diff, commit 530cfb0).
// This module is framework-free: no imports from React or any renderer (lint-enforced).

export const STORAGE_KEY = 'founders-quest:v3'
// Legacy key name is an R-K interim assumption (v2 artifact source not yet in repo);
// cross-checked against docs/reference/founders-quest-v3.jsx when the operator's upload lands.
export const LEGACY_V2_KEY = 'founders-quest:v2'

export type EvidenceTier = 0 | 1 | 2 | 3 | 4
export type Importance = 'dies' | 'wobbles' | 'shrugs'
export type AssumptionStatus = 'untested' | 'testing' | 'validated' | 'invalidated'

export interface Answer {
  text?: string
  whys?: string[]
  ifPart?: string
  thenPart?: string
  withinDays?: number
  sealedAt?: string
  verdict?: string
  decision?: string
  citedEvidenceIds?: string[]
}

export interface Assumption {
  id: string
  statement: string
  originStageId: string
  importance: Importance
  status: AssumptionStatus
  killCriterion: string
  createdAt: string
  resolvedAt?: string
  // NO tier field — tier is DERIVED from linked evidence, never stored (02).
}

export interface EvidenceEntry {
  id: string
  tier: EvidenceTier
  text: string
  source: string
  linkedAssumptionIds: string[]
  stageId: string
  date: string
  // NO origin field — canon 02's evidence shape has none; import provenance is
  // DERIVED from fieldJournal.imports[].evidenceIds, never stored (A-101 §1).
}

export interface TrailEntry {
  type: 'loop' | 'gate-pass' | 'gate-override'
  name: string
  fromId?: string
  toId?: string
  learning?: string
  critique?: string
  reason?: string
  date: string
}

export interface GateRecord {
  status: 'passed' | 'overridden'
  reason?: string
  date: string
}

export interface CouncilFollowup {
  q: string
  a: string
}

export interface CouncilReading {
  id: string
  date: string
  reading: string
  commitment?: string
  followups: CouncilFollowup[]
  /** snapshot = the compact journal exactly as sent (02, R-C 2026-07-08) */
  journal: string
  /** producing model id — every reading records and displays it (02/05, 2026-07-08) */
  model: string
  source: 'live' | 'pasted'
}

export interface WeatherEntry {
  id: string
  date: string
  value: 1 | 2 | 3 | 4 | 5
}

export interface SideQuestRecord {
  text: string
  startedAt: string
  completedAt?: string
}

export interface DinnerCard {
  text: string
  updatedAt: string
}

export interface DinnerSessionCard {
  id: string
  name: string
  text: string
  bucket?: 'been-there' | 'interesting' | 'do-not-pass-go'
  match?: string
  spoke?: boolean
}

export interface DinnerSession {
  date: string
  cards: DinnerSessionCard[]
  timer: number
}

export interface DinnerLogEntry {
  date: string
  cards: number
  spoke: number
  matches: number
}

// ---- A-101 keys (canon since 530cfb0) ----

export interface HuntProfile {
  id: string
  /** a profile, never a person */
  label: string
  fromQid: 's1-l1'
  createdAt: string
  retiredAt?: string
}

export type SlotState = 'open' | 'attempted' | 'hollow' | 'filled'

export interface HuntSlot {
  id: string
  profileId: string
  kind: 'cold' | 'warm-intro'
  spawnedByAttemptId?: string
  state: SlotState
  createdAt: string
  attemptedAt?: string
  resolvedAt?: string
  attemptId?: string
}

export type AttemptChannel = 'in-person' | 'call' | 'video' | 'live-chat'
export type AttemptOutcome = 'quote' | 'declined' | 'no-show' | 'no-story'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface FieldAttempt {
  id: string
  slotId: string
  channel: AttemptChannel
  /** logged before outcome — a rejection still fills the slot */
  startedAt: string
  outcome?: AttemptOutcome
  resolvedAt?: string
  evidenceIds: string[]
  /** display only — tier drives the mechanics */
  rarity?: Rarity
  evolution?: { spawnedSlotId: string; note?: string }
  fieldDayId?: string
  origin: 'local' | 'import'
  importedAt?: string
  beamId?: string
  beamedAt?: string
}

export interface FieldImportRecord {
  beamId: string
  importedAt: string
  via: 'qr' | 'file' | 'paste'
  counts: Record<string, number>
  /** ids actually written by that import — the ledger provenance badge derives from here */
  evidenceIds: string[]
}

export interface Momentum {
  /** cadence only; never Truth, XP, or the Action formula — the single stored source */
  value: number
  lastAttemptDate: string | null
  lastTickDate: string | null
}

export interface FieldDayCurrent {
  id: string
  date: string
  goalAttempts: number
  attemptIds: string[]
  startedAt: string
  endedAt?: string
  retro?: string
}

export interface FieldDayLogEntry {
  id: string
  date: string
  goalAttempts: number
  attemptCount: number
  filled: number
  hollow: number
  retro?: string
}

export interface QuestData {
  milestones: Record<string, boolean>
  answers: Record<string, Record<string, Answer>>
  fieldNotes: Record<string, string>
  assumptions: Assumption[]
  evidence: EvidenceEntry[]
  vault: { id: string; text: string; date: string }[]
  vaultUnlocked: boolean
  trail: TrailEntry[]
  gates: Partial<Record<'act1' | 'act2' | 'act3', GateRecord>>
  lastLoop: string | null
  council: CouncilReading[]
  councilConsent: boolean
  weather: WeatherEntry[]
  sideQuests: Record<string, SideQuestRecord>
  dinnerCard: DinnerCard | null
  dinnerSession: DinnerSession | null
  dinnerLog: DinnerLogEntry[]
  huntList: { profiles: HuntProfile[]; slots: HuntSlot[] }
  fieldJournal: { attempts: FieldAttempt[]; imports: FieldImportRecord[] }
  momentum: Momentum
  fieldDay: { current: FieldDayCurrent | null; log: FieldDayLogEntry[] }
}

export const EMPTY_DATA: QuestData = {
  milestones: {},
  answers: {},
  fieldNotes: {},
  assumptions: [],
  evidence: [],
  vault: [],
  vaultUnlocked: false,
  trail: [],
  gates: {},
  lastLoop: null,
  council: [],
  councilConsent: false,
  weather: [],
  sideQuests: {},
  dinnerCard: null,
  dinnerSession: null,
  dinnerLog: [],
  huntList: { profiles: [], slots: [] },
  fieldJournal: { attempts: [], imports: [] },
  momentum: { value: 0, lastAttemptDate: null, lastTickDate: null },
  fieldDay: { current: null, log: [] },
}

/**
 * New keys default in from EMPTY_DATA (02) — A-101 keys the same way.
 * Whitelist-copy: only keys of EMPTY_DATA are carried over (like migration.ts),
 * so foreign keys injected into founders-quest:v3 can never round-trip.
 */
export function withDefaults(loaded: Partial<QuestData> | null | undefined): QuestData {
  const source = loaded ?? {}
  const out: QuestData = { ...EMPTY_DATA }
  for (const key of Object.keys(EMPTY_DATA) as (keyof QuestData)[]) {
    copyKey(out, source, key)
  }
  return out
}

/** Key-generic copy so the whitelist loop stays fully typed — no casts. */
function copyKey<K extends keyof QuestData>(
  out: QuestData,
  source: Partial<QuestData>,
  key: K,
): void {
  const value = source[key]
  if (value !== undefined) out[key] = value
}
