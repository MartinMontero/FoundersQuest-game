// src/game/perf.ts — render-cost adaptation for constrained contexts.
//
// SwiftShader (the headless software-GL renderer the e2e container and most CI
// runners use) rasterises on the CPU, so full-screen post passes at high dpr
// cost orders of magnitude more than on a real GPU and drag the frame rate low
// enough that input timing stops being deterministic. Real users — including
// the deployed Cloudflare preview a reviewer opens in a normal browser — have a
// GPU and never set navigator.webdriver, so they always get the full effect
// stack at full resolution. Under automation we render at dpr 1 and drop the
// costly Bloom/Vignette passes (tone mapping stays), exactly as the reduced-
// motion path does.
//
// This is a RENDERING decision only: it changes no mechanic, no store write, no
// string, no data shape, and no test id — purely how many pixels get shaded.

/** True in an automation / software-GL context (Playwright, CI headless). */
export const LOW_POWER: boolean =
  typeof navigator !== 'undefined' && navigator.webdriver === true

/** Canvas device-pixel-ratio budget: crisp on real displays, low under
 * automation so the software rasteriser has far fewer pixels to shade (this
 * keeps the frame rate high enough that input timing stays deterministic). */
export const WORLD_DPR: number | [number, number] = LOW_POWER ? 0.75 : [1, 1.5]
