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
  /** set the name; an empty/whitespace choice adopts the default so it persists
   *  as "named" and the first-run card does not reappear */
  setName(raw: string): void
}

export const useFounderStore = create<FounderState>((set) => ({
  name: settings.getFounderName(),
  setName(raw: string): void {
    const cleaned = normaliseFounderName(raw)
    const name = cleaned === '' ? UI.founder.defaultName : cleaned
    settings.setFounderName(name)
    set({ name })
  },
}))
