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
  /** set ONLY by the First-Light opening's distinct elicitation (D-I). Tagged
   *  assumptions are excluded from the Truth denominator and pay fixed
   *  First-Light XP — the explicit D-G canon carve-out (02, 2026-07-11). */
  firstLight?: boolean
  // NO tier field — tier is DERIVED from linked evidence, never stored (02).
}

/** Earned Hunch provenance rungs (02, Mind & Myth): where a hunch came from. */
export type HunchProvenance = 'earned' | 'adjacent' | 'wild' | 'borrowed'

export interface EvidenceEntry {
  id: string
  tier: EvidenceTier
  text: string
  source: string
  linkedAssumptionIds: string[]
  stageId: string
  date: string
  /** tier-0 (hunch) entries only; optional, post-capture, editable (D-M).
   *  NEVER read by tierOf/Truth/XP — provenance buys test priority and a
   *  calibration entry only (constitutional floor; invariant-tested). */
  provenance?: HunchProvenance
  // NO origin field — canon 02's evidence shape has none; import provenance is
  // DERIVED from fieldJournal.imports[].evidenceIds, never stored (A-101 §1).
}

// ---- Mind & Myth keys (canon commit 2026-07-11) ----

/** "Your gut's record": one row per provenance-tagged hunch, resolved when its
 *  seeded guardian resolves at E2+. Never alters any metric. */
export interface CalibrationEntry {
  hunchEvidenceId: string
  taggedAt: string
  resolvedAt?: string
  outcome?: 'held' | 'broke'
}

/** A guardian confrontation (A4): citations are REAL Ledger evidence ids —
 *  no synthetic ammunition exists anywhere (02). */
export interface ConfrontationRecord {
  guardianId: string
  startedAt: string
  resolvedAt?: string
  outcome?: 'invalidated' | 'validated'
  citations: string[]
}

/** The funeral rite's record (A4): a skip is a narrative-only consequence. */
export interface FuneralRecord {
  guardianId: string
  heldAt?: string
  skippedAt?: string
  epitaph?: string
}

export interface WisdomCodexEntry {
  id: string
  text: string
  sourceGuardianId: string
  date: string
}

/** First Light resume marker: which induction beat, entered when. */
export interface OpeningBeatProgress {
  beat: number
  ts: string
}
// NO egoRecord key — the Ego is DERIVED at runtime from trail/gates/funerals,
// never stored (D-B; mirrors the tier-derivation rule).

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
  // ---- Mind & Myth (canon commit 2026-07-11); null/[] = not reached yet ----
  openingCompletedAt: string | null
  /** the skip is a courtesy control — never override-logged (First Light) */
  openingSkippedAt: string | null
  invitationSeen: boolean
  chartUnlocked: boolean
  firstLightArtifactIds: string[]
  openingBeatProgress: OpeningBeatProgress | null
  calibration: CalibrationEntry[]
  confrontations: ConfrontationRecord[]
  funerals: FuneralRecord[]
  wisdomCodex: WisdomCodexEntry[]
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
  openingCompletedAt: null,
  openingSkippedAt: null,
  invitationSeen: false,
  chartUnlocked: false,
  firstLightArtifactIds: [],
  openingBeatProgress: null,
  calibration: [],
  confrontations: [],
  funerals: [],
  wisdomCodex: [],
}

// ---- hydration shape-hardening (Phase 2 adversarial review, ruled fix 6) ----
// A hand-edited or corrupted founders-quest:v3 record must never crash the
// game or push NaN into the HUD: every field the metrics read is guarded here.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** enum guard: unknown importance falls back to the lightest weight (shrugs). */
function asImportance(value: unknown): Importance {
  return value === 'dies' || value === 'wobbles' || value === 'shrugs' ? value : 'shrugs'
}

/** enum guard: unknown status falls back to untested (never fabricates a verdict). */
function asStatus(value: unknown): AssumptionStatus {
  return value === 'untested' ||
    value === 'testing' ||
    value === 'validated' ||
    value === 'invalidated'
    ? value
    : 'untested'
}

/** enum guard: unknown tier falls back to 0 — a corrupt coin can never move Truth. */
function asTier(value: unknown): EvidenceTier {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4 ? value : 0
}

/** enum guard: unknown weather value falls back to 3 (neutral — never fakes a trough). */
function asWeatherValue(value: unknown): WeatherEntry['value'] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : 3
}

/** enum guard: unknown slot state falls back to open. */
function asSlotState(value: unknown): SlotState {
  return value === 'open' || value === 'attempted' || value === 'hollow' || value === 'filled'
    ? value
    : 'open'
}

/** enum guard: unknown provenance is DROPPED (undefined) — never fabricated. */
function asProvenance(value: unknown): HunchProvenance | undefined {
  return value === 'earned' || value === 'adjacent' || value === 'wild' || value === 'borrowed'
    ? value
    : undefined
}

/** enum guard: unknown calibration outcome is dropped — a corrupt row can never fake a record. */
function asCalibrationOutcome(value: unknown): CalibrationEntry['outcome'] {
  return value === 'held' || value === 'broke' ? value : undefined
}

/** enum guard: unknown confrontation outcome is dropped (never fabricates a verdict). */
function asConfrontationOutcome(value: unknown): ConfrontationRecord['outcome'] {
  return value === 'invalidated' || value === 'validated' ? value : undefined
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/** array guard: non-arrays default to []; elements map through `sanitize` (null = drop). */
function arrayOr<T>(value: unknown, sanitize: (element: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return []
  const out: T[] = []
  for (const element of value) {
    const mapped = sanitize(element)
    if (mapped !== null) out.push(mapped)
  }
  return out
}

/** record guard: non-objects default to a fresh copy of `fallback`. */
function recordOr<T>(value: unknown, fallback: Record<string, T>): Record<string, T> {
  return isPlainObject(value) ? (value as Record<string, T>) : { ...fallback }
}

/** keep plain-object elements as-is (shallow: element fields are not enum-coerced). */
function plainObjectElement<T>(element: unknown): T | null {
  return isPlainObject(element) ? (element as T) : null
}

function sanitizeAssumption(element: unknown): Assumption | null {
  if (!isPlainObject(element)) return null
  const out: Assumption = {
    ...(element as unknown as Assumption),
    importance: asImportance(element['importance']),
    status: asStatus(element['status']),
  }
  // firstLight is boolean-or-absent — a truthy string must not smuggle the carve-out in
  if (element['firstLight'] === true) out.firstLight = true
  else delete out.firstLight
  return out
}

function sanitizeEvidence(element: unknown): EvidenceEntry | null {
  if (!isPlainObject(element)) return null
  const tier = asTier(element['tier'])
  const out: EvidenceEntry = {
    ...(element as unknown as EvidenceEntry),
    tier,
    linkedAssumptionIds: Array.isArray(element['linkedAssumptionIds'])
      ? (element['linkedAssumptionIds'] as string[])
      : [],
  }
  // provenance is valid ONLY on tier-0 (hunch) entries (02) — dropped elsewhere,
  // and unknown rungs are dropped rather than coerced
  const provenance = tier === 0 ? asProvenance(element['provenance']) : undefined
  if (provenance !== undefined) out.provenance = provenance
  else delete out.provenance
  return out
}

function sanitizeCalibrationEntry(element: unknown): CalibrationEntry | null {
  if (!isPlainObject(element)) return null
  const out: CalibrationEntry = {
    ...(element as unknown as CalibrationEntry),
    outcome: asCalibrationOutcome(element['outcome']),
  }
  if (out.outcome === undefined) delete out.outcome
  return out
}

function sanitizeConfrontation(element: unknown): ConfrontationRecord | null {
  if (!isPlainObject(element)) return null
  const out: ConfrontationRecord = {
    ...(element as unknown as ConfrontationRecord),
    outcome: asConfrontationOutcome(element['outcome']),
    citations: Array.isArray(element['citations']) ? (element['citations'] as string[]) : [],
  }
  if (out.outcome === undefined) delete out.outcome
  return out
}

/** string-array guard: non-strings dropped. */
function stringElement(element: unknown): string | null {
  return typeof element === 'string' ? element : null
}

/** shape guard: the opening resume marker needs a finite beat + a string ts, else null. */
function sanitizeOpeningBeatProgress(value: unknown): OpeningBeatProgress | null {
  if (!isPlainObject(value)) return null
  const beat = value['beat']
  const ts = value['ts']
  if (typeof beat !== 'number' || !Number.isFinite(beat) || typeof ts !== 'string') return null
  return { beat, ts }
}

function sanitizeWeatherEntry(element: unknown): WeatherEntry | null {
  if (!isPlainObject(element)) return null
  return { ...(element as unknown as WeatherEntry), value: asWeatherValue(element['value']) }
}

function sanitizeHuntSlot(element: unknown): HuntSlot | null {
  if (!isPlainObject(element)) return null
  return { ...(element as unknown as HuntSlot), state: asSlotState(element['state']) }
}

/** shallow shape check: momentum must carry its sub-keys, value must be finite. */
function sanitizeMomentum(value: unknown): Momentum {
  if (!isPlainObject(value)) return { ...EMPTY_DATA.momentum }
  return {
    value: finiteOr(value['value'], 0),
    lastAttemptDate: stringOrNull(value['lastAttemptDate']),
    lastTickDate: stringOrNull(value['lastTickDate']),
  }
}

function sanitizeHuntList(value: unknown): QuestData['huntList'] {
  if (!isPlainObject(value)) return { profiles: [], slots: [] }
  return {
    profiles: arrayOr(value['profiles'], plainObjectElement<HuntProfile>),
    slots: arrayOr(value['slots'], sanitizeHuntSlot),
  }
}

function sanitizeFieldJournal(value: unknown): QuestData['fieldJournal'] {
  if (!isPlainObject(value)) return { attempts: [], imports: [] }
  return {
    attempts: arrayOr(value['attempts'], plainObjectElement<FieldAttempt>),
    imports: arrayOr(value['imports'], plainObjectElement<FieldImportRecord>),
  }
}

function sanitizeFieldDay(value: unknown): QuestData['fieldDay'] {
  if (!isPlainObject(value)) return { current: null, log: [] }
  return {
    current: isPlainObject(value['current']) ? (value['current'] as unknown as FieldDayCurrent) : null,
    log: arrayOr(value['log'], plainObjectElement<FieldDayLogEntry>),
  }
}

/**
 * New keys default in from EMPTY_DATA (02) — A-101 keys the same way.
 * Whitelist-copy: only keys of EMPTY_DATA are carried over (like migration.ts),
 * so foreign keys injected into founders-quest:v3 can never round-trip.
 * Every carried field passes a per-field guard (arrays, enums, finite numbers,
 * shallow object shapes) so a corrupted record hydrates to safe values.
 */
export function withDefaults(loaded: Partial<QuestData> | null | undefined): QuestData {
  const source: Record<string, unknown> = isPlainObject(loaded) ? loaded : {}
  return {
    milestones: recordOr<boolean>(source['milestones'], {}),
    answers: recordOr<Record<string, Answer>>(source['answers'], {}),
    fieldNotes: recordOr<string>(source['fieldNotes'], {}),
    assumptions: arrayOr(source['assumptions'], sanitizeAssumption),
    evidence: arrayOr(source['evidence'], sanitizeEvidence),
    vault: arrayOr(source['vault'], plainObjectElement<QuestData['vault'][number]>),
    vaultUnlocked: booleanOr(source['vaultUnlocked'], false),
    trail: arrayOr(source['trail'], plainObjectElement<TrailEntry>),
    gates: recordOr(source['gates'], {}) as QuestData['gates'],
    lastLoop: stringOrNull(source['lastLoop']),
    council: arrayOr(source['council'], plainObjectElement<CouncilReading>),
    councilConsent: booleanOr(source['councilConsent'], false),
    weather: arrayOr(source['weather'], sanitizeWeatherEntry),
    sideQuests: recordOr<SideQuestRecord>(source['sideQuests'], {}),
    dinnerCard: isPlainObject(source['dinnerCard'])
      ? (source['dinnerCard'] as unknown as DinnerCard)
      : null,
    dinnerSession: isPlainObject(source['dinnerSession'])
      ? (source['dinnerSession'] as unknown as DinnerSession)
      : null,
    dinnerLog: arrayOr(source['dinnerLog'], plainObjectElement<DinnerLogEntry>),
    huntList: sanitizeHuntList(source['huntList']),
    fieldJournal: sanitizeFieldJournal(source['fieldJournal']),
    momentum: sanitizeMomentum(source['momentum']),
    fieldDay: sanitizeFieldDay(source['fieldDay']),
    openingCompletedAt: stringOrNull(source['openingCompletedAt']),
    openingSkippedAt: stringOrNull(source['openingSkippedAt']),
    invitationSeen: booleanOr(source['invitationSeen'], false),
    chartUnlocked: booleanOr(source['chartUnlocked'], false),
    firstLightArtifactIds: arrayOr(source['firstLightArtifactIds'], stringElement),
    openingBeatProgress: sanitizeOpeningBeatProgress(source['openingBeatProgress']),
    calibration: arrayOr(source['calibration'], sanitizeCalibrationEntry),
    confrontations: arrayOr(source['confrontations'], sanitizeConfrontation),
    funerals: arrayOr(source['funerals'], plainObjectElement<FuneralRecord>),
    wisdomCodex: arrayOr(source['wisdomCodex'], plainObjectElement<WisdomCodexEntry>),
  }
}
