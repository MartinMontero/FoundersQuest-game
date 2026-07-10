// src/game/materials.ts — the shared cel-shaded toon look. Every surface in the
// world reads MeshToonMaterial against ONE small stepped gradient ramp generated
// here as a DataTexture (no external files — egress is blocked). The palette is
// the art-direction register: deep indigo/violet space, warm amber/gold light
// and accents, teal-cyan rune glow, desaturated warm stone for ground/props.
// Pure data + three; no React, no store, no network.

import { DataTexture, LinearFilter, NearestFilter, RGBAFormat, RedFormat } from 'three'

/** Named palette — every component pulls its colours from here so the world
 * reads as one painted scene (warm N64-era low-poly, NOT cold neon). World 1 is
 * violet/indigo THEME warmed with gold dust and teal rune accents. */
export const PALETTE = {
  /** deep-space background behind the sky dome */
  space: '#0c0817',
  /** atmospheric fog banked into the distance — a WARM indigo haze, the OoT
   * "air": distance softens to warmth so the cool world reads inviting */
  fog: '#352247',
  /** sky gradient: violet zenith → indigo horizon */
  skyZenith: '#281a52',
  skyHorizon: '#160f2e',
  /** golden-hour glow banked low in the sky — warm rose-gold, not muddy purple */
  skyGlow: '#bd7a55',
  /** the drifting aurora band (teal rune accent) */
  aurora: '#2f8f86',
  /** rune / crystal glow */
  teal: '#3fe0d8',
  tealDeep: '#1c8f89',
  /** the incandescent core inside a crystal / rune — near-white, catches bloom */
  crystalCore: '#eafffb',
  /** the distant sun banked low in the nebula — the god-ray source */
  sun: '#ffdca0',
  sunCore: '#fff2d4',
  /** floating-island grass caps: cool moss warmed at the lit edge */
  moss: '#4c6a4e',
  mossWarm: '#6f7e46',
  /** amber/gold light + seal + UI accents */
  amber: '#e8b34b',
  amberBright: '#ffcf6a',
  /** lights */
  keyWarm: '#ffe0a6',
  fillCool: '#8079db',
  rimCool: '#8ea6ff',
  /** a low warm back-rim so the cool Nebula still reads inviting (pillar 1) */
  rimWarm: '#ffb877',
  /** warm-dark hemisphere ground bounce (upward faces catch earth warmth) */
  groundBounce: '#2b1d26',
  /** drifting gold-dust motes — little warm points of light that draw the eye */
  dust: '#ffcf8a',
  /** stone / props — desaturated WARM */
  stone: '#655a4c',
  stoneWarm: '#8c7659',
  stoneCool: '#463f5c',
  /** the sun-warmed gold on the brightest ground patches */
  goldAccent: '#e9b86a',
  /** violet monument body + faint rune-idle glow */
  violet: '#6f5cf0',
  violetDeep: '#2f2760',
  /** grass tufts */
  grass: '#61704c',
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
 * MeshToonMaterial samples to quantise its diffuse into flat bands. A raised
 * `floor` keeps the darkest band lit (soft, warm shadows — the painted OoT
 * look, never crushed to cold black) while a gentle gamma lifts the mids so the
 * lit band dominates. NearestFilter + no mipmaps keeps the steps discrete.
 */
export function makeToonRamp(steps: number, floor = 0): DataTexture {
  const size = Math.max(2, steps)
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) {
    const t = i / (size - 1)
    const v = floor + (1 - floor) * Math.pow(t, 0.85)
    data[i] = Math.round(v * 255)
  }
  const ramp = new DataTexture(data, size, 1, RedFormat)
  ramp.minFilter = NearestFilter
  ramp.magFilter = NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}

/**
 * A soft round point sprite: white core fading to transparent, built as an
 * RGBA DataTexture (no canvas — works headless in CI). Stars and gold-dust map
 * this so they read as luminous points, NEVER the hard pixel squares a bare
 * `pointsMaterial` draws (the single loudest "MS-Paint" tell in the old sky).
 * `core` tightens the bright centre; the halo falls off smoothly for bloom.
 */
export function makeSoftSprite(size = 64, core = 2.4): DataTexture {
  const data = new Uint8Array(size * size * 4)
  const c = (size - 1) / 2
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - c) / c
      const dy = (y - c) / c
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy))
      const a = Math.pow(1 - d, core)
      const i = (y * size + x) * 4
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.round(a * 255)
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat)
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.needsUpdate = true
  return tex
}

/** The shared 4-step ramp — one texture for the whole scene (draw-call friendly).
 * Floor 0.32: shadows stay warm and readable, not a hard two-tone. */
export const TOON_RAMP = makeToonRamp(4, 0.32)
/** A softer 3-step ramp for large surfaces (ground, distant rock) — fewer, wider,
 * flatter-lit bands (floor 0.42) so the painted plateau reads even and warm. */
export const TOON_RAMP_SOFT = makeToonRamp(3, 0.42)
