// src/game — the 3D world. Public surface: <GameRoot/> plus the contracts
// the UI layer implements against (re-exported for convenience).

export { GameRoot, World, type GameRootProps, type WorldProps } from './World'
export { defaultWorldEvents } from './events'
export { useReducedMotion } from './useReducedMotion'
export {
  STAGE1_LAYOUT,
  STAGE1_MILESTONES,
  STAGE1_MILESTONE_IDS,
  VAULT_POSITION,
  REGISTRY_POSITION,
  type WorldEvents,
  type InteractableSpec,
  type InteractableKind,
  type MilestoneSpec,
} from './contracts'
