// src/state/ui.ts — ephemeral UI state. NOT persisted, ever: no storage import
// exists in this module (guard-tested), nothing here touches founders-quest:v3.
// Drafts, camera, and physics state live elsewhere; this is just which surface
// has the player's attention plus the stubbed Shadow's presentation state.
//
// No player-facing copy here: `shadow.quote` is the founder's OWN local journal
// text and `shadow.action` is a strings-module label — both chosen by the caller.

import { create } from 'zustand'

export type PanelMode = 'panel:vault' | 'panel:registry'
export type UiMode = 'roam' | 'trance' | PanelMode

export interface ShadowState {
  visible: boolean
  /** the founder's own words, quoted back — drawn locally, zero network */
  quote: string
  /** exactly one low-friction next action (label from src/strings) */
  action: string
}

export interface UiState {
  mode: UiMode
  /** the question being answered while mode === 'trance', else null */
  activeQid: string | null
  shadow: ShadowState
  setMode(mode: UiMode): void
  /** kneel: freeze the world, open the writing panel for `qid` */
  enterTrance(qid: string): void
  /** stand up (Esc): back to roam; the draft is the component's to keep or drop */
  exitTrance(): void
  openPanel(panel: PanelMode): void
  closePanel(): void
  summonShadow(quote: string, action: string): void
  dismissShadow(): void
}

const SHADOW_HIDDEN: ShadowState = { visible: false, quote: '', action: '' }

export const useUiStore = create<UiState>()((set) => ({
  mode: 'roam',
  activeQid: null,
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

  summonShadow(quote: string, action: string): void {
    set({ shadow: { visible: true, quote, action } })
  },

  dismissShadow(): void {
    set({ shadow: SHADOW_HIDDEN })
  },
}))
