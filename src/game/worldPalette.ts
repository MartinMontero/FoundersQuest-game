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
  /** multiply tint over the shared ground texture — each world's earth (E-1..E-8) */
  ground: string
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
  // the original shrine rune glow — keeps World 1's sky byte-unchanged (A5)
  accent: PALETTE.teal,
  // §5 W1 is indigo/violet — the audit flagged the shared tan earth; the sky
  // stays byte-pinned, the EARTH now takes the nebula's cast (E-1)
  ground: '#a596c8',
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
    ground: '#7d8a96',
    accent: '#7f93ab',
  },
  3: {
    zenith: '#3a1420',
    horizon: '#1a0a0c',
    glow: '#e2632a',
    aurora: '#c9852f',
    fog: '#38181a',
    background: '#100608',
    ground: '#b08a72',
    accent: '#ff7a3c',
  },
  4: {
    zenith: '#10322f',
    horizon: '#061412',
    glow: '#6f9e8a',
    aurora: '#2f7a6a',
    fog: '#123028',
    background: '#04100e',
    ground: '#7f9490',
    accent: '#57c2a6',
  },
  5: {
    zenith: '#52606f',
    horizon: '#c2ccd6',
    glow: '#eaf0f5',
    aurora: '#9fc4d0',
    fog: '#6a7684',
    background: '#2a333d',
    ground: '#a9adb8',
    accent: '#cfe0ea',
  },
  6: {
    zenith: '#3a2418',
    horizon: '#170d08',
    glow: '#c67a45',
    aurora: '#a86a3a',
    fog: '#2e1e14',
    background: '#0e0805',
    ground: '#cfc4b0',
    accent: '#d98f52',
  },
  7: {
    zenith: '#2a3a5c',
    horizon: '#d99a5c',
    glow: '#f2c079',
    aurora: '#e0a0a0',
    fog: '#3a3a48',
    background: '#12141f',
    ground: '#c2ab8e',
    accent: '#f2c079',
  },
  8: {
    zenith: '#1e5a8c',
    horizon: '#bfe0ee',
    glow: '#fff0c0',
    aurora: '#6fc0d8',
    fog: '#4a6a80',
    background: '#0a2030',
    ground: '#b9a5a0',
    accent: '#7fd0e8',
  },
}

/** The sky identity for a world (falls back to World 1's nebula). */
export function skyForStage(stage: number): WorldSky {
  return WORLD_SKIES[stage] ?? W1
}

// ---- weather → sky tint (E-0; SITREP backlog item, now in scope) ----
// The founder's logged weather colours the world's AIR: low readings mute and
// grey the sky toward overcast; high readings warm it. Display only — the
// same last-≤3-by-date window the trough reads, but this NEVER feeds any
// metric or mechanic (the trough's mechanics stay in core/metrics.ts).

interface WeatherLike {
  date: string
  value: 1 | 2 | 3 | 4 | 5
}

/** mean of the last ≤3 readings by date (display twin of the trough window) */
export function weatherMean(weather: readonly WeatherLike[]): number | null {
  if (weather.length === 0) return null
  const chronological = [...weather].sort((x, y) =>
    x.date < y.date ? -1 : x.date > y.date ? 1 : 0,
  )
  const window = chronological.slice(-3)
  let sum = 0
  for (const w of window) sum += w.value
  return sum / window.length
}

function channel(hex: string, i: number): number {
  return parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
}

/** linear blend of two #rrggbb colours, t in [0,1] */
export function hexLerp(a: string, b: string, t: number): string {
  const mix = (i: number): string =>
    Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${mix(0)}${mix(1)}${mix(2)}`
}

/** overcast grey the low skies lean toward · warm light the high skies lean toward */
const OVERCAST = '#3b4148'
const CLEARLIGHT = '#ffe9c4'
/** tint strength at the extremes (mean 1 or 5); 3 = neutral, untinted */
const TINT_MAX = 0.28

/**
 * Tint a world's sky by the founder's weather. mean 3 (or no readings) returns
 * the sky UNCHANGED (reference-equal — W1's byte-pinned identity survives).
 * Low means blend background/fog/horizon toward overcast; high means toward
 * warm light. Zenith/glow/aurora/accent stay — the world keeps its identity.
 */
export function tintSky(sky: WorldSky, mean: number | null): WorldSky {
  if (mean === null || mean === 3) return sky
  const toward = mean < 3 ? OVERCAST : CLEARLIGHT
  const t = (Math.abs(mean - 3) / 2) * TINT_MAX
  return {
    ...sky,
    background: hexLerp(sky.background, toward, t),
    fog: hexLerp(sky.fog, toward, t),
    horizon: hexLerp(sky.horizon, toward, t),
    ground: hexLerp(sky.ground, toward, t * 0.6),
  }
}
