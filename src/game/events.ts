// src/game/events.ts — the default WorldEvents wiring: world gestures land in
// the two stores (ui for surfaces, quest for the one write the world gesture
// IS — the flagpole self-report, Action only, per game-design §4).
// The UI layer may pass its own WorldEvents into <GameRoot events={...}/> and
// override any of these.

import { useFirstLightUiStore } from '../state/firstlight'
import { useJourneyStore } from '../state/journey'
import { questStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { ACT_GATES } from '../strings'
import { useInteractionStore } from './interaction'
import type { WorldEvents } from './contracts'

export const defaultWorldEvents: WorldEvents = {
  onShrineEnter(qid: string): void {
    // a skipper's FIRST kneel gets the one-time First-Light offer (once, ever;
    // declining proceeds straight into the trance and never asks again)
    const { openingSkippedAt, openingCompletedAt } = questStore.getState().data
    const fl = useFirstLightUiStore.getState()
    if (openingSkippedAt !== null && openingCompletedAt === null && !fl.reentryPromptSeen) {
      useUiStore.getState().openReentry(qid)
      return
    }
    useUiStore.getState().enterTrance(qid)
  },
  onVaultApproach(): void {
    useUiStore.getState().openPanel('panel:vault')
  },
  onRegistryApproach(): void {
    useUiStore.getState().openPanel('panel:registry')
  },
  onCampfire(): void {
    useUiStore.getState().openPanel('panel:campfire')
  },
  onFlagpole(id: string): void {
    // self-report: milestones[id] flips — Action only, never Truth (02/04 map)
    questStore.getState().toggleMilestone(id)
  },
  onPortal(targetStage: number): void {
    const journey = useJourneyStore.getState()
    const from = journey.currentStage
    // the highlight is stale across any world transition, so drop it either way
    useInteractionStore.getState().clearFocus()
    useInteractionStore.getState().setNearest(null)
    // an onward crossing of an act boundary meets its Act Gate first — once, until
    // the gate is recorded (passed or overridden); after that, onward is direct.
    const gate = ACT_GATES.find((g) => g.afterStage === from && targetStage === from + 1)
    if (gate !== undefined && questStore.getState().data.gates[gate.id] === undefined) {
      useUiStore.getState().openGate({ gateId: gate.id, targetStage })
      return
    }
    journey.goToStage(targetStage)
  },
  onLoop(name: string, toStage: number): void {
    // a named loop demands one learning line before it lets you back (03) — open
    // the toll; the LoopPanel records the learning to the trail and then travels
    const journey = useJourneyStore.getState()
    useInteractionStore.getState().clearFocus()
    useInteractionStore.getState().setNearest(null)
    useUiStore.getState().openLoop({ name, fromStage: journey.currentStage, toStage })
  },
}
