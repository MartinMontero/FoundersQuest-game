// src/game/PostFx.tsx — the post pass (game-design §8 budget: cheap enough to
// stay smooth on integrated GPUs). The FULL tier runs a cinematic chain — God
// Rays streaming off the sun disc, selective Bloom on the rune/crystal glow, a
// gentle warm colour grade, edge-smoothing SMAA, a soft Vignette, and ACES
// ToneMapping as the final curve. This is the "cheap→cinematic" lever the
// premium-UI research ranked highest after real geometry: it lifts the whole
// frame with zero new art. The Canvas renders NoToneMapping so the ToneMapping
// effect owns the final curve (never double-mapped).
//
// Under prefers-reduced-motion the moving/temporal effects are OFF (no bloom
// shimmer, no god-ray flicker, no darkening pulse) — tone mapping only.
//
// Under low power (automation / software-GL, see perf.ts) the composer is
// dropped entirely; the renderer does cheap in-shader ACES tone mapping instead
// (World sets gl.toneMapping accordingly), so there are zero full-screen passes.

import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  GodRays,
  HueSaturation,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import type { Mesh } from 'three'

export interface PostFxProps {
  reduced: boolean
  /** automation / software-GL: drop the composer entirely (see perf.ts) */
  lowPower: boolean
  /** the sun disc God Rays stream from; null until the sky mounts it */
  sun: Mesh | null
}

export function PostFx({ reduced, lowPower, sun }: PostFxProps): JSX.Element | null {
  if (lowPower) return null
  if (reduced) {
    // reduced motion: a still, evenly graded image — no bloom, no god rays
    return (
      <EffectComposer multisampling={0}>
        <SMAA />
        <HueSaturation hue={0} saturation={0.12} />
        <BrightnessContrast brightness={0.0} contrast={0.08} />
        <Vignette offset={0.28} darkness={0.46} eskil={false} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      {sun !== null ? (
        <GodRays
          sun={sun}
          blendFunction={BlendFunction.SCREEN}
          samples={60}
          density={0.95}
          decay={0.92}
          weight={0.32}
          exposure={0.34}
          clampMax={1}
          blur
        />
      ) : (
        <></>
      )}
      <Bloom
        mipmapBlur
        intensity={1.05}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.32}
        radius={0.85}
      />
      {/* a gentle warm grade: a touch more saturation and contrast so the
          painted world reads rich, never muddy or flat */}
      <HueSaturation hue={0} saturation={0.16} />
      <BrightnessContrast brightness={0.01} contrast={0.11} />
      <Vignette offset={0.26} darkness={0.5} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
