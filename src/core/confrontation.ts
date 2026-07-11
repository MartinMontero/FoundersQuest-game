// src/core/confrontation.ts — the confrontation loop's pure argument math
// (Mind & Myth A4, addendum §7; research: antagonist-combat-architecture.md).
// Framework-free and derived-never-stored: the persistent record is ONLY
// confrontations[] (canon 02 — guardianId, startedAt, resolvedAt?, outcome?,
// citations[]); everything here replays from it deterministically.
//
// Three rulings are LAW in this module (Gate 0, 2026-07-11):
// - B2 bounce-is-feedback: an E0/E1 citation changes NOTHING — it never
//   strengthens the guardian and never penalizes the founder.
// - B3 no-inverse-HP: argument-HP reaching 0 means the argument is SPENT,
//   never that the belief resolves — only the recorded verdict does that.
// - D-C action-never-gates-evidence: nothing in this module takes a stagger,
//   poise, or timing parameter. Citation math is unconditional by design.

import type {
  ConfrontationRecord,
  EvidenceTier,
  Importance,
  QuestData,
} from './schema'

// ---- Sizing (code constants per R-F: numbers never enter canon) ----

/** Argument-HP by importance weight — dies is hulking, shrugs is brittle. */
export const ARGUMENT_HP: Record<Importance, number> = {
  dies: 12,
  wobbles: 8,
  shrugs: 5,
}

/** Composure — the guardian's shield. Soaks citation damage before HP. */
export const COMPOSURE: Record<Importance, number> = {
  dies: 4,
  wobbles: 2,
  shrugs: 1,
}

/**
 * Citation damage is strictly tiered per canon: hunches and rumors (E0/E1)
 * BOUNCE — zero damage, zero side effects, the line teaches "this can't move
 * Truth" and nothing more. E2 standard, E3 heavy, E4 shatters (see below).
 */
export const CITATION_DAMAGE: Record<EvidenceTier, number> = {
  0: 0,
  1: 0,
  2: 2,
  3: 4,
  4: 6,
}

export interface ArgumentState {
  hpMax: number
  hp: number
  composureMax: number
  composure: number
  /** an E4 has shattered the shield this confrontation (staging flag) */
  shattered: boolean
}

export type CitationImpact =
  | 'bounce' // E0/E1 — no state change, pure feedback
  | 'hit' // E2 — standard chip
  | 'heavy' // E3 — heavy chip
  | 'shatter' // E4 — the shield shatters outright, damage overflows to core

/** Impact class by tier — the single mapping applyCitation and the store share. */
export function citationImpact(tier: EvidenceTier): CitationImpact {
  if (tier <= 1) return 'bounce'
  if (tier === 4) return 'shatter'
  return tier === 3 ? 'heavy' : 'hit'
}

export function initialArgumentState(importance: Importance): ArgumentState {
  const hpMax = ARGUMENT_HP[importance] ?? ARGUMENT_HP.shrugs
  const composureMax = COMPOSURE[importance] ?? COMPOSURE.shrugs
  return { hpMax, hp: hpMax, composureMax, composure: composureMax, shattered: false }
}

/**
 * Apply one citation. E0/E1 return the SAME state object (reference-equal) —
 * the bounce invariant is structural, not a zero that something downstream
 * could re-interpret. E2/E3 soak composure first, remainder chips HP. E4
 * destroys the whole remaining shield AND lands its full damage on the core
 * (the Griftlands overflow). HP floors at 0 and never resolves anything (B3).
 */
export function applyCitation(
  state: ArgumentState,
  tier: EvidenceTier,
): { next: ArgumentState; impact: CitationImpact } {
  const impact = citationImpact(tier)
  if (impact === 'bounce') return { next: state, impact }
  const damage = CITATION_DAMAGE[tier] ?? 0
  if (impact === 'shatter') {
    return {
      next: {
        ...state,
        composure: 0,
        hp: Math.max(0, state.hp - damage),
        shattered: true,
      },
      impact,
    }
  }
  const soaked = Math.min(state.composure, damage)
  return {
    next: {
      ...state,
      composure: state.composure - soaked,
      hp: Math.max(0, state.hp - (damage - soaked)),
    },
    impact,
  }
}

/**
 * Replay a confrontation's citations (order preserved — overflow depends on
 * it) into the current argument state. Unknown citation ids are SKIPPED, not
 * guessed: a citation must point at a real Ledger entry to have ever landed,
 * and a corrupted record degrades to "less damage dealt", never to fabricated
 * damage. Deterministic: same record + same ledger ⇒ same state.
 */
export function argumentStateFrom(
  importance: Importance,
  citations: readonly string[],
  evidence: readonly { id: string; tier: EvidenceTier }[],
): ArgumentState {
  let state = initialArgumentState(importance)
  for (const id of citations) {
    const entry = evidence.find((e) => e.id === id)
    if (entry === undefined) continue
    state = applyCitation(state, entry.tier).next
  }
  return state
}

/** The argument is SPENT — nothing left to say. NOT a resolution (B3). */
export function argumentSpent(state: ArgumentState): boolean {
  return state.hp === 0
}

// ---- The confrontation record (canon 02 shape) ----

/** The one open (unresolved) confrontation for a guardian, if any. */
export function openConfrontation(
  data: QuestData,
  guardianId: string,
): ConfrontationRecord | undefined {
  return data.confrontations.find(
    (c) => c.guardianId === guardianId && c.resolvedAt === undefined,
  )
}

/**
 * The finisher — the sealed kill criterion's golden thread. Available exactly
 * when the real-world verdict has been recorded against the sealed criterion
 * (outcome set) and the finishing strike has not yet been used (unresolved).
 * A pure predicate over the record: no randomness, no draw, no HP clause —
 * once available it STAYS available until used (tested invariant).
 */
export function finisherAvailable(confrontation: ConfrontationRecord | undefined): boolean {
  return (
    confrontation !== undefined &&
    confrontation.outcome !== undefined &&
    confrontation.resolvedAt === undefined
  )
}

// ---- The funeral queue (derived — the rite writes funerals[], nothing else) ----

/** The funeral record for a guardian, if any (held, skipped, or both). */
export function funeralFor(
  data: QuestData,
  guardianId: string,
): QuestData['funerals'][number] | undefined {
  return data.funerals.find((f) => f.guardianId === guardianId)
}

/**
 * Beliefs awaiting their funeral: invalidated, not First-Light (the tutorial
 * kill has its own celebration), and no funerals[] record at all — neither
 * held nor skipped. Any invalidation qualifies, any world (D-A): the rite
 * generalizes the Mirror's s5-l5 funeral, it does not replace it.
 */
export function pendingFunerals(data: QuestData): QuestData['assumptions'] {
  return data.assumptions.filter(
    (a) =>
      a.status === 'invalidated' &&
      a.firstLight !== true &&
      funeralFor(data, a.id) === undefined,
  )
}

/**
 * Restless ghosts: funerals skipped and never since held. A NARRATIVE-ONLY
 * consequence — no XP loss, no streaks, nothing mechanical reads this except
 * the Ego's runtime derivation (A5) and the world's ghost markers. A delayed
 * funeral (heldAt set later) lays the ghost to rest and removes that weapon.
 */
export function restlessGhosts(data: QuestData): QuestData['funerals'] {
  return data.funerals.filter((f) => f.skippedAt !== undefined && f.heldAt === undefined)
}
