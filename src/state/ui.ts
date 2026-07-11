// src/state/ui.ts — ephemeral UI state. NOT persisted, ever: no storage import
// exists in this module (guard-tested), nothing here touches founders-quest:v3.
// Drafts, camera, and physics state live elsewhere; this is just which surface
// has the player's attention plus the stubbed Shadow's presentation state.
//
// No player-facing copy here: `shadow.quote` is the founder's OWN local journal
// text and `shadow.action` is a strings-module label — both chosen by the caller.

import { create } from 'zustand'
import type { ActGateId } from '../core/metrics'

export type PanelMode =
  | 'panel:vault'
  | 'panel:registry'
  | 'panel:campfire'
  | 'panel:calibration'
  | 'panel:chart'
  | 'panel:legend'
// 'gate' = an Act-Gate threshold; 'loop' = a named loop's toll-portal. Both are
// modal (mode !== 'roam' freezes the world), and both carry a payload below.
export type UiMode = 'roam' | 'trance' | 'gate' | 'loop' | 'reentry' | PanelMode

export interface ShadowState {
  visible: boolean
  /** the founder's own words, quoted back — drawn locally, zero network */
  quote: string
  /** exactly one low-friction next action (label from src/strings) */
  action: string
}

/** The Act Gate being crossed, and where it leads once resolved. */
export interface PendingGate {
  gateId: ActGateId
  targetStage: number
}

/** The named loop's toll-portal being taken, and its origin/destination worlds. */
export interface PendingLoop {
  name: string
  fromStage: number
  toStage: number
}

export interface UiState {
  mode: UiMode
  /** the question being answered while mode === 'trance', else null */
  activeQid: string | null
  /** the Act Gate to resolve while mode === 'gate', else null */
  pendingGate: PendingGate | null
  /** the loop toll to pay while mode === 'loop', else null */
  pendingLoop: PendingLoop | null
  shadow: ShadowState
  setMode(mode: UiMode): void
  /** kneel: freeze the world, open the writing panel for `qid` */
  enterTrance(qid: string): void
  /** stand up (Esc): back to roam; the draft is the component's to keep or drop */
  exitTrance(): void
  openPanel(panel: PanelMode): void
  closePanel(): void
  /** open the Act-Gate threshold before an act-boundary crossing */
  openGate(gate: PendingGate): void
  /** close the gate (resolved or cancelled) — back to roam */
  closeGate(): void
  /** open a named loop's toll-portal before looping back */
  openLoop(loop: PendingLoop): void
  /** close the loop toll (paid or cancelled) — back to roam */
  closeLoop(): void
  /** the one-time First-Light re-entry prompt intercepting a skipper's first kneel */
  pendingReentryQid: string | null
  openReentry(qid: string): void
  closeReentry(): void
  summonShadow(quote: string, action: string): void
  dismissShadow(): void
}

const SHADOW_HIDDEN: ShadowState = { visible: false, quote: '', action: '' }

export const useUiStore = create<UiState>()((set) => ({
  mode: 'roam',
  activeQid: null,
  pendingGate: null,
  pendingLoop: null,
  shadow: SHADOW_HIDDEN,

  setMode(mode: UiMode): void {
    set({ mode })
  },

  enterTrance(qid: string): void {
    set({ mode: 'trance', activeQid: qid })
  },

  exitTrance(): void {
    set({ mode: 'roam', activeQid: null })
  },

  openPanel(panel: PanelMode): void {
    set({ mode: panel })
  },

  closePanel(): void {
    set({ mode: 'roam' })
  },

  openGate(gate: PendingGate): void {
    set({ mode: 'gate', pendingGate: gate })
  },

  closeGate(): void {
    set({ mode: 'roam', pendingGate: null })
  },

  openLoop(loop: PendingLoop): void {
    set({ mode: 'loop', pendingLoop: loop })
  },

  closeLoop(): void {
    set({ mode: 'roam', pendingLoop: null })
  },

  pendingReentryQid: null,

  openReentry(qid: string): void {
    set({ mode: 'reentry', pendingReentryQid: qid })
  },

  closeReentry(): void {
    set({ mode: 'roam', pendingReentryQid: null })
  },

  summonShadow(quote: string, action: string): void {
    set({ shadow: { visible: true, quote, action } })
  },

  dismissShadow(): void {
    set({ shadow: SHADOW_HIDDEN })
  },
}))
