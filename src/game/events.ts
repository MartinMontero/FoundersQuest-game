// src/game/events.ts — the default WorldEvents wiring: world gestures land in
// the two stores (ui for surfaces, quest for the one write the world gesture
// IS — the flagpole self-report, Action only, per game-design §4).
// The UI layer may pass its own WorldEvents into <GameRoot events={...}/> and
// override any of these.

import { useJourneyStore } from '../state/journey'
import { questStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { useInteractionStore } from './interaction'
import type { WorldEvents } from './contracts'

export const defaultWorldEvents: WorldEvents = {
  onShrineEnter(qid: string): void {
    useUiStore.getState().enterTrance(qid)
  },
  onVaultApproach(): void {
    useUiStore.getState().openPanel('panel:vault')
  },
  onRegistryApproach(): void {
    useUiStore.getState().openPanel('panel:registry')
  },
  onFlagpole(id: string): void {
    // self-report: milestones[id] flips — Action only, never Truth (02/04 map)
    questStore.getState().toggleMilestone(id)
  },
  onPortal(targetStage: number): void {
    // travel to another world; the highlight is stale across the jump, so drop it
    useInteractionStore.getState().clearFocus()
    useInteractionStore.getState().setNearest(null)
    useJourneyStore.getState().goToStage(targetStage)
  },
}
