// src/game/interaction.ts — ephemeral interaction focus for the 3D world.
// Two sources feed ONE highlight (a11y parity, game-design §3): walk-up
// proximity (`nearestId`, written by the player's frame loop) and keyboard
// Tab-cycling (`focusedId` — a focus index in state, no DOM focus tricks).
// The active target is focusedId ?? nearestId; E/Enter activates it.
// NOT state of record: never persisted, never serialized.

import { create } from 'zustand'
import { STAGE1_LAYOUT, type InteractableSpec } from './contracts'

/** Walk-up highlight radius (metres, horizontal). */
export const INTERACT_RADIUS = 2.75

/** Tab order = layout order: shrines in canon order, flagpoles, vault, registry. */
const CYCLE_ORDER: readonly string[] = STAGE1_LAYOUT.map((spec) => spec.id)

/** Spec lookup shared by controls, rings, and chips. */
export const SPEC_BY_ID: ReadonlyMap<string, InteractableSpec> = new Map(
  STAGE1_LAYOUT.map((spec) => [spec.id, spec]),
)

export interface InteractionState {
  /** nearest interactable within INTERACT_RADIUS, else null (proximity-derived) */
  nearestId: string | null
  /** Tab/Shift-Tab focus index target, else null (keyboard-driven) */
  focusedId: string | null
  setNearest(id: string | null): void
  cycleFocus(step: 1 | -1): void
  clearFocus(): void
}

/** The one highlighted/activatable target: keyboard focus wins over proximity. */
export function activeTargetId(state: {
  nearestId: string | null
  focusedId: string | null
}): string | null {
  return state.focusedId ?? state.nearestId
}

export const useInteractionStore = create<InteractionState>()((set) => ({
  nearestId: null,
  focusedId: null,

  setNearest(id: string | null): void {
    set((s) => (s.nearestId === id ? s : { nearestId: id }))
  },

  cycleFocus(step: 1 | -1): void {
    set((s) => {
      const total = CYCLE_ORDER.length
      if (total === 0) return s
      const current = activeTargetId(s)
      const index = current === null ? -1 : CYCLE_ORDER.indexOf(current)
      const start = index === -1 ? (step === 1 ? 0 : total - 1) : (index + step + total) % total
      return { focusedId: CYCLE_ORDER[start] ?? null }
    })
  },

  clearFocus(): void {
    set((s) => (s.focusedId === null ? s : { focusedId: null }))
  },
}))
