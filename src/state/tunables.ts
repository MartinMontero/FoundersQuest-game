// src/state/tunables.ts — Shadow tunables per R-F ruling (2026-07-08):
// starting values live as CODE CONSTANTS only; no numbers enter canon.
// Revisited after the operator plays the Gate 2 slice.

import { actionFraction, trough, truth } from '../core/metrics'
import type { QuestData } from '../core/schema'
import { STAGE1_MILESTONE_IDS } from '../game/contracts'

/** Summon when Action − Truth ≥ this many percentage points. */
export const SHADOW_DIVERGENCE_PP = 40

/** ...and at least this many assumptions stand registered. */
export const SHADOW_MIN_ASSUMPTIONS = 3

/**
 * The derived divergence check — no write, zero network. True when:
 *   - ≥ SHADOW_MIN_ASSUMPTIONS assumptions are registered,
 *   - NOT in the trough (the Shadow holds fire there — 02/03), and
 *   - Action − Truth ≥ SHADOW_DIVERGENCE_PP percentage points,
 * where Action = actionFraction over `milestoneIds` and Truth = truth(data)
 * (non-null whenever the assumption floor is met).
 *
 * `milestoneIds` defaults to the Stage-1 slice's ids — the denominator of the
 * Action meter actually in play this phase; Phase 3 passes the wider list.
 */
export function shouldSummonShadow(
  data: QuestData,
  milestoneIds: readonly string[] = STAGE1_MILESTONE_IDS,
): boolean {
  if (data.assumptions.length < SHADOW_MIN_ASSUMPTIONS) return false
  if (trough(data)) return false
  const truthFraction = truth(data) ?? 0 // null only below the floor, handled above
  const divergence = actionFraction(data, milestoneIds) - truthFraction
  // compare as fractions (PP / 100) so the 40pp boundary is exact in floating point
  return divergence >= SHADOW_DIVERGENCE_PP / 100
}
