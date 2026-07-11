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

/**
 * Weight lookup that survives corrupted data: an unknown importance value
 * (possible in a hand-edited record) falls back to the shrugs weight, so the
 * Truth/riskiest math can never produce NaN (Phase 2 review, ruled fix 6).
 */
export function importanceWeight(importance: Importance): number {
  return IMPORTANCE_WEIGHT[importance] ?? IMPORTANCE_WEIGHT.shrugs
}

/** XP awards (02). Invalidation pays 1.5x validation (01) — 15 vs 10. */
export const XP_INVALIDATED = 15
export const XP_VALIDATED = 10
export const XP_SIDE_QUEST = 5
/** The D-G carve-out (02, 2026-07-11): a resolved firstLight-tagged assumption
 *  pays this FIXED award outside the tier≥2 formula — the tutorial artifact is
 *  real, the live metric stays uncorrupted. Matches the invalidation award so
 *  the first kill's celebration is honest. */
export const XP_FIRST_LIGHT = 15

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
  // D-G carve-out (02, 2026-07-11): firstLight-tagged assumptions are excluded
  // from the denominator entirely — the tutorial can never lower (or raise)
  // the founder's live Truth ceiling.
  const counted = data.assumptions.filter((a) => a.firstLight !== true)
  if (counted.length === 0) return null
  let numerator = 0
  let denominator = 0
  for (const a of counted) {
    const w = importanceWeight(a.importance)
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
    // D-G carve-out: a RESOLVED firstLight assumption pays the fixed award
    // outside the tier≥2 formula (tier is irrelevant to it, both directions)
    if (a.firstLight === true) {
      if (a.status === 'invalidated' || a.status === 'validated') total += XP_FIRST_LIGHT
      continue
    }
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
 * True when guardian `a` was SEEDED from an Earned-provenance hunch: a tier-0
 * (Whisper) entry tagged 'earned' links it. Linking a hunch never raises tierOf
 * (0 is the floor), so seeding is priority-visible but weight/Truth-invisible.
 */
export function seededFromEarnedHunch(a: Assumption, evidence: readonly EvidenceEntry[]): boolean {
  return evidence.some(
    (e) => e.tier === 0 && e.provenance === 'earned' && e.linkedAssumptionIds.includes(a.id),
  )
}

/**
 * Riskiest guardian = the untested|testing assumption maximizing
 * weight × (4 − tierOf) (02). Null when none. Deterministic tie-break:
 * earlier createdAt wins, then smaller id — independent of array order.
 *
 * `earnedBump` (02 computed-metrics, 2026-07-11): a guardian seeded from an
 * Earned-provenance hunch adds this constant to its ORDERING score only. The
 * value lives in src/state/tunables.ts (code constant, never canon); core
 * takes it as a parameter so this module stays framework- and state-free.
 * Weight, Truth, and XP are untouched by the bump (invariant-tested).
 */
export function riskiest(data: QuestData, earnedBump = 0): Assumption | null {
  let best: Assumption | null = null
  let bestScore = 0
  for (const a of data.assumptions) {
    if (a.status !== 'untested' && a.status !== 'testing') continue
    const score =
      importanceWeight(a.importance) * (4 - tierOf(a, data.evidence)) +
      (earnedBump !== 0 && seededFromEarnedHunch(a, data.evidence) ? earnedBump : 0)
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

// ---- Sequence locks (03; gates WARN, never block — canon 01) ----

/** The verdict recorded at the Mirror (s5-th) — the key to the W5 sequence lock. */
export function verdictRecorded(data: QuestData): boolean {
  const v = data.answers['s5']?.['s5-th']?.verdict
  return v === 'yes' || v === 'no'
}

/** The pivot/persevere decision cast with ≥1 citation (s5-dec) — part of Act II. */
function decisionCited(data: QuestData): boolean {
  const a = data.answers['s5']?.['s5-dec']
  const decided = a?.decision === 'pivot' || a?.decision === 'persevere'
  return decided && (a?.citedEvidenceIds?.length ?? 0) >= 1
}

export type ActGateId = 'act1' | 'act2' | 'act3'

/**
 * Whether an Act Gate's canon bar (03) is met — ALL derived, never stored.
 * This only REPORTS met/unmet; the crossing is always allowed (gates warn, never
 * block — canon 01). Unmet just means the override path (a written reason) is used.
 * - act1 (after W2): s1 threshold answered · ≥5 E2+ · ≥1 E3+ · a written kill criterion.
 * - act2 (after W5): verdict recorded · pivot/persevere decided with ≥1 citation.
 * - act3 (after W7): unit walk-through (s7-th) answered · SPOF (s7-l2) answered.
 */
export function gateMet(data: QuestData, gateId: ActGateId): boolean {
  switch (gateId) {
    case 'act1': {
      const thresholdAnswered = data.answers['s1']?.['s1-th'] !== undefined
      let e2 = 0
      let e3 = 0
      for (const e of data.evidence) {
        if (e.tier >= 2) e2 += 1
        if (e.tier >= 3) e3 += 1
      }
      const hasKillCriterion = data.assumptions.some((a) => a.killCriterion.trim() !== '')
      return thresholdAnswered && e2 >= 5 && e3 >= 1 && hasKillCriterion
    }
    case 'act2':
      return verdictRecorded(data) && decisionCited(data)
    case 'act3':
      return (
        data.answers['s7']?.['s7-th'] !== undefined && data.answers['s7']?.['s7-l2'] !== undefined
      )
  }
}
