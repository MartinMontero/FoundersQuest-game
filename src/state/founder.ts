// src/state/founder.ts — the founder's chosen name, a device-local preference.
// Stored in the settings ladder under `founders-quest:settings` (its OWN key —
// never inside founders-quest:v3, so no serializer/Council path can reach it;
// never sent anywhere). A thin zustand store so the HUD + naming card re-render
// on change; the raw '' means "unnamed" (the naming card shows, the HUD shows
// the canon default). Empty submissions adopt the default so the card never nags.

import { create } from 'zustand'
import { makeStore } from '../core/store'
import { createSettings } from '../settings'
import { UI } from '../strings'

/** A sensible cap so a name stays a name (and the HUD never overflows). */
export const FOUNDER_NAME_MAX = 24

const settings = createSettings(makeStore())

/** The stored name, or the canon default when unset ('' → 'founder'). */
export function founderDisplayName(name: string): string {
  return name.trim() === '' ? UI.founder.defaultName : name.trim()
}

/** Normalise raw input: collapse whitespace, trim, clamp — empty stays empty. */
export function normaliseFounderName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, FOUNDER_NAME_MAX)
}

export interface FounderState {
  /** the persisted name; '' = unnamed (naming card shows, HUD falls back) */
  name: string
  /** transient (NEVER persisted): the naming card was re-opened from the HUD to
   *  rename an already-named founder. Distinct from first-run naming, which is
   *  derived (unnamed + untouched quest) and needs no flag. */
  renaming: boolean
  /** set the name; an empty/whitespace choice adopts the default so it persists
   *  as "named" and the first-run card does not reappear */
  setName(raw: string): void
  /** re-open the naming card to rename (invoked by the HUD name) */
  openRename(): void
  /** close the rename card, leaving the name unchanged */
  closeRename(): void
}

export const useFounderStore = create<FounderState>((set) => ({
  name: settings.getFounderName(),
  renaming: false,
  setName(raw: string): void {
    const cleaned = normaliseFounderName(raw)
    const name = cleaned === '' ? UI.founder.defaultName : cleaned
    settings.setFounderName(name)
    set({ name })
  },
  openRename(): void {
    set({ renaming: true })
  },
  closeRename(): void {
    set({ renaming: false })
  },
}))
