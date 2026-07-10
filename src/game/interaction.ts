// src/game/interaction.ts — ephemeral interaction focus for the 3D world.
// Two sources feed ONE highlight (a11y parity, game-design §3): walk-up
// proximity (`nearestId`, written by the player's frame loop) and keyboard
// Tab-cycling (`focusedId` — a focus index in state, no DOM focus tricks).
// The active target is focusedId ?? nearestId; E/Enter activates it.
// NOT state of record: never persisted, never serialized.

import { create } from 'zustand'
import { useJourneyStore } from '../state/journey'
import { ALL_SPECS_BY_ID, layoutForStage } from './contracts'

/** Walk-up highlight radius (metres, horizontal). */
export const INTERACT_RADIUS = 2.75

/** Tab order for the CURRENT world (layout order: shrines, flagpoles, set-pieces, portals). */
function cycleOrder(): readonly string[] {
  return layoutForStage(useJourneyStore.getState().currentStage).map((spec) => spec.id)
}

/** Spec lookup shared by controls, rings, and chips — global across all worlds. */
export const SPEC_BY_ID = ALL_SPECS_BY_ID

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
      const order = cycleOrder()
      const total = order.length
      if (total === 0) return s
      const current = activeTargetId(s)
      const index = current === null ? -1 : order.indexOf(current)
      const start = index === -1 ? (step === 1 ? 0 : total - 1) : (index + step + total) % total
      return { focusedId: order[start] ?? null }
    })
  },

  clearFocus(): void {
    set((s) => (s.focusedId === null ? s : { focusedId: null }))
  },
}))
