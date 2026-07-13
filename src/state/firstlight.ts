// src/state/firstlight.ts — device-local First-Light UI state: whether the
// one-time re-entry prompt has been offered to a skipper. Its OWN storage key
// (like the journey position and the founder name) — never inside
// founders-quest:v3, never serialized or exported. The audit's per-shrine
// ravenReentryState was deferred (F11 cheap v1); this single flag is all v1 needs.

import { create } from 'zustand'
import { makeStore } from '../core/store'

export const FIRSTLIGHT_STORAGE_KEY = 'founders-quest:firstlight'

const store = makeStore()

function loadPromptSeen(): boolean {
  return store.get(FIRSTLIGHT_STORAGE_KEY) === 'prompted'
}

export interface FirstLightUiState {
  /** the skipper's one-time "want it now?" prompt has been offered (once, ever) */
  reentryPromptSeen: boolean
  markReentryPromptSeen(): void
}

export const useFirstLightUiStore = create<FirstLightUiState>((set) => ({
  reentryPromptSeen: loadPromptSeen(),
  markReentryPromptSeen(): void {
    store.set(FIRSTLIGHT_STORAGE_KEY, 'prompted')
    set({ reentryPromptSeen: true })
  },
}))
