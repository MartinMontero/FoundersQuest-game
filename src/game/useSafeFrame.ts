// src/game/useSafeFrame.ts — useFrame that never lets a single per-frame throw
// bring down the whole world. A driver hiccup, a transient NaN in a lerp, a GL
// call on a momentarily-lost context — caught, recorded once (diag.ts), and the
// loop keeps running. An unhandled throw in the rAF loop is exactly what took
// the world down on real mobile hardware (Gate-2b field report); this converts
// that into, at worst, one frozen subsystem instead of a dead app.

import { useFrame, type RenderCallback } from '@react-three/fiber'
import { recordError } from './diag'

export function useSafeFrame(callback: RenderCallback, renderPriority?: number): void {
  useFrame((state, delta, frame) => {
    try {
      callback(state, delta, frame)
    } catch (e) {
      recordError(e)
    }
  }, renderPriority)
}
