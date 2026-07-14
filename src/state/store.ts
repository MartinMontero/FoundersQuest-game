// src/state/store.ts — the zustand binding over the framework-free core.
// `founders-quest:v3` is the ONLY state of record: every action computes the next
// QuestData immutably, persists it via saveQuestData THROUGH the core ladder in the
// same call, and only then updates the in-memory snapshot. No parallel state.
//
// The player's key never passes through here: this store reads/writes STORAGE_KEY
// only (asserted in tests/state.spec.ts — no action touches the key store).

import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { createStore, type StoreApi } from 'zustand/vanilla'
import {
  citationImpact,
  openConfrontation,
  type CitationImpact,
} from '../core/confrontation'
import { EGO_SOURCE_ID } from '../core/ego'
import type { ImportPlan, ImportVia } from '../core/fieldImport'
import { actionFraction, riskiest, tierOf, trough, truth, type ActGateId } from '../core/metrics'
import { migrateV2IfNeeded } from '../core/migration'
import { buildJournalMd } from '../core/serializer'
import type {
  Answer,
  Assumption,
  AttemptChannel,
  AttemptOutcome,
  CalibrationEntry,
  FieldAttempt,
  FieldImportRecord,
  HuntProfile,
  HuntSlot,
  EvidenceEntry,
  EvidenceTier,
  HunchProvenance,
  Importance,
  QuestData,
  WeatherEntry,
} from '../core/schema'
import { loadQuestData, makeStore, saveQuestData, type QuestStore } from '../core/store'
import { EARNED_HUNCH_BUMP } from './tunables'

export interface GuardianInput {
  statement: string
  importance: Importance
  killCriterion: string
  originStageId: string
}

export interface EvidenceInput {
  tier: EvidenceTier
  text: string
  source: string
  linkedAssumptionIds: readonly string[]
  stageId: string
}

export interface VaultEntry {
  id: string
  text: string
  date: string
}

export interface QuestState {
  data: QuestData
  /** true = in-memory storage fallback; the honest banner reads this. */
  degraded: boolean
  /** Merge `fields` into answers[stageId][qid] — exact 02 keys, nothing else. */
  inscribeAnswer(stageId: string, qid: string, fields: Partial<Answer>): void
  /** Two-tap capture, zero justification (law 10): push { id, text, date } to vault[]. */
  captureVault(text: string): VaultEntry
  /** Push an untested guardian; tier is NEVER stored — derived from linked evidence. */
  addGuardian(input: GuardianInput): Assumption
  /** Push an evidence entry (E0–E4 coin). Only E2+ ever moves Truth (derived). */
  addEvidence(input: EvidenceInput): EvidenceEntry
  /** Flagpole self-report: milestones[id] flips. Action only — never Truth, never XP. */
  toggleMilestone(id: string): void
  /**
   * Ariadne's Thread (s4-th): inscribe `text` AND stamp `sealedAt` in one write,
   * so the sealed timestamp comes from the store's injected clock (like vault /
   * guardian / evidence), never a component's own Date. The panel renders the
   * seal read-only once `sealedAt` is set (the thread opens at the Mirror).
   */
  sealThread(stageId: string, qid: string, text: string): void
  /**
   * The funeral (s5-l5): flip a guardian to `invalidated` and stamp `resolvedAt`.
   * Idempotent — a belief already buried is left untouched. The 1.5× honors are
   * DERIVED by metrics (xp: invalidated +15 when linked tier ≥ 2), never here.
   */
  invalidateAssumption(id: string): void
  /** The Vault unseals at Stage 3 (01) — a one-way progression flag. Idempotent. */
  unlockVault(): void
  /**
   * Cross an Act Gate cleanly: record `gates[id] = passed` + a `gate-pass` trail
   * entry. `name` is the canon gate name (03), passed from the UI so the store
   * stays decoupled from src/strings.
   */
  passGate(gateId: ActGateId, name: string): void
  /**
   * Cross an Act Gate with the bar unmet: a written `reason` (never blocks —
   * canon 01), recorded as `gates[id] = overridden` + a `gate-override` trail
   * entry. The reason is logged and exported (03).
   */
  overrideGate(gateId: ActGateId, name: string, reason: string): void
  /**
   * A named loop (03): a toll-portal back to an earlier world demands one
   * learning line, appended to the `trail` (type `loop`) and set as `lastLoop`.
   */
  recordLoop(name: string, fromStage: number, toStage: number, learning: string): void
  /**
   * Weather totem (03): APPEND a reading to `weather[]` (R-W, 2026-07-10 — every
   * tap counts, none replaced). Cadence only; never Truth, XP, or the Action
   * formula. The trough (02) windows the last-3-by-date across all taps.
   */
  logWeather(value: WeatherEntry['value']): void
  /** Field-notes lectern: set the founder's own note for a stage (v2 reflections lineage). */
  saveFieldNote(stageId: string, text: string): void
  /** Side-quest board (03): accept a side quest — records `startedAt` once, never resets it. */
  startSideQuest(id: string, text: string): void
  /** Side-quest board: mark an accepted side quest complete (+5 XP, DERIVED by metrics). */
  completeSideQuest(id: string): void
  /** Dinner Card editor: the founder's own card that leads the Brief (R3). */
  setDinnerCard(text: string): void
  // ---- The Earned Hunch (Mind & Myth A2; v3 §3.3 blocks 1, 5, 6, 7) ----
  /**
   * Log a hunch: one E0 Whisper entry, zero justification (D-M — capture never
   * gates on provenance; the tag is a separate, optional, post-capture step).
   */
  addHunch(text: string): EvidenceEntry
  /**
   * Tag a hunch's provenance (Earned/Adjacent/Wild/Borrowed). Valid on tier-0
   * entries only; editable (re-tag switches the rung). First tag opens the
   * hunch's calibration row (taggedAt from the store clock). Provenance is
   * NEVER read by tierOf/Truth/XP (invariant-tested) — it buys test priority
   * and this calibration entry only.
   */
  tagHunch(evidenceId: string, provenance: HunchProvenance): void
  /**
   * Send a hunch to the test bench: create a guardian whose statement is the
   * hunch's text and link the hunch to it (E0 linking never raises tierOf — 0
   * is the floor). Returns null if the id is not a tier-0 entry.
   */
  seedGuardianFromHunch(
    evidenceId: string,
    importance: Importance,
    killCriterion: string,
    originStageId: string,
  ): Assumption | null
  // ---- First Light (Mind & Myth A3) ----
  /** The invitation was shown (one-way; the card never re-opens as mandatory). */
  markInvitationSeen(): void
  /** Resume marker for the induction — beat number + store-clock ts. */
  setOpeningBeat(beat: number): void
  /** The induction completed: stamp completedAt, unlock the Chart, clear the marker. */
  completeOpening(): void
  /** The courtesy skip (never override-logged): stamp skippedAt, unlock the Chart. */
  skipOpening(): void
  /**
   * Register the opening's REAL assumption via the D-I distinct elicitation —
   * firstLight-tagged (D-G: excluded from the Truth denominator; fixed XP on
   * resolution). The id is recorded to firstLightArtifactIds.
   */
  registerFirstLightGuardian(statement: string, killCriterion: string): Assumption
  /**
   * Resolve a firstLight assumption by the founder's own real admission (the
   * first kill / the rarer 'seen it' confirmation). Pays XP_FIRST_LIGHT via
   * the metrics carve-out — never the tier≥2 formula.
   */
  resolveFirstLight(id: string, outcome: 'invalidated' | 'validated'): void
  /** Record an opening-produced artifact id (vault capture, evidence, guardian). */
  recordFirstLightArtifact(id: string): void
  /** Hand the Chart over mid-induction (beat 9) so M/L work before completion. */
  unlockChart(): void
  // ---- The Confrontation loop + Funeral rite (Mind & Myth A4) ----
  /**
   * Step into the arena against a guardian: open a confrontations[] record
   * (canon 02 shape) and move an untested belief to `testing` — entering the
   * circle IS testing it. Idempotent: one open confrontation per guardian;
   * resolved and firstLight guardians never re-enter.
   */
  startConfrontation(guardianId: string): void
  /**
   * Cite a REAL Ledger entry at the guardian. E0/E1 BOUNCE (B2): the store
   * writes NOTHING — pure feedback, never strengthens the guardian, never
   * penalizes the founder — and returns 'bounce' for the line. E2+ appends to
   * the confrontation's citations[] (once per coin) and links the evidence to
   * the guardian (that link is what derived tier, Truth, and XP read later).
   * Returns the impact class, or null when nothing could land (no open
   * confrontation, unknown id, already cited): synthetic ammunition is
   * impossible because the id must exist in data.evidence.
   */
  citeInConfrontation(guardianId: string, evidenceId: string): CitationImpact | null
  /**
   * Record the REAL-WORLD verdict against the sealed kill criterion — verdict
   * before interpretation, write-once. This ignites the golden thread: the
   * finisher derives as available (core predicate) until the strike is used.
   * Nothing else changes here — the guardian resolves only at the strike.
   */
  recordConfrontationVerdict(guardianId: string, outcome: 'invalidated' | 'validated'): void
  /**
   * The finishing strike: stamp resolvedAt, flip the guardian to the recorded
   * outcome, and resolve calibration rows (held/broke at derived tier≥2).
   * XP stays DERIVED by metrics (invalidated +15 = the 1.5×, validated +10).
   * Requires the verdict to be recorded first; idempotent after that.
   */
  resolveConfrontation(guardianId: string): void
  /**
   * The rite's Committal: hold the funeral for an invalidated belief. Stamps
   * heldAt + epitaph; a non-empty epitaph is also written to the wisdomCodex.
   * Holding a previously SKIPPED funeral lays the ghost to rest — heldAt is
   * added and skippedAt stays (the history is honest). Never in the trough:
   * the CALLER gates the offer on !trough (the queue is derived, core).
   */
  holdFuneral(guardianId: string, epitaph: string): void
  /**
   * Skip the funeral (single warning lives in the UI; the skip is logged
   * here). Write-once — a belief already skipped or buried writes nothing.
   * Narrative-only consequence: the ghost lingers until a delayed funeral.
   */
  skipFuneral(guardianId: string): void
  // ---- The Ego (Mind & Myth A5) ----
  /**
   * Projection returned as a test (the Ego's third phase): flip an untested,
   * non-firstLight belief to `testing` — a real, deliberate commitment the
   * founder makes mid-fight. Nothing else about the record changes.
   */
  markTesting(assumptionId: string): void
  /**
   * The integration (identity-fusion cannot be won by damage): write the
   * founder's own line to the wisdomCodex under sourceGuardianId 'ego' —
   * the permanent capstone derives from that entry (egoIntegrated). Write-
   * once; requires a non-empty line (one deliberate input).
   */
  integrateEgo(line: string): void
  // ---- Field Mode (A-101; the A1-A4 accounting contract is LAW) ----
  /** Hunt list: add a PROFILE (never a person) + its starter open cold slots. */
  addHuntProfile(label: string): HuntProfile
  /**
   * Log an attempt BEFORE its outcome (A-101 §3 A1 — structural: the record
   * is created unresolvable). Writes EXACTLY: the attempt, the slot flip
   * open→attempted, the momentum increment, and the running Field Day counter.
   * Returns null if the slot is not open.
   */
  startAttempt(slotId: string, channel: AttemptChannel): FieldAttempt | null
  /**
   * Resolve an attempt: outcome + resolvedAt; the slot fills ('quote') or
   * goes hollow (any rejection — a rejection still fills the slot, A-101).
   * NEVER creates evidence, never grants XP (A3/A4 — invariant-tested).
   */
  resolveAttempt(attemptId: string, outcome: AttemptOutcome): void
  /**
   * Apply a VALIDATED import plan in ONE commit (A-101 §8 rules 4+5). This is
   * the ONLY import path that writes evidence, and it writes the
   * fieldJournal.imports audit record in the SAME commit — the F-103
   * derived-provenance invariant is atomic by construction. Imported attempts
   * are stamped origin:'import' + importedAt + beamId; momentum is NEVER
   * touched by an import; skipped/conflicted ids are never written.
   */
  applyFieldImport(plan: ImportPlan, beamId: string, via: ImportVia): FieldImportRecord
  // ---- The Council temple (C-1; live rite open since B-4 resolved 2026-07-13) ----
  /** One-time stored consent (04) — the cost sentence precedes any send affordance. */
  setCouncilConsent(consent: boolean): void
  /**
   * The pasted-reading path (04; source:'pasted'): the founder carries the
   * compact journal to their own Claude and pastes the reading back. Snapshots
   * the journal EXACTLY as it would have been sent; model labeled 'pasted'.
   */
  addPastedReading(reading: string): void
  /**
   * The live-rite path (04; source:'live'): the reading the transport returned,
   * the model that ACTUALLY produced it (fallback names the sage who spoke), and
   * the journal EXACTLY as sent — the caller passes the string it put on the
   * wire, never a recomputation (02: snapshot = the compact journal as sent).
   */
  addLiveReading(input: { reading: string; model: string; journal: string }): void
  /**
   * The commitment gate (04, one-way feedback, PIE): name one thing you'll
   * change. Writes once — an existing commitment is never overwritten
   * (change first; rebuttal after) — and ignores empty text / unknown ids.
   */
  setReadingCommitment(id: string, commitment: string): void
  /**
   * Momentum decay tick (A-101 §6): after ONE grace day, -1 per elapsed day —
   * FROZEN in the trough (cadence law: low weather never bleeds courage).
   * Never below 0; never a streak; idempotent per day (lastTickDate).
   */
  tickMomentum(today: string): void
  /** Field Day (§7): open a capture sprint. No-op if one is already running. */
  startFieldDay(goalAttempts: number): void
  /** Close the running Field Day into fieldDay.log with honest tallies. */
  endFieldDay(retro?: string): void
}

export interface QuestStoreDeps {
  /** The core storage ladder to persist through. Default: makeStore() (localStorage → memory). */
  store?: QuestStore
  /** ISO timestamp source. Default: () => new Date().toISOString(). */
  now?: () => string
  /** Id factory. Default: `${prefix}-${crypto.randomUUID()}`. */
  makeId?: (prefix: string) => string
}

let idCounter = 0
function defaultMakeId(prefix: string): string {
  const c = globalThis.crypto
  const unique =
    c !== undefined && 'randomUUID' in c
      ? c.randomUUID()
      : `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${unique}`
}

/**
 * Resolve calibration rows tied to guardian `guardianId` when it resolves at
 * derived tier ≥ 2 (v3 §3.3 block 6: the record scores only E2+-resolved
 * tests). `held` = the gut was right (validated); `broke` = it wasn't
 * (invalidated). Rows already resolved are left untouched. Pure.
 */
function resolveCalibrationRows(
  data: QuestData,
  guardianId: string,
  outcome: 'held' | 'broke',
  resolvedAt: string,
): CalibrationEntry[] {
  const guardian = data.assumptions.find((a) => a.id === guardianId)
  if (guardian === undefined || tierOf(guardian, data.evidence) < 2) return data.calibration
  const linkedHunchIds = new Set(
    data.evidence
      .filter((e) => e.tier === 0 && e.linkedAssumptionIds.includes(guardianId))
      .map((e) => e.id),
  )
  if (linkedHunchIds.size === 0) return data.calibration
  return data.calibration.map((row) =>
    row.resolvedAt === undefined && linkedHunchIds.has(row.hunchEvidenceId)
      ? { ...row, resolvedAt, outcome }
      : row,
  )
}

/** Key-generic merge that drops undefined so inscribed answers hold exact 02 keys only. */
function mergeAnswer(prev: Answer, fields: Partial<Answer>): Answer {
  const next: Answer = { ...prev }
  for (const key of Object.keys(fields) as (keyof Answer)[]) {
    assignAnswerField(next, fields, key)
  }
  return next
}

function assignAnswerField<K extends keyof Answer>(
  out: Answer,
  fields: Partial<Answer>,
  key: K,
): void {
  const value = fields[key]
  if (value !== undefined) out[key] = value
}

/**
 * Build a quest store over the injected deps. Hydration = makeStore() +
 * migrateV2IfNeeded (v2 reflections → v3 fieldNotes, read-only source, canon 02)
 * + loadQuestData at init; every action persists via saveQuestData in the same call.
 */
export function createQuestStore(deps: QuestStoreDeps = {}): StoreApi<QuestState> {
  const persistence = deps.store ?? makeStore()
  const now = deps.now ?? ((): string => new Date().toISOString())
  const makeId = deps.makeId ?? defaultMakeId

  // v2 → v3 migration runs BEFORE the first load so a legacy record hydrates
  // on the very first boot; no-op when v3 exists or no v2 record is readable.
  migrateV2IfNeeded(persistence)

  return createStore<QuestState>()((set, get) => {
    /** Persist FIRST (founders-quest:v3 is the state of record), then mirror in memory. */
    const commit = (data: QuestData): void => {
      saveQuestData(persistence, data)
      // a post-probe write failure flips the ladder's runtime degraded flag —
      // surface it so the honest banner appears mid-session (review 8e)
      set(persistence.degraded && !get().degraded ? { data, degraded: true } : { data })
    }

    return {
      data: loadQuestData(persistence),
      degraded: persistence.degraded,

      inscribeAnswer(stageId: string, qid: string, fields: Partial<Answer>): void {
        const { data } = get()
        const stageAnswers = data.answers[stageId] ?? {}
        const merged = mergeAnswer(stageAnswers[qid] ?? {}, fields)
        commit({
          ...data,
          answers: { ...data.answers, [stageId]: { ...stageAnswers, [qid]: merged } },
        })
      },

      captureVault(text: string): VaultEntry {
        const { data } = get()
        const entry: VaultEntry = { id: makeId('vault'), text, date: now() }
        commit({ ...data, vault: [...data.vault, entry] })
        return entry
      },

      addGuardian(input: GuardianInput): Assumption {
        const { data } = get()
        const guardian: Assumption = {
          id: makeId('guardian'),
          statement: input.statement,
          originStageId: input.originStageId,
          importance: input.importance,
          status: 'untested',
          killCriterion: input.killCriterion,
          createdAt: now(),
          // NO tier field — tier is derived from linked evidence, never stored (02).
        }
        commit({ ...data, assumptions: [...data.assumptions, guardian] })
        return guardian
      },

      addEvidence(input: EvidenceInput): EvidenceEntry {
        const { data } = get()
        const entry: EvidenceEntry = {
          id: makeId('evidence'),
          tier: input.tier,
          text: input.text,
          source: input.source,
          linkedAssumptionIds: [...input.linkedAssumptionIds],
          stageId: input.stageId,
          date: now(),
        }
        commit({ ...data, evidence: [...data.evidence, entry] })
        return entry
      },

      toggleMilestone(id: string): void {
        const { data } = get()
        commit({
          ...data,
          milestones: { ...data.milestones, [id]: data.milestones[id] !== true },
        })
      },

      sealThread(stageId: string, qid: string, text: string): void {
        const { data } = get()
        const stageAnswers = data.answers[stageId] ?? {}
        const merged = mergeAnswer(stageAnswers[qid] ?? {}, { text, sealedAt: now() })
        commit({
          ...data,
          answers: { ...data.answers, [stageId]: { ...stageAnswers, [qid]: merged } },
        })
      },

      invalidateAssumption(id: string): void {
        const { data } = get()
        const target = data.assumptions.find((a) => a.id === id)
        // idempotent — an already-buried belief (or unknown id) writes nothing
        if (target === undefined || target.status === 'invalidated') return
        const resolvedAt = now()
        const next: QuestData = {
          ...data,
          assumptions: data.assumptions.map((a) =>
            a.id === id ? { ...a, status: 'invalidated', resolvedAt } : a,
          ),
        }
        // the gut's record: linked tagged hunches resolve 'broke' at E2+ (A2)
        next.calibration = resolveCalibrationRows(next, id, 'broke', resolvedAt)
        commit(next)
      },

      unlockVault(): void {
        const { data } = get()
        if (data.vaultUnlocked) return
        commit({ ...data, vaultUnlocked: true })
      },

      passGate(gateId: ActGateId, name: string): void {
        const { data } = get()
        const date = now()
        commit({
          ...data,
          gates: { ...data.gates, [gateId]: { status: 'passed', date } },
          trail: [...data.trail, { type: 'gate-pass', name, date }],
        })
      },

      overrideGate(gateId: ActGateId, name: string, reason: string): void {
        const { data } = get()
        const date = now()
        commit({
          ...data,
          gates: { ...data.gates, [gateId]: { status: 'overridden', reason, date } },
          trail: [...data.trail, { type: 'gate-override', name, reason, date }],
        })
      },

      recordLoop(name: string, fromStage: number, toStage: number, learning: string): void {
        const { data } = get()
        const date = now()
        commit({
          ...data,
          lastLoop: name,
          trail: [
            ...data.trail,
            { type: 'loop', name, fromId: `s${fromStage}`, toId: `s${toStage}`, learning, date },
          ],
        })
      },

      logWeather(value: WeatherEntry['value']): void {
        const { data } = get()
        // R-W (2026-07-10): APPEND every tap — nothing replaced, nothing locked
        const entry: WeatherEntry = { id: makeId('weather'), date: now(), value }
        commit({ ...data, weather: [...data.weather, entry] })
      },

      saveFieldNote(stageId: string, text: string): void {
        const { data } = get()
        commit({ ...data, fieldNotes: { ...data.fieldNotes, [stageId]: text } })
      },

      startSideQuest(id: string, text: string): void {
        const { data } = get()
        if (data.sideQuests[id] !== undefined) return // already accepted — keep startedAt
        commit({
          ...data,
          sideQuests: { ...data.sideQuests, [id]: { text, startedAt: now() } },
        })
      },

      completeSideQuest(id: string): void {
        const { data } = get()
        const quest = data.sideQuests[id]
        if (quest === undefined || quest.completedAt !== undefined) return
        commit({
          ...data,
          sideQuests: { ...data.sideQuests, [id]: { ...quest, completedAt: now() } },
        })
      },

      setDinnerCard(text: string): void {
        const { data } = get()
        commit({ ...data, dinnerCard: { text, updatedAt: now() } })
      },

      addHunch(text: string): EvidenceEntry {
        const { data } = get()
        const entry: EvidenceEntry = {
          id: makeId('evidence'),
          tier: 0,
          text,
          source: '', // zero justification (D-M) — a whisper needs no source line
          linkedAssumptionIds: [],
          stageId: '', // a hunch belongs to the founder, not a stage
          date: now(),
        }
        commit({ ...data, evidence: [...data.evidence, entry] })
        return entry
      },

      tagHunch(evidenceId: string, provenance: HunchProvenance): void {
        const { data } = get()
        const target = data.evidence.find((e) => e.id === evidenceId)
        if (target === undefined || target.tier !== 0) return // tier-0 only (02)
        const evidence = data.evidence.map((e) =>
          e.id === evidenceId ? { ...e, provenance } : e,
        )
        // first tag opens the calibration row; re-tags keep the original taggedAt
        const calibration = data.calibration.some((c) => c.hunchEvidenceId === evidenceId)
          ? data.calibration
          : [...data.calibration, { hunchEvidenceId: evidenceId, taggedAt: now() }]
        commit({ ...data, evidence, calibration })
      },

      seedGuardianFromHunch(
        evidenceId: string,
        importance: Importance,
        killCriterion: string,
        originStageId: string,
      ): Assumption | null {
        const { data } = get()
        const hunch = data.evidence.find((e) => e.id === evidenceId)
        if (hunch === undefined || hunch.tier !== 0) return null
        const guardian: Assumption = {
          id: makeId('guardian'),
          statement: hunch.text,
          originStageId,
          importance,
          status: 'untested',
          killCriterion,
          createdAt: now(),
        }
        // linking the E0 hunch never raises tierOf (0 is the floor) — the link
        // is what the priority bump and the calibration resolution derive from
        commit({
          ...data,
          assumptions: [...data.assumptions, guardian],
          evidence: data.evidence.map((e) =>
            e.id === evidenceId
              ? { ...e, linkedAssumptionIds: [...e.linkedAssumptionIds, guardian.id] }
              : e,
          ),
        })
        return guardian
      },

      markInvitationSeen(): void {
        const { data } = get()
        if (data.invitationSeen) return
        commit({ ...data, invitationSeen: true })
      },

      setOpeningBeat(beat: number): void {
        const { data } = get()
        commit({ ...data, openingBeatProgress: { beat, ts: now() } })
      },

      completeOpening(): void {
        const { data } = get()
        commit({
          ...data,
          openingCompletedAt: data.openingCompletedAt ?? now(),
          chartUnlocked: true,
          openingBeatProgress: null,
        })
      },

      skipOpening(): void {
        const { data } = get()
        commit({
          ...data,
          openingSkippedAt: data.openingSkippedAt ?? now(),
          chartUnlocked: true, // skippers still receive the Chart — nothing is gated
          openingBeatProgress: null,
        })
      },

      registerFirstLightGuardian(statement: string, killCriterion: string): Assumption {
        const { data } = get()
        const guardian: Assumption = {
          id: makeId('guardian'),
          statement,
          originStageId: 's1',
          importance: 'dies', // the belief the venture leans on hardest
          status: 'untested',
          killCriterion,
          createdAt: now(),
          firstLight: true,
        }
        commit({
          ...data,
          assumptions: [...data.assumptions, guardian],
          firstLightArtifactIds: [...data.firstLightArtifactIds, guardian.id],
        })
        return guardian
      },

      resolveFirstLight(id: string, outcome: 'invalidated' | 'validated'): void {
        const { data } = get()
        const target = data.assumptions.find((a) => a.id === id)
        if (target === undefined || target.firstLight !== true) return
        if (target.status === 'invalidated' || target.status === 'validated') return
        const resolvedAt = now()
        commit({
          ...data,
          assumptions: data.assumptions.map((a) =>
            a.id === id ? { ...a, status: outcome, resolvedAt } : a,
          ),
        })
      },

      recordFirstLightArtifact(id: string): void {
        const { data } = get()
        if (data.firstLightArtifactIds.includes(id)) return
        commit({ ...data, firstLightArtifactIds: [...data.firstLightArtifactIds, id] })
      },

      unlockChart(): void {
        const { data } = get()
        if (data.chartUnlocked) return
        commit({ ...data, chartUnlocked: true })
      },

      startConfrontation(guardianId: string): void {
        const { data } = get()
        const target = data.assumptions.find((a) => a.id === guardianId)
        if (target === undefined || target.firstLight === true) return
        if (target.status !== 'untested' && target.status !== 'testing') return
        if (openConfrontation(data, guardianId) !== undefined) return // one open per guardian
        commit({
          ...data,
          confrontations: [
            ...data.confrontations,
            { guardianId, startedAt: now(), citations: [] },
          ],
          // entering the circle IS testing the belief
          assumptions: data.assumptions.map((a) =>
            a.id === guardianId && a.status === 'untested' ? { ...a, status: 'testing' } : a,
          ),
        })
      },

      citeInConfrontation(guardianId: string, evidenceId: string): CitationImpact | null {
        const { data } = get()
        const confrontation = openConfrontation(data, guardianId)
        if (confrontation === undefined) return null
        // real Ledger entries only — an id not in data.evidence cannot land (02)
        const entry = data.evidence.find((e) => e.id === evidenceId)
        if (entry === undefined) return null
        const impact = citationImpact(entry.tier)
        // B2: a bounce writes NOTHING — pure feedback, no record, no penalty
        if (impact === 'bounce') return impact
        if (confrontation.citations.includes(evidenceId)) return null // a coin spends once
        commit({
          ...data,
          confrontations: data.confrontations.map((c) =>
            c === confrontation ? { ...c, citations: [...c.citations, evidenceId] } : c,
          ),
          // citing = presenting this evidence against this belief: link it, so
          // derived tier (and with it Truth and XP at resolution) reads honestly
          evidence: entry.linkedAssumptionIds.includes(guardianId)
            ? data.evidence
            : data.evidence.map((e) =>
                e.id === evidenceId
                  ? { ...e, linkedAssumptionIds: [...e.linkedAssumptionIds, guardianId] }
                  : e,
              ),
        })
        return impact
      },

      recordConfrontationVerdict(
        guardianId: string,
        outcome: 'invalidated' | 'validated',
      ): void {
        const { data } = get()
        const confrontation = openConfrontation(data, guardianId)
        if (confrontation === undefined || confrontation.outcome !== undefined) return
        commit({
          ...data,
          confrontations: data.confrontations.map((c) =>
            c === confrontation ? { ...c, outcome } : c,
          ),
        })
      },

      resolveConfrontation(guardianId: string): void {
        const { data } = get()
        const confrontation = openConfrontation(data, guardianId)
        // the strike requires the ignited thread: a recorded verdict (finisher)
        if (confrontation === undefined || confrontation.outcome === undefined) return
        const outcome = confrontation.outcome
        const resolvedAt = now()
        const next: QuestData = {
          ...data,
          confrontations: data.confrontations.map((c) =>
            c === confrontation ? { ...c, resolvedAt } : c,
          ),
          assumptions: data.assumptions.map((a) =>
            a.id === guardianId ? { ...a, status: outcome, resolvedAt } : a,
          ),
        }
        // the gut's record: linked tagged hunches resolve at E2+ (A2 rule)
        next.calibration = resolveCalibrationRows(
          next,
          guardianId,
          outcome === 'validated' ? 'held' : 'broke',
          resolvedAt,
        )
        commit(next)
      },

      holdFuneral(guardianId: string, epitaph: string): void {
        const { data } = get()
        const target = data.assumptions.find((a) => a.id === guardianId)
        if (target === undefined || target.status !== 'invalidated') return
        const existing = data.funerals.find((f) => f.guardianId === guardianId)
        if (existing?.heldAt !== undefined) return // already laid to rest
        const heldAt = now()
        const line = epitaph.trim()
        commit({
          ...data,
          funerals:
            existing === undefined
              ? [...data.funerals, { guardianId, heldAt, epitaph: line }]
              : // a delayed funeral: heldAt joins skippedAt — history stays honest
                data.funerals.map((f) =>
                  f === existing ? { ...f, heldAt, epitaph: line } : f,
                ),
          wisdomCodex:
            line === ''
              ? data.wisdomCodex
              : [
                  ...data.wisdomCodex,
                  { id: makeId('wisdom'), text: line, sourceGuardianId: guardianId, date: heldAt },
                ],
        })
      },

      skipFuneral(guardianId: string): void {
        const { data } = get()
        const target = data.assumptions.find((a) => a.id === guardianId)
        if (target === undefined || target.status !== 'invalidated') return
        if (data.funerals.some((f) => f.guardianId === guardianId)) return // logged once
        commit({
          ...data,
          funerals: [...data.funerals, { guardianId, skippedAt: now() }],
        })
      },

      markTesting(assumptionId: string): void {
        const { data } = get()
        const target = data.assumptions.find((a) => a.id === assumptionId)
        if (target === undefined || target.status !== 'untested') return
        if (target.firstLight === true) return
        commit({
          ...data,
          assumptions: data.assumptions.map((a) =>
            a.id === assumptionId ? { ...a, status: 'testing' } : a,
          ),
        })
      },

      addHuntProfile(label: string): HuntProfile {
        const { data } = get()
        const profile: HuntProfile = {
          id: makeId('profile'),
          label,
          fromQid: 's1-l1',
          createdAt: now(),
        }
        // R-G tunable: 2 open cold slots per new profile (numbers never canon)
        const slots: HuntSlot[] = [0, 1].map(() => ({
          id: makeId('slot'),
          profileId: profile.id,
          kind: 'cold',
          state: 'open',
          createdAt: profile.createdAt,
        }))
        commit({
          ...data,
          huntList: {
            profiles: [...data.huntList.profiles, profile],
            slots: [...data.huntList.slots, ...slots],
          },
        })
        return profile
      },

      startAttempt(slotId: string, channel: AttemptChannel): FieldAttempt | null {
        const { data } = get()
        const slot = data.huntList.slots.find((x) => x.id === slotId)
        if (slot === undefined || slot.state !== 'open') return null
        const startedAt = now()
        // A1 — created UNRESOLVED by construction: no outcome field exists here
        const attempt: FieldAttempt = {
          id: makeId('attempt'),
          slotId,
          channel,
          startedAt,
          evidenceIds: [],
          origin: 'local',
        }
        const day = data.fieldDay.current
        commit({
          ...data,
          fieldJournal: {
            ...data.fieldJournal,
            attempts: [...data.fieldJournal.attempts, attempt],
          },
          huntList: {
            ...data.huntList,
            slots: data.huntList.slots.map((x) =>
              x.id === slotId
                ? { ...x, state: 'attempted', attemptedAt: startedAt, attemptId: attempt.id }
                : x,
            ),
          },
          // §6: courage is banked the moment you TRY — capped, never a streak
          momentum: {
            ...data.momentum,
            value: Math.min(7, data.momentum.value + 1),
            lastAttemptDate: startedAt,
          },
          fieldDay:
            day !== null && day.endedAt === undefined
              ? {
                  ...data.fieldDay,
                  current: { ...day, attemptIds: [...day.attemptIds, attempt.id] },
                }
              : data.fieldDay,
        })
        return attempt
      },

      resolveAttempt(attemptId: string, outcome: AttemptOutcome): void {
        const { data } = get()
        const attempt = data.fieldJournal.attempts.find((x) => x.id === attemptId)
        if (attempt === undefined || attempt.outcome !== undefined) return
        const resolvedAt = now()
        // a 'quote' fills the slot; every rejection still resolves it — HOLLOW
        // is honest Action-side credit, never shame (A2; anti-punitive law)
        const slotState = outcome === 'quote' ? 'filled' : 'hollow'
        commit({
          ...data,
          fieldJournal: {
            ...data.fieldJournal,
            attempts: data.fieldJournal.attempts.map((x) =>
              x.id === attemptId ? { ...x, outcome, resolvedAt } : x,
            ),
          },
          huntList: {
            ...data.huntList,
            slots: data.huntList.slots.map((x) =>
              x.attemptId === attemptId ? { ...x, state: slotState, resolvedAt } : x,
            ),
          },
        })
      },

      applyFieldImport(plan: ImportPlan, beamId: string, via: ImportVia): FieldImportRecord {
        const { data } = get()
        const importedAt = now()
        const writtenEvidenceIds = plan.writes.evidence.map((e) => e.id)
        // rule 5 — the audit record carries the ids actually WRITTEN, only those
        const audit: FieldImportRecord = {
          beamId,
          importedAt,
          via,
          counts: {
            profiles: plan.writes.profiles.length,
            slots: plan.writes.slots.length,
            attempts: plan.writes.attempts.length,
            evidence: plan.writes.evidence.length,
            fieldDayLog: plan.writes.fieldDayLog.length,
          },
          evidenceIds: writtenEvidenceIds,
        }
        commit({
          ...data,
          huntList: {
            profiles: [...data.huntList.profiles, ...plan.writes.profiles],
            slots: [...data.huntList.slots, ...plan.writes.slots],
          },
          fieldJournal: {
            attempts: [
              ...data.fieldJournal.attempts,
              ...plan.writes.attempts.map((a) => ({
                ...a,
                origin: 'import' as const,
                importedAt,
                beamId,
              })),
            ],
            imports: [...data.fieldJournal.imports, audit],
          },
          evidence: [...data.evidence, ...plan.writes.evidence],
          fieldDay: {
            ...data.fieldDay,
            log: [...data.fieldDay.log, ...plan.writes.fieldDayLog],
          },
          // momentum is deliberately untouched (rule 4) — courage is not importable
        })
        return audit
      },

      setCouncilConsent(consent: boolean): void {
        const { data } = get()
        if (data.councilConsent === consent) return
        commit({ ...data, councilConsent: consent })
      },

      addPastedReading(reading: string): void {
        const { data } = get()
        const text = reading.trim()
        if (text === '') return
        commit({
          ...data,
          council: [
            ...data.council,
            {
              id: makeId('reading'),
              date: now(),
              reading: text,
              followups: [],
              journal: buildJournalMd(data, 'compact'),
              model: 'pasted',
              source: 'pasted',
            },
          ],
        })
      },

      addLiveReading(input: { reading: string; model: string; journal: string }): void {
        const { data } = get()
        const text = input.reading.trim()
        if (text === '') return
        commit({
          ...data,
          council: [
            ...data.council,
            {
              id: makeId('reading'),
              date: now(),
              reading: text,
              followups: [],
              journal: input.journal,
              model: input.model,
              source: 'live',
            },
          ],
        })
      },

      setReadingCommitment(id: string, commitment: string): void {
        const { data } = get()
        const text = commitment.trim()
        if (text === '') return
        const target = data.council.find((r) => r.id === id)
        if (target === undefined || target.commitment !== undefined) return
        commit({
          ...data,
          council: data.council.map((r) => (r.id === id ? { ...r, commitment: text } : r)),
        })
      },

      tickMomentum(today: string): void {
        const { data } = get()
        const m = data.momentum
        if (m.value === 0 || m.lastAttemptDate === null) return
        if (trough(data)) return // cadence law: the trough freezes decay
        const day = (iso: string): number => Date.parse(iso.slice(0, 10))
        const anchor = Math.max(
          day(m.lastAttemptDate),
          m.lastTickDate !== null ? day(m.lastTickDate) : 0,
        )
        const elapsed = Math.floor((day(today) - anchor) / 86_400_000)
        // one grace day (R-G), then -1 per day beyond it
        const decay = Math.max(0, elapsed - 1)
        if (decay === 0) return
        commit({
          ...data,
          momentum: {
            ...m,
            value: Math.max(0, m.value - decay),
            lastTickDate: today,
          },
        })
      },

      startFieldDay(goalAttempts: number): void {
        const { data } = get()
        if (data.fieldDay.current !== null && data.fieldDay.current.endedAt === undefined) return
        const startedAt = now()
        commit({
          ...data,
          fieldDay: {
            ...data.fieldDay,
            current: {
              id: makeId('fieldday'),
              date: startedAt.slice(0, 10),
              goalAttempts,
              attemptIds: [],
              startedAt,
            },
          },
        })
      },

      endFieldDay(retro?: string): void {
        const { data } = get()
        const day = data.fieldDay.current
        if (day === null || day.endedAt !== undefined) return
        const attempts = data.fieldJournal.attempts.filter((a) => day.attemptIds.includes(a.id))
        const entry = {
          id: day.id,
          date: day.date,
          goalAttempts: day.goalAttempts,
          attemptCount: day.attemptIds.length,
          filled: attempts.filter((a) => a.outcome === 'quote').length,
          hollow: attempts.filter((a) => a.outcome !== undefined && a.outcome !== 'quote').length,
          ...(retro !== undefined && retro.trim() !== '' ? { retro: retro.trim() } : {}),
        }
        commit({
          ...data,
          fieldDay: { current: null, log: [...data.fieldDay.log, entry] },
        })
      },

      integrateEgo(line: string): void {
        const { data } = get()
        const text = line.trim()
        if (text === '') return // one deliberate input — an empty seal is none
        if (data.wisdomCodex.some((w) => w.sourceGuardianId === EGO_SOURCE_ID)) return
        commit({
          ...data,
          wisdomCodex: [
            ...data.wisdomCodex,
            { id: makeId('wisdom'), text, sourceGuardianId: EGO_SOURCE_ID, date: now() },
          ],
        })
      },
    }
  })
}

// ---- App singleton + hooks ----

/** The one live store the app renders from. Tests build their own via createQuestStore. */
export const questStore: StoreApi<QuestState> = createQuestStore()

export function useQuestStore<T>(selector: (state: QuestState) => T): T {
  return useStore(questStore, selector)
}

export function useQuestData(): QuestData {
  return useQuestStore((s) => s.data)
}

/** true = storage ladder fell back to memory; the UI shows the honest banner. */
export function useDegraded(): boolean {
  return useQuestStore((s) => s.degraded)
}

// ---- Selectors (pure, delegating to src/core/metrics) ----

/** Truth leads. null = unlit meter (no assumptions yet). */
export function useTruth(): number | null {
  return useQuestStore((s) => truth(s.data))
}

/** Action follows — raised / total over the ids in play. Self-reported only. */
export function useAction(milestoneIds: readonly string[]): number {
  return useQuestStore((s) => actionFraction(s.data, milestoneIds))
}

/** The crowned guardian: max weight × (4 − derived tier) among untested/testing. */
export function useRiskiest(): Assumption | null {
  return useQuestStore((s) => riskiest(s.data, EARNED_HUNCH_BUMP))
}

/**
 * Evidence banked: any UNRESOLVED guardian holds derived tier ≥ 2. The Truth
 * meter cannot move yet (only resolution moves Truth, 02) — the HUD says so
 * honestly instead of reading as broken (review 5). Pure derive, no mechanic.
 */
export function evidenceBanked(data: QuestData): boolean {
  return data.assumptions.some(
    (a) =>
      (a.status === 'untested' || a.status === 'testing') && tierOf(a, data.evidence) >= 2,
  )
}

export function useEvidenceBanked(): boolean {
  return useQuestStore((s) => evidenceBanked(s.data))
}

export type TierCounts = Readonly<Record<EvidenceTier, number>>

/** Pure tally of evidence coins per tier (E0 Whisper … E4 Gold) for the HUD. */
export function tierCounts(data: QuestData): TierCounts {
  const counts: Record<EvidenceTier, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const e of data.evidence) counts[e.tier] += 1
  return counts
}

export function useTierCounts(): TierCounts {
  return useQuestStore(useShallow((s) => tierCounts(s.data)))
}

/** Trough of sorrow (02): mean of last ≤3 weather values ≤ 2. Suppresses the Shadow. */
export function useTrough(): boolean {
  return useQuestStore((s) => trough(s.data))
}
