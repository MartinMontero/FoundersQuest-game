// src/game/contracts.ts — the interface file the world and UI agents implement
// against. Pure data + types: no React, no three, no zustand.
//
// Milestone ids: R-K ruling (2026-07-08) — this greenfield build defines the id
// constants. Stage-1 milestone ids derive as s1-m1|s1-m2|s1-m3 in the order the
// milestones appear in src/strings questions.ts (03 verbatim); cross-checked
// against the v3 source when the operator's upload lands.

import { STAGES } from '../strings'

/** Callbacks the world fires; the UI layer supplies the implementation. */
export interface WorldEvents {
  /** player kneels at a shrine (E/Enter on walk-up or Tab focus) */
  onShrineEnter(qid: string): void
  onVaultApproach(): void
  onRegistryApproach(): void
  /** player pulls a milestone flagpole (raise or lower — self-report, Action only) */
  onFlagpole(id: string): void
}

export type InteractableKind = 'shrine' | 'vault' | 'registry' | 'flagpole'

export interface InteractableSpec {
  id: string
  kind: InteractableKind
  /** [x, y, z] on the grey-box plateau (y = height above ground plane) */
  position: [number, number, number]
  /** set when kind === 'shrine' */
  qid?: string
  /** set when kind === 'flagpole' */
  milestoneId?: string
}

export interface MilestoneSpec {
  id: string
  /** verbatim 03 milestone text, from src/strings */
  label: string
}

const stage1 = STAGES.find((s) => s.stage === 1)
if (stage1 === undefined) throw new Error('contracts: stage 1 missing from src/strings STAGES')

/** Stage-1 milestones in 03 order, ids per R-K: s1-m1 | s1-m2 | s1-m3. */
export const STAGE1_MILESTONES: readonly MilestoneSpec[] = stage1.milestones.map(
  (label, index) => ({ id: `s1-m${index + 1}`, label }),
)

export const STAGE1_MILESTONE_IDS: readonly string[] = STAGE1_MILESTONES.map((m) => m.id)

// ---- Stage 1 grey-box layout: a compact nebula plateau ----
// A spiral of islands descending inward to the Five Whys well (s1-l2) at the
// center (game-design §1 World 1). Grey-box: flat plateau at y=0; the world
// agent owns visual elevation/dissolve. The Vault hovers over the spiral,
// watching. Spawn is assumed near the south edge (+z), by the flag row.

const SHRINE_POSITIONS: Readonly<Record<string, [number, number, number]>> = {
  's1-th': [0, 0, 14], //   outer island, nearest spawn — the threshold story
  's1-l1': [10, 0, 9], //   spiral, first turn
  's1-l2': [0, 0, 0], //    the Five Whys well at the spiral's center
  's1-l3': [12, 0, -2],
  's1-l4': [7, 0, -10],
  's1-l5': [-2, 0, -13],
  's1-fp': [-10, 0, -8], // strip-it-bare, beside the registry ledge
  's1-fx': [-12, 0, 2], //  falsify, last before the descent onward
}

const FLAGPOLE_POSITIONS: readonly [number, number, number][] = [
  [-5, 0, 16],
  [-8, 0, 14],
  [-11, 0, 12],
]

/** The chained chest hovers over the spiral (01: captured, visible, sealed). */
export const VAULT_POSITION: [number, number, number] = [5, 2, 4]

/** The guardians' ledge — registry figures stand here, riskiest crowned. */
export const REGISTRY_POSITION: [number, number, number] = [-8, 0, -14]

function shrineSpec(qid: string): InteractableSpec {
  const position = SHRINE_POSITIONS[qid]
  if (position === undefined) throw new Error(`contracts: no position for shrine ${qid}`)
  return { id: qid, kind: 'shrine', position, qid }
}

function flagpoleSpec(milestone: MilestoneSpec, index: number): InteractableSpec {
  const position = FLAGPOLE_POSITIONS[index]
  if (position === undefined) throw new Error(`contracts: no position for flagpole ${milestone.id}`)
  return { id: milestone.id, kind: 'flagpole', position, milestoneId: milestone.id }
}

/**
 * Every placed interactable in the Stage 1 slice: all 8 s1 shrines (ids from
 * src/strings, canon order), 3 milestone flagpoles, the Vault, the Registry.
 */
export const STAGE1_LAYOUT: readonly InteractableSpec[] = [
  ...stage1.questions.map((q) => shrineSpec(q.id)),
  ...STAGE1_MILESTONES.map((m, i) => flagpoleSpec(m, i)),
  { id: 'vault', kind: 'vault', position: VAULT_POSITION },
  { id: 'registry', kind: 'registry', position: REGISTRY_POSITION },
]
