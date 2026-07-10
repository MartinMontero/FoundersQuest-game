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
  /** player walks into an onward/back path portal → travel to that world */
  onPortal(targetStage: number): void
}

export type InteractableKind = 'shrine' | 'vault' | 'registry' | 'flagpole' | 'portal'

export interface InteractableSpec {
  id: string
  kind: InteractableKind
  /** [x, y, z] on the grey-box plateau (y = height above ground plane) */
  position: [number, number, number]
  /** set when kind === 'shrine' */
  qid?: string
  /** set when kind === 'flagpole' */
  milestoneId?: string
  /** set when kind === 'portal' — the world this portal travels to (1..8) */
  targetStage?: number
  /** portal direction, for the chip label */
  portalDir?: 'onward' | 'back'
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

// ---- Traversal portals (game-design §1: the path is walkable from minute one) ----
// Grey-box: an onward portal at each world's far edge → the next world, and a back
// portal near spawn → the previous world. (Act-Gate doors and loop toll-portals are
// layered on in later cycles; these plain portals carry the spine's traversal now.)

const ONWARD_POSITION: [number, number, number] = [0, 0, -21]
const BACK_POSITION: [number, number, number] = [-19, 0, 18]

function onwardPortal(fromStage: number): InteractableSpec {
  return {
    id: `portal-${fromStage}-onward`,
    kind: 'portal',
    position: ONWARD_POSITION,
    targetStage: fromStage + 1,
    portalDir: 'onward',
  }
}

function backPortal(fromStage: number): InteractableSpec {
  return {
    id: `portal-${fromStage}-back`,
    kind: 'portal',
    position: BACK_POSITION,
    targetStage: fromStage - 1,
    portalDir: 'back',
  }
}

/** Portals for a world: onward (unless the last) + back (unless the first). */
function portalsForStage(stage: number): InteractableSpec[] {
  const out: InteractableSpec[] = []
  if (stage < STAGES.length) out.push(onwardPortal(stage))
  if (stage > 1) out.push(backPortal(stage))
  return out
}

/**
 * Every placed interactable in the Stage 1 slice: all 8 s1 shrines (ids from
 * src/strings, canon order), 3 milestone flagpoles, the Vault, the Registry, plus
 * the onward portal to World 2.
 */
export const STAGE1_LAYOUT: readonly InteractableSpec[] = [
  ...stage1.questions.map((q) => shrineSpec(q.id)),
  ...STAGE1_MILESTONES.map((m, i) => flagpoleSpec(m, i)),
  { id: 'vault', kind: 'vault', position: VAULT_POSITION },
  { id: 'registry', kind: 'registry', position: REGISTRY_POSITION },
  ...portalsForStage(1),
]

// ---- Generalized per-stage layout (Worlds 2..8; World 1 keeps its hand-authored
// spiral above). Grey-box: shrines on an inward spiral, flagpoles clustered near
// spawn, portals for traversal. Per-world set-pieces (the Raven fellowship circle,
// the forge pyre, the maze, the mirror causeway, the graveyard, the bridge, the
// launch pad) and distinct visuals are layered on in each world's own cycle. ----

const SPIRAL_MAX_R = 18
const SPIRAL_MIN_R = 4
/** shrines wind inward from near spawn (+z) across ~1.15 turns */
function spiralPositions(count: number): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let i = 0; i < count; i += 1) {
    const t = count <= 1 ? 0 : i / (count - 1)
    const r = SPIRAL_MAX_R - t * (SPIRAL_MAX_R - SPIRAL_MIN_R)
    const angle = Math.PI / 2 + t * Math.PI * 2.3 // start at +z (near spawn), wind in
    out.push([
      Math.round(Math.cos(angle) * r * 10) / 10,
      0,
      Math.round(Math.sin(angle) * r * 10) / 10,
    ])
  }
  return out
}

/** three flagpoles in a short row on the near-right, clear of the back portal */
const GENERIC_FLAGPOLES: readonly [number, number, number][] = [
  [7, 0, 16],
  [10, 0, 15],
  [13, 0, 14],
]

function generatedLayout(stage: number): InteractableSpec[] {
  const stageData = STAGES.find((s) => s.stage === stage)
  if (stageData === undefined) throw new Error(`contracts: no STAGES entry for stage ${stage}`)
  const shrinePositions = spiralPositions(stageData.questions.length)
  const shrines: InteractableSpec[] = stageData.questions.map((q, i) => ({
    id: q.id,
    kind: 'shrine',
    position: shrinePositions[i] ?? [0, 0, 0],
    qid: q.id,
  }))
  const milestones = milestonesForStage(stage)
  const poles: InteractableSpec[] = milestones.map((m, i) => ({
    id: m.id,
    kind: 'flagpole',
    position: GENERIC_FLAGPOLES[i] ?? [7, 0, 16],
    milestoneId: m.id,
  }))
  return [...shrines, ...poles, ...portalsForStage(stage)]
}

/** Milestones for any stage, ids per R-K: s{n}-m{1..3}. */
export function milestonesForStage(stage: number): MilestoneSpec[] {
  const stageData = STAGES.find((s) => s.stage === stage)
  if (stageData === undefined) return []
  return stageData.milestones.map((label, index) => ({ id: `s${stage}-m${index + 1}`, label }))
}

export function milestoneIdsForStage(stage: number): string[] {
  return milestonesForStage(stage).map((m) => m.id)
}

/** The full interactable layout for a world: World 1 is hand-authored, 2..8 generated. */
const LAYOUT_BY_STAGE: ReadonlyMap<number, readonly InteractableSpec[]> = new Map(
  STAGES.map((s) => [s.stage, s.stage === 1 ? STAGE1_LAYOUT : generatedLayout(s.stage)]),
)

export function layoutForStage(stage: number): readonly InteractableSpec[] {
  return LAYOUT_BY_STAGE.get(stage) ?? STAGE1_LAYOUT
}

/** Global spec lookup across ALL worlds — ids are globally unique (qids, s{n}-m{k},
 *  stage-scoped set-pieces, portal-{n}-{dir}), so one map serves every world. */
export const ALL_SPECS_BY_ID: ReadonlyMap<string, InteractableSpec> = new Map(
  STAGES.flatMap((s) => layoutForStage(s.stage).map((spec) => [spec.id, spec] as const)),
)
