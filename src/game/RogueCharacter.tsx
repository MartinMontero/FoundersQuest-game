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
import { type Group, type Object3D, Vector3 } from 'three'
import { PALETTE } from './materials'
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
  const staff = useRef<Group>(null)
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

  // The staff is a WORLD-SCALE child of the character group (so its size is
  // predictable — reparenting into the hand bone made it tiny, that bone carries
  // the rig's baked scale). Instead we cache the right-hand weapon bone and, each
  // frame, move the staff to the hand's world position (expressed in the group's
  // local frame). It stays upright — a walking staff gripped in the right hand.
  const handBone = useRef<Object3D | null>(null)
  useEffect(() => {
    // GLTFLoader strips the '.' from bone names, so `handslot.r` → `handslotr`.
    handBone.current =
      scene.getObjectByName('handslotr') ?? scene.getObjectByName('handr') ?? null
  }, [scene])
  useSafeFrame(() => {
    const s = staff.current
    const hand = handBone.current
    const g = group.current
    if (s === null || hand === null || g === null) return
    hand.getWorldPosition(HAND_WORLD)
    g.worldToLocal(HAND_WORLD)
    s.position.copy(HAND_WORLD)
  })

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
      {/* the founder's staff — a world-scale group whose position tracks the
          right hand each frame (effect above). The grip sits near the hand; the
          shaft rises and a glowing crystal shard crowns it (Bloom catches it) —
          the mystical-founder read the operator asked to keep. Held vertical. */}
      <group ref={staff} rotation={[0.12, 0, 0.06]}>
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.038, 1.7, 6]} />
          <meshStandardMaterial color="#6b5236" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.44, 0]}>
          <torusGeometry args={[0.05, 0.018, 6, 12]} />
          <meshStandardMaterial color={PALETTE.amber} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial
            color={PALETTE.crystalCore}
            emissive={PALETTE.teal}
            emissiveIntensity={1.8}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.3} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 1.6, 0]} color={PALETTE.teal} intensity={0.5} distance={3} decay={2} />
      </group>
    </group>
  )
}

/** scratch for the per-frame hand→group-local staff placement (no allocation) */
const HAND_WORLD = new Vector3()
