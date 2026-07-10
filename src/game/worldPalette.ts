// src/game/worldPalette.ts — per-world sky identity (LOOP cycle 4, A5). Each of
// the 8 canon worlds gets a distinct sky gradient, golden-hour glow, aurora,
// fog, and background so it reads as its own place — grey-box+, reusing the
// World-1 pipeline (the SkyDome shader + fog), NOT eight bespoke photoreal
// scenes. World 1 is pinned to the exact current PALETTE values, so it is
// byte-for-byte unchanged. `accent` is each world's signature colour (its
// set-piece / rune tint). Pure data — no React, no store, no network.

import { PALETTE } from './materials'

export interface WorldSky {
  /** sky gradient top */
  zenith: string
  /** sky gradient at the horizon */
  horizon: string
  /** the warm golden-hour band banked low */
  glow: string
  /** the drifting aurora band */
  aurora: string
  /** distance fog — the world's "air" */
  fog: string
  /** the clear-colour behind the sky dome */
  background: string
  /** signature accent — the world's set-piece / rune tint */
  accent: string
}

// World 1 — the Swirling Nebula (violet/indigo). Pinned to PALETTE so W1 is
// visually identical to the shipped slice (A5: World 1 unchanged).
const W1: WorldSky = {
  zenith: PALETTE.skyZenith,
  horizon: PALETTE.skyHorizon,
  glow: PALETTE.skyGlow,
  aurora: PALETTE.aurora,
  fog: PALETTE.fog,
  background: PALETTE.space,
  // the original shrine rune glow — keeps World 1 byte-unchanged (A5)
  accent: PALETTE.teal,
}

/**
 * The eight skies, keyed by stage (03 world moods):
 * 2 Raven — cold corvid dusk · 3 Phoenix — forge ember · 4 Labyrinth — cold
 * stone-teal unease · 5 Mirror — pale silver clarity · 6 Sculptor — warm clay
 * ordeal · 7 Bridge — hopeful dawn · 8 Rocket — bright launch.
 */
export const WORLD_SKIES: Readonly<Record<number, WorldSky>> = {
  1: W1,
  2: {
    zenith: '#1c2a3f',
    horizon: '#0b1018',
    glow: '#6b7a8f',
    aurora: '#3a5a72',
    fog: '#1a2432',
    background: '#070b12',
    accent: '#7f93ab',
  },
  3: {
    zenith: '#3a1420',
    horizon: '#1a0a0c',
    glow: '#e2632a',
    aurora: '#c9852f',
    fog: '#38181a',
    background: '#100608',
    accent: '#ff7a3c',
  },
  4: {
    zenith: '#10322f',
    horizon: '#061412',
    glow: '#6f9e8a',
    aurora: '#2f7a6a',
    fog: '#123028',
    background: '#04100e',
    accent: '#57c2a6',
  },
  5: {
    zenith: '#52606f',
    horizon: '#c2ccd6',
    glow: '#eaf0f5',
    aurora: '#9fc4d0',
    fog: '#6a7684',
    background: '#2a333d',
    accent: '#cfe0ea',
  },
  6: {
    zenith: '#3a2418',
    horizon: '#170d08',
    glow: '#c67a45',
    aurora: '#a86a3a',
    fog: '#2e1e14',
    background: '#0e0805',
    accent: '#d98f52',
  },
  7: {
    zenith: '#2a3a5c',
    horizon: '#d99a5c',
    glow: '#f2c079',
    aurora: '#e0a0a0',
    fog: '#3a3a48',
    background: '#12141f',
    accent: '#f2c079',
  },
  8: {
    zenith: '#1e5a8c',
    horizon: '#bfe0ee',
    glow: '#fff0c0',
    aurora: '#6fc0d8',
    fog: '#4a6a80',
    background: '#0a2030',
    accent: '#7fd0e8',
  },
}

/** The sky identity for a world (falls back to World 1's nebula). */
export function skyForStage(stage: number): WorldSky {
  return WORLD_SKIES[stage] ?? W1
}
