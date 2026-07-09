// src/game/perf.ts — render-cost adaptation by device capability.
//
// THREE TIERS, because "one desktop-grade render path for everyone" is exactly
// what crashed a phone (Gate-2b field report): a mobile GPU asked to run Bloom
// + MSAA + dpr 1.5 loses its WebGL context, and an unrecovered context loss
// trips the app error boundary ("the world failed to hold together").
//
//   full        — a real desktop GPU: the whole effect stack, dpr up to 1.5.
//   constrained — phones / low-memory / coarse-pointer / few-core machines:
//                 no post-processing, cheap sky shader, fewer stars, dpr 1,
//                 no MSAA. Still cel-shaded and readable — just survivable.
//   automation  — Playwright / CI headless software-GL: cheapest of all, dpr
//                 0.75, so input timing stays deterministic (SwiftShader is CPU).
//
// A `?render=full|constrained|automation` query override forces a tier so e2e
// can exercise EVERY shipping path (the old webdriver-only gate meant tests
// never ran the effect stack real users get — the blind spot that shipped the
// crash). This module changes only how many pixels get shaded: no mechanic, no
// store write, no string, no data shape, no test id.

export type RenderTier = 'automation' | 'constrained' | 'full'

function readOverride(): RenderTier | null {
  if (typeof location === 'undefined') return null
  const q = new URLSearchParams(location.search).get('render')
  return q === 'full' || q === 'constrained' || q === 'automation' ? q : null
}

function detectTier(): RenderTier {
  const override = readOverride()
  if (override !== null) return override
  if (typeof navigator === 'undefined') return 'full'
  // Playwright / CI headless: deterministic cheapest path.
  if (navigator.webdriver === true) return 'automation'

  // Coarse primary pointer is the strongest "this is a phone/tablet" signal;
  // deviceMemory / hardwareConcurrency catch low-end machines. Absent signals
  // (desktop Safari/Firefox) fall through to full. We ERR TOWARD constrained —
  // a slightly plainer world that runs beats a pretty one that dies.
  const coarse =
    typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches === true
  const touch = (navigator.maxTouchPoints ?? 0) > 0
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency
  if (coarse || touch) return 'constrained'
  if (typeof mem === 'number' && mem <= 4) return 'constrained'
  if (typeof cores === 'number' && cores <= 4) return 'constrained'
  return 'full'
}

export const RENDER_TIER: RenderTier = detectTier()

// DEV/test hook: lets the e2e assert that a mobile context auto-routes to the
// 'constrained' tier and a desktop context to 'full' — the root-cause logic
// the Gate-2b crash exposed. Stripped from production builds.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __fq_tier?: RenderTier }).__fq_tier = RENDER_TIER
}

/** Full effect stack (Bloom/Vignette, accent point-lights, rich sky, MSAA)
 * ships ONLY on the full tier. Constrained and automation get the cheap path. */
export const FULL_POWER: boolean = RENDER_TIER === 'full'

/** Kept name for existing call sites: true whenever we take the cheap path
 * (cheap sky shader, fewer stars, static aurora, no composer, no accent lights). */
export const LOW_POWER: boolean = !FULL_POWER

/** device-pixel-ratio budget per tier: crisp but bounded on phones, tiny under
 * the software rasteriser so input timing stays deterministic. */
export const WORLD_DPR: number | [number, number] =
  RENDER_TIER === 'full' ? [1, 1.5] : RENDER_TIER === 'constrained' ? 1 : 0.75
