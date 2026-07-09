// src/game/PostFx.tsx — the post pass (game-design §8 budget: cheap enough to
// stay smooth on integrated GPUs). Soft selective Bloom (only emissive/rune
// pixels cross the luminance threshold), a warm Vignette, and ACES ToneMapping.
// Under prefers-reduced-motion every effect is OFF except tone mapping — no
// bloom shimmer, no darkening pulse. No SSAO/SSR (cost). One composer, no MSAA
// render target (software-GL friendly). The Canvas renders with NoToneMapping
// so the ToneMapping effect owns the final curve (never double-mapped).
//
// Under low power (automation / software-GL, see perf.ts) the composer is
// dropped entirely; the renderer does cheap in-shader ACES tone mapping instead
// (World sets gl.toneMapping accordingly), so there are zero full-screen passes.

import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export interface PostFxProps {
  reduced: boolean
  /** automation / software-GL: drop the composer entirely (see perf.ts) */
  lowPower: boolean
}

export function PostFx({ reduced, lowPower }: PostFxProps): JSX.Element | null {
  if (lowPower) return null
  if (reduced) {
    // reduced motion: tone mapping only — a still, even image
    return (
      <EffectComposer multisampling={0}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.95}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.3}
        radius={0.9}
      />
      <Vignette offset={0.3} darkness={0.5} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
