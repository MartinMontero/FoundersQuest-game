// src/state/journey.ts — which of the 8 worlds the founder is currently walking.
// This is EPHEMERAL game position, NOT journey record: the v3 data model (02) has
// no current-world key — the world is a pure render of the data, and every world is
// walkable from minute one (game-design §1). So currentStage lives device-side under
// its OWN storage key (never inside founders-quest:v3, never serialized), the same
// containment pattern as the founder name and the player's key. It persists only so a
// reload resumes the world you were in; the ONLY record of progress is answers/
// evidence/assumptions in founders-quest:v3.

import { create } from 'zustand'
import { makeStore } from '../core/store'
import { STAGES } from '../strings'

/** The playable world count — the 8 canon stages (03). */
export const STAGE_MIN = 1
export const STAGE_MAX = STAGES.length // 8

/** Its OWN storage key — never founders-quest:v3, never the key store. */
export const JOURNEY_STORAGE_KEY = 'founders-quest:journey'

const store = makeStore()

function clampStage(n: number): number {
  if (!Number.isFinite(n)) return STAGE_MIN
  return Math.min(STAGE_MAX, Math.max(STAGE_MIN, Math.round(n)))
}

/** Guarded read: missing/corrupt → World 1. */
function loadStage(): number {
  const raw = store.get(JOURNEY_STORAGE_KEY)
  if (raw === null) return STAGE_MIN
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? STAGE_MIN : clampStage(parsed)
}

export interface JourneyState {
  /** 1..8 — the world currently mounted and walked */
  currentStage: number
  /** travel to a world (onward path, Act-Gate door, or loop toll-portal) */
  goToStage(stage: number): void
}

export const useJourneyStore = create<JourneyState>((set) => ({
  currentStage: loadStage(),
  goToStage(stage: number): void {
    const next = clampStage(stage)
    store.set(JOURNEY_STORAGE_KEY, String(next))
    set({ currentStage: next })
  },
}))

/** Non-hook read for frame loops / one-shot dispatch (no re-render subscription). */
export function currentStage(): number {
  return useJourneyStore.getState().currentStage
}
