// src/game/materials.ts — the shared cel-shaded toon look. Every surface in the
// world reads MeshToonMaterial against ONE small stepped gradient ramp generated
// here as a DataTexture (no external files — egress is blocked). The palette is
// the art-direction register: deep indigo/violet space, warm amber/gold light
// and accents, teal-cyan rune glow, desaturated warm stone for ground/props.
// Pure data + three; no React, no store, no network.

import { DataTexture, NearestFilter, RedFormat } from 'three'

/** Named palette — every component pulls its colours from here so the world
 * reads as one painted scene (Ghibli-adjacent, NOT neon). */
export const PALETTE = {
  /** deep-space background behind the sky dome */
  space: '#0b0817',
  /** atmospheric fog near the horizon — a deep indigo, not a grey */
  fog: '#241a45',
  /** sky gradient: violet zenith → indigo horizon */
  skyZenith: '#241a52',
  skyHorizon: '#120d2c',
  /** warm golden-hour glow banked low in the sky */
  skyGlow: '#6b3f6e',
  /** the drifting aurora band */
  aurora: '#2f8f86',
  /** rune / crystal glow */
  teal: '#3fe0d8',
  tealDeep: '#1c8f89',
  /** amber/gold light + seal + UI accents */
  amber: '#e8b34b',
  amberBright: '#ffcf6a',
  /** lights */
  keyWarm: '#ffe2b0',
  fillCool: '#7c78e0',
  rimCool: '#8ea6ff',
  /** stone / props — desaturated warm */
  stone: '#5f574a',
  stoneWarm: '#847258',
  stoneCool: '#453f5e',
  /** violet monument body + faint rune-idle glow */
  violet: '#6f5cf0',
  violetDeep: '#2f2760',
  /** grass tufts */
  grass: '#5d6b4a',
  grassCool: '#43614f',
  /** the riskiest guardian's warning ember */
  ember: '#ff7a3c',
  emberDeep: '#d9484f',
  /** cloaked figures (player / shadow) */
  cloak: '#4a4372',
  cloakDeep: '#2a2547',
  scarf: '#e08a4b',
} as const

/**
 * Build a stepped grayscale ramp as a DataTexture — the cel gradient map every
 * MeshToonMaterial samples to quantise its diffuse into flat bands. Weighted so
 * the lit band dominates (painted, not a harsh two-tone). NearestFilter + no
 * mipmaps is required for a gradient map to read as discrete steps.
 */
export function makeToonRamp(steps: number): DataTexture {
  const size = Math.max(2, steps)
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) {
    const t = i / (size - 1)
    // a gentle gamma lifts the mid bands so shadows stay soft, not crushed
    data[i] = Math.round(Math.pow(t, 0.8) * 255)
  }
  const ramp = new DataTexture(data, size, 1, RedFormat)
  ramp.minFilter = NearestFilter
  ramp.magFilter = NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}

/** The shared 4-step ramp — one texture for the whole scene (draw-call friendly). */
export const TOON_RAMP = makeToonRamp(4)
/** A softer 3-step ramp for large surfaces (ground, distant rock) — fewer, wider bands. */
export const TOON_RAMP_SOFT = makeToonRamp(3)
