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

declare global {
  interface Window {
    /** dev/e2e builds only — the active interactable id (Tab focus ?? proximity).
     * e2e reads this to Tab to an EXACT interactable, immune to the drei <Html>
     * focus-chip render lag: the store value is exact; only the label lags a frame. */
    __fq_target?: string | null
  }
}

// dev/e2e only: mirror the active target onto window so e2e can navigate to an
// exact interactable by id. Stripped from production (import.meta.env.DEV), and
// never runs where there is no window — vitest's node env AND the Playwright
// test runner (which imports this module transitively via CameraRig; there
// `import.meta.env` is undefined, so `window` MUST be tested first to short-
// circuit before touching it). Measurement only — no telemetry.
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const publish = (s: InteractionState): void => {
    window.__fq_target = activeTargetId(s)
  }
  publish(useInteractionStore.getState())
  useInteractionStore.subscribe(publish)
}
