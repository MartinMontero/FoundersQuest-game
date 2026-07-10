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

/** KayKit weapon nodes to hide — the crossbows, the throwable, and the
 * right-hand knife (the staff occupies that hand). The left-hand `Knife_Offhand`
 * stays: the founder's one sword. */
const HIDDEN_EQUIPMENT = new Set(['Knife', '1H_Crossbow', '2H_Crossbow', 'Throwable'])

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

  // real geometry casts and receives shadows so it sits IN the world, not on it;
  // and hide the KayKit weapons the founder shouldn't carry — the model ships
  // with a knife + two crossbows + a throwable in the RIGHT hand (where the staff
  // goes) and a knife in the LEFT. We keep only the left-hand blade (the one
  // sword) so the founder holds a sword in one hand and the staff in the other.
  useEffect(() => {
    scene.traverse((o) => {
      if (HIDDEN_EQUIPMENT.has(o.name)) o.visible = false
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
  // frame, PLANT the staff on the ground (group-local y ≈ 0 is the feet/ground)
  // while it tracks the gripping hand in X/Z. That makes it a full-length walking
  // staff — its foot on the earth, its shaft rising past the hand to the crown —
  // instead of a short baton floating at hand height.
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
    // foot planted on the ground, gripped where the hand is (X/Z only)
    s.position.set(HAND_WORLD.x, 0, HAND_WORLD.z)
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
      {/* the founder's staff — a world-scale group planted on the ground, its
          X/Z tracking the gripping hand each frame (effect above). The shaft runs
          the FULL height from the earth up past the hand, and a glowing crystal
          shard crowns it above the head (Bloom catches it) — the mystical-founder
          read the operator asked to keep, now a true staff, not a baton. */}
      <group ref={staff}>
        {/* the shaft — from the ground (y≈0) to just under the crown */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 2.1, 6]} />
          <meshStandardMaterial color="#6b5236" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* the amber binding just beneath the crown */}
        <mesh position={[0, 1.98, 0]}>
          <torusGeometry args={[0.06, 0.02, 6, 12]} />
          <meshStandardMaterial color={PALETTE.amber} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* the crystal crown, above the founder's head */}
        <mesh position={[0, 2.16, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color={PALETTE.crystalCore}
            emissive={PALETTE.teal}
            emissiveIntensity={1.8}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        <mesh position={[0, 2.16, 0]}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.3} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 2.16, 0]} color={PALETTE.teal} intensity={0.5} distance={3} decay={2} />
      </group>
    </group>
  )
}

/** scratch for the per-frame hand→group-local staff placement (no allocation) */
const HAND_WORLD = new Vector3()
