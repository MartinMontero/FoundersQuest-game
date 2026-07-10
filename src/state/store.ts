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
import { actionFraction, riskiest, tierOf, trough, truth, type ActGateId } from '../core/metrics'
import { migrateV2IfNeeded } from '../core/migration'
import type {
  Answer,
  Assumption,
  EvidenceEntry,
  EvidenceTier,
  Importance,
  QuestData,
  WeatherEntry,
} from '../core/schema'
import { loadQuestData, makeStore, saveQuestData, type QuestStore } from '../core/store'

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
        const resolvedAt = now()
        commit({
          ...data,
          assumptions: data.assumptions.map((a) =>
            a.id === id && a.status !== 'invalidated'
              ? { ...a, status: 'invalidated', resolvedAt }
              : a,
          ),
        })
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
  return useQuestStore((s) => riskiest(s.data))
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
