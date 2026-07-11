// src/core/ego.ts — the Ego, the final boss of World 8 (Mind & Myth A5).
// Per D-B the Ego is the boss-form of the roaming Shadow: ONE entity, two
// scales — and its record is DERIVED at runtime from the founder's real data
// (trail/gates/funerals/assumptions). Nothing here is ever stored: no
// egoRecord key exists in the schema, mirroring the tier-derivation rule.
//
// THE INVARIANT THAT OUTRANKS EVERY FORMULA (addendum §8, property-tested):
// capturing an assumption and resolving it at E2+ must NEVER leave the
// founder worse off against the Ego than not capturing it at all. The
// formula below is tuned to that test, never the reverse:
//   - resolved assumptions are EXCLUDED from the HP pool (only untested/
//     testing weight feeds it), and
//   - every E2+-resolved assumption feeds founderEdge, a per-cite damage
//     bonus — so capture+resolve@E2+ strictly helps, never hurts.
//
// All dialogue is pre-written (D-E): this module and the fight above it run
// with ZERO API spend. The fight's session progress is deliberately unstored
// (leaving re-forms the Ego); only deliberate record writes persist.

import { actionFraction, importanceWeight, tierOf, truth } from './metrics'
import { restlessGhosts } from './confrontation'
import type { EvidenceTier, QuestData } from './schema'

// ---- Sizing (code constants per R-F: numbers never enter canon) ----

export const EGO_BASE_HP = 6
/** HP added per point of UNTESTED/testing importance weight — the more left
 *  untested, the tankier the Ego (research §3d). */
export const EGO_HP_PER_WEIGHT = 2
/** HP added per restless ghost (skipped, unheld funeral) — the summons.
 *  A delayed funeral removes the weapon before the fight even starts. */
export const EGO_HP_PER_GHOST = 2
/** founderEdge damage bonus cap — proof of testing sharpens every cite. */
export const EGO_EDGE_CAP = 2

/** The Ego's shield: one overridden Act Gate, carrying its logged reason. */
export interface EgoShield {
  gateId: string
  /** the founder's own override reason, verbatim from the record */
  reason: string
}

/** The Ego, assembled from the record. DERIVED — never serialized. */
export interface EgoRecord {
  hp: number
  /** overridden gates — each absorbs one landed cite, naming its reason */
  shields: EgoShield[]
  /** guardianIds of skipped-unheld funerals — the named summons */
  ghostIds: string[]
  /** ids of untested (non-firstLight) assumptions — projection ammunition */
  untestedIds: string[]
  /** count of E2+-resolved assumptions — the founder's earned edge */
  founderEdge: number
  /** live Action − Truth divergence (0..1) — the heavy-attack strength */
  divergence: number
}

/** Non-firstLight assumptions still standing open (untested|testing). */
function openAssumptions(data: QuestData): QuestData['assumptions'] {
  return data.assumptions.filter(
    (a) =>
      a.firstLight !== true && (a.status === 'untested' || a.status === 'testing'),
  )
}

/** Count of assumptions RESOLVED at derived tier ≥ 2 — real, proven tests. */
export function resolvedAtE2Plus(data: QuestData): number {
  let count = 0
  for (const a of data.assumptions) {
    if (a.firstLight === true) continue
    if (a.status !== 'validated' && a.status !== 'invalidated') continue
    if (tierOf(a, data.evidence) >= 2) count += 1
  }
  return count
}

/**
 * Assemble the Ego from the record. Pure; same record ⇒ same Ego.
 * `milestoneIds` feeds the live Action fraction (the divergence read).
 */
export function deriveEgo(data: QuestData, milestoneIds: readonly string[]): EgoRecord {
  const open = openAssumptions(data)
  let untestedWeight = 0
  for (const a of open) untestedWeight += importanceWeight(a.importance)
  const ghosts = restlessGhosts(data)
  const shields: EgoShield[] = []
  for (const gateId of ['act1', 'act2', 'act3'] as const) {
    const gate = data.gates[gateId]
    if (gate?.status === 'overridden') {
      shields.push({ gateId, reason: gate.reason ?? '' })
    }
  }
  const divergence = Math.max(0, actionFraction(data, milestoneIds) - (truth(data) ?? 0))
  return {
    hp: EGO_BASE_HP + untestedWeight * EGO_HP_PER_WEIGHT + ghosts.length * EGO_HP_PER_GHOST,
    shields,
    ghostIds: ghosts.map((g) => g.guardianId),
    untestedIds: open.filter((a) => a.status === 'untested').map((a) => a.id),
    founderEdge: Math.min(EGO_EDGE_CAP, resolvedAtE2Plus(data)),
    divergence,
  }
}

// ---- The defense-mechanism ladder (research §3d; deterministic) ----

export type EgoPhase =
  | 'denial' // only E3/E4 land — denial can't survive Gold
  | 'rationalization' // only evidence linked to a SEALED criterion lands
  | 'projection' // no damage: untested assumptions returned as tests
  | 'sunk-cost' // chains cut by proof the investment wasn't returning
  | 'identity-fusion' // cannot be won by damage — integration only

export const EGO_PHASES: readonly EgoPhase[] = [
  'denial',
  'rationalization',
  'projection',
  'sunk-cost',
  'identity-fusion',
]

/**
 * Whether a citation LANDS in a phase (pure; the phase rules of §8).
 * `sealed` = the coin links a guardian whose kill criterion was sealed;
 * `cutsChain` = it proves an investment wasn't returning (linked to an
 * invalidated guardian) — any E4 payment coin also cuts.
 * E0/E1 NEVER land anywhere (B2 holds against the Ego too).
 */
export function citationLands(
  phase: EgoPhase,
  tier: EvidenceTier,
  opts: { sealed: boolean; cutsChain: boolean },
): boolean {
  if (tier <= 1) return false
  switch (phase) {
    case 'denial':
      return tier >= 3
    case 'rationalization':
      return opts.sealed
    case 'projection':
      return false // no damage phase — projections are returned, not cited
    case 'sunk-cost':
      return opts.cutsChain || tier === 4
    case 'identity-fusion':
      return false // cannot be won by damage
  }
}

/** Damage of a landed cite: the A4 tier table plus the founder's edge. */
export function egoCiteDamage(tier: EvidenceTier, founderEdge: number): number {
  const base: Record<EvidenceTier, number> = { 0: 0, 1: 0, 2: 2, 3: 4, 4: 6 }
  return (base[tier] ?? 0) + Math.min(EGO_EDGE_CAP, Math.max(0, founderEdge))
}

/**
 * The damage-phase HP thresholds: denial holds until hp ≤ 2/3, then
 * rationalization until ≤ 1/3, then (after projection) sunk-cost to 0.
 * Pure over (hpMax, hpLeft) so the fight state stays a fold.
 */
export function damagePhaseFor(hpMax: number, hpLeft: number): EgoPhase {
  if (hpLeft > (2 * hpMax) / 3) return 'denial'
  if (hpLeft > hpMax / 3) return 'rationalization'
  return 'sunk-cost'
}

/** The capstone: integration is recorded as the founder's own codex line with
 *  sourceGuardianId 'ego' — no new schema key, derived like everything else. */
export const EGO_SOURCE_ID = 'ego'

export function egoIntegrated(data: QuestData): boolean {
  return data.wisdomCodex.some((w) => w.sourceGuardianId === EGO_SOURCE_ID)
}
