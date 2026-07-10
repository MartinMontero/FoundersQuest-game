// src/game/RogueCharacter.tsx — the player avatar: a real rigged, animated CC0
// glTF character (KayKit "Rogue_Hooded", CC0 — the hooded founder the canon
// calls for) replacing the hand-built primitive cloak. drei useGLTF/useAnimations
// load and drive it; the gait (idle / walk / run) is read from a ref each frame
// and crossfaded on transitions, so no React re-render happens per movement.
// Shadows and the HDR environment (World.tsx) light it as real geometry.
//
// This is the asset-driven pivot the premium-UI research demanded: authored
// geometry, not primitives polished with post-fx.

import { useEffect, useRef, type MutableRefObject } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import { useSafeFrame } from './useSafeFrame'

const MODEL_URL = '/models/rogue.glb'
useGLTF.preload(MODEL_URL)

export type Gait = 'idle' | 'walk' | 'run'

/** map the movement gait to a baked clip name in rogue.glb */
function clipFor(gait: Gait): string {
  switch (gait) {
    case 'run':
      return 'Running_A'
    case 'walk':
      return 'Walking_C'
    case 'idle':
      return 'Idle'
  }
}

export interface RogueCharacterProps {
  /** live gait, written by <Player/> in its physics frame (no re-render) */
  gait: MutableRefObject<Gait>
  /** prefers-reduced-motion: hold a calm idle, never the run/walk cycles */
  reduced: boolean
}

export function RogueCharacter({ gait, reduced }: RogueCharacterProps): JSX.Element {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, group)
  const active = useRef<string>('Idle')

  // real geometry casts and receives shadows so it sits IN the world, not on it
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean }
      if (mesh.isMesh === true) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [scene])

  // start on a calm idle
  useEffect(() => {
    const idle = actions['Idle']
    idle?.reset().fadeIn(0.3).play()
    active.current = 'Idle'
    return () => {
      idle?.fadeOut(0.2)
    }
  }, [actions])

  // crossfade to the current gait's clip only when it CHANGES (no per-frame work)
  useSafeFrame(() => {
    const want = reduced ? 'Idle' : clipFor(gait.current)
    if (want === active.current) return
    const prev = actions[active.current]
    const next = actions[want]
    prev?.fadeOut(0.2)
    next?.reset().fadeIn(0.2).play()
    active.current = want
  })

  // KayKit rigs stand ~1.75 u tall with feet at the origin and face +Z; drop it
  // so the feet meet the capsule's base, and it inherits heading from <Player/>.
  return (
    <group ref={group} position={[0, -0.92, 0]} rotation={[0, Math.PI, 0]} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}
