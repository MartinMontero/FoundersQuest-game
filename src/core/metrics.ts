// src/core/metrics.ts — "Computed metrics (exact)" from docs/canon/02-architecture.md.
// Framework-free and pure: no Date.now() — anything time-dependent takes its
// timestamp as a parameter so tests stay deterministic.

import type {
  Assumption,
  EvidenceEntry,
  EvidenceTier,
  Importance,
  QuestData,
} from './schema'

/** Truth/riskiest weights (02): dies=3, wobbles=2, shrugs=1. */
export const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  dies: 3,
  wobbles: 2,
  shrugs: 1,
}

/** XP awards (02). Invalidation pays 1.5x validation (01) — 15 vs 10. */
export const XP_INVALIDATED = 15
export const XP_VALIDATED = 10
export const XP_SIDE_QUEST = 5

/**
 * tierOf(a) = max tier of evidence linked to assumption `a`, else 0 (02).
 * Tier is DERIVED from linked evidence, never stored on the assumption.
 */
export function tierOf(a: Assumption, evidence: readonly EvidenceEntry[]): EvidenceTier {
  let max: EvidenceTier = 0
  for (const e of evidence) {
    if (e.tier > max && e.linkedAssumptionIds.includes(a.id)) max = e.tier
  }
  return max
}

/**
 * Truth = Σ weight(resolved with derived tier≥2) / Σ weight over ALL assumptions (02).
 * "Resolved with tier≥2" = status validated|invalidated AND tierOf ≥ 2 — hunches
 * (tier < 2) never move Truth. Returns null when there are no assumptions.
 * Milestones, side quests, and the field journal never touch this number.
 */
export function truth(data: QuestData): number | null {
  if (data.assumptions.length === 0) return null
  let numerator = 0
  let denominator = 0
  for (const a of data.assumptions) {
    const w = IMPORTANCE_WEIGHT[a.importance]
    denominator += w
    const resolved = a.status === 'validated' || a.status === 'invalidated'
    if (resolved && tierOf(a, data.evidence) >= 2) numerator += w
  }
  return numerator / denominator
}

/**
 * XP = per assumption with derived tier≥2: invalidated +15, validated +10;
 * plus +5 per COMPLETED side quest (02). Tier<2 resolutions earn nothing.
 */
export function xp(data: QuestData): number {
  let total = 0
  for (const a of data.assumptions) {
    if (tierOf(a, data.evidence) < 2) continue
    if (a.status === 'invalidated') total += XP_INVALIDATED
    else if (a.status === 'validated') total += XP_VALIDATED
  }
  for (const quest of Object.values(data.sideQuests)) {
    if (quest.completedAt !== undefined) total += XP_SIDE_QUEST
  }
  return total
}

/**
 * Riskiest guardian = the untested|testing assumption maximizing
 * weight × (4 − tierOf) (02). Null when none. Deterministic tie-break:
 * earlier createdAt wins, then smaller id — independent of array order.
 * (Earned-hunch priority bump is queued canon work, not implemented here.)
 */
export function riskiest(data: QuestData): Assumption | null {
  let best: Assumption | null = null
  let bestScore = 0
  for (const a of data.assumptions) {
    if (a.status !== 'untested' && a.status !== 'testing') continue
    const score = IMPORTANCE_WEIGHT[a.importance] * (4 - tierOf(a, data.evidence))
    if (
      best === null ||
      score > bestScore ||
      (score === bestScore &&
        (a.createdAt < best.createdAt || (a.createdAt === best.createdAt && a.id < best.id)))
    ) {
      best = a
      bestScore = score
    }
  }
  return best
}

/**
 * Trough = mean of the last ≤3 weather values ≤ 2 (02); false when no weather.
 * "Last" is chronological (by entry date, stable for equal dates), not array order.
 * `today` is accepted for signature stability alongside fieldAttemptTally; the
 * canon formula does not window by date, so it is unused.
 */
export function trough(data: QuestData, today?: string): boolean {
  void today
  if (data.weather.length === 0) return false
  const chronological = [...data.weather].sort((x, y) =>
    x.date < y.date ? -1 : x.date > y.date ? 1 : 0,
  )
  const window = chronological.slice(-3)
  let sum = 0
  for (const w of window) sum += w.value
  return sum / window.length <= 2
}

export interface FieldAttemptTally {
  total: number
  last7Days: number
}

const MS_PER_DAY = 86_400_000

/** UTC day number for the YYYY-MM-DD prefix of an ISO string, or null if malformed. */
function dayOf(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return null
  const y = Number(iso.slice(0, 4))
  const mo = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  return Date.UTC(y, mo - 1, d) / MS_PER_DAY
}

/**
 * Field-attempt tally = derived count of fieldJournal.attempts with a 7-day
 * trailing figure (02). The trailing window is the 7 calendar days ending at
 * `today` inclusive (startedAt date within [today−6, today], UTC dates).
 * Displayed WITH Action; it NEVER feeds the Action formula, Truth, or XP.
 */
export function fieldAttemptTally(data: QuestData, today: string): FieldAttemptTally {
  const attempts = data.fieldJournal.attempts
  const todayDay = dayOf(today)
  let last7Days = 0
  if (todayDay !== null) {
    for (const attempt of attempts) {
      const day = dayOf(attempt.startedAt)
      if (day === null) continue
      const diff = todayDay - day
      if (diff >= 0 && diff <= 6) last7Days += 1
    }
  }
  return { total: attempts.length, last7Days }
}

/**
 * Action = raised milestones / total milestone ids. Self-reported only; the
 * formula is unchanged by field attempts (02). Returns 0 for an empty id list.
 * Milestone toggles never touch Truth or XP.
 */
export function actionFraction(data: QuestData, milestoneIds: readonly string[]): number {
  if (milestoneIds.length === 0) return 0
  let raised = 0
  for (const id of milestoneIds) {
    if (data.milestones[id] === true) raised += 1
  }
  return raised / milestoneIds.length
}
