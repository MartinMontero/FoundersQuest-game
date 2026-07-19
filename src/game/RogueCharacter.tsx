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
import { asset } from './assets'
import { PALETTE } from './materials'
import { useSafeFrame } from './useSafeFrame'

const MODEL_URL = asset('models/rogue.glb')
useGLTF.preload(MODEL_URL)

declare global {
  interface Window {
    /** dev/tuning only — live override for the staff-grip arm pose (9 Eulers) */
    __fq_pose?: number[] | null
    /** dev/tuning only — the clip's animated arm pose this frame, pre-override */
    __fq_pose_now?: number[]
  }
}

/** the pinned walking-staff grip: [upper.xyz, lower.xyz, hand.xyz] local Euler
 *  angles for the RIGHT arm, applied after the mixer each frame. Tuned against
 *  captures (QA 2026-07-14 — the clips leave the arm hanging, fist beside the
 *  shaft). */
const STAFF_GRIP_POSE: readonly number[] = [
  -0.95, -0.737, 1.0, //    upperarm.r — swung out+forward so the fist sits BESIDE
  //                        the body (QA round 4: the chest grip pulled the shaft
  //                        through the torso; the shaft must clear the silhouette)
  0, 0, 1.6, //             lowerarm.r — moderate curl, fist at hip-waist height
  -0.599, 0.765, -0.278, // hand.r — the clip's fist orientation, knuckles out
]

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
  // QA round 5 — measured against the rig: `handslot.r` is the WEAPON MOUNT,
  // sitting +0.096/-0.058 BEYOND `hand.r` (at the knuckles), so a staff pinned
  // there grazes past the visible mitt. The fist's visual center is midway
  // between the two bones — the shaft is pinned THERE, so it emerges above and
  // below the closed fist and reads as gripped.
  const handBone = useRef<Object3D | null>(null)
  const slotBone = useRef<Object3D | null>(null)
  const armBones = useRef<{ upper: Object3D; lower: Object3D; hand: Object3D } | null>(null)
  useEffect(() => {
    // GLTFLoader strips the '.' from bone names, so `handslot.r` → `handslotr`.
    handBone.current = scene.getObjectByName('handr') ?? null
    slotBone.current = scene.getObjectByName('handslotr') ?? null
    const upper = scene.getObjectByName('upperarmr')
    const lower = scene.getObjectByName('lowerarmr')
    const hand = scene.getObjectByName('handr')
    armBones.current =
      upper !== undefined && lower !== undefined && hand !== undefined
        ? { upper, lower, hand }
        : null
  }, [scene])
  useSafeFrame(() => {
    const s = staff.current
    const hand = handBone.current
    const g = group.current
    if (s === null || hand === null || g === null) return
    // POSE the gripping arm (QA: the clips leave the arm hanging at the hip, so
    // the staff read as floating beside a limp fist). After the mixer writes the
    // clip pose, pin the right arm into a walking-staff grip: forearm raised
    // across the body, fist closed around the shaft line. The torso above still
    // animates, so the arm rides the body's sway without ever letting go.
    const bones = armBones.current
    if (bones !== null) {
      if (import.meta.env.DEV) {
        // mirror the ANIMATED baseline (pre-override) for tuning sessions
        window.__fq_pose_now = [
          bones.upper.rotation.x, bones.upper.rotation.y, bones.upper.rotation.z,
          bones.lower.rotation.x, bones.lower.rotation.y, bones.lower.rotation.z,
          bones.hand.rotation.x, bones.hand.rotation.y, bones.hand.rotation.z,
        ]
      }
      const pose = import.meta.env.DEV ? (window.__fq_pose ?? STAFF_GRIP_POSE) : STAFF_GRIP_POSE
      bones.upper.rotation.set(pose[0] ?? 0, pose[1] ?? 0, pose[2] ?? 0)
      bones.lower.rotation.set(pose[3] ?? 0, pose[4] ?? 0, pose[5] ?? 0)
      bones.hand.rotation.set(pose[6] ?? 0, pose[7] ?? 0, pose[8] ?? 0)
    }
    hand.getWorldPosition(HAND_WORLD)
    const slot = slotBone.current
    if (slot !== null) {
      // midpoint of hand.r and handslot.r = the mitt's visual center
      slot.getWorldPosition(SLOT_WORLD)
      HAND_WORLD.lerp(SLOT_WORLD, 0.5)
    }
    g.worldToLocal(HAND_WORLD)
    const hx = HAND_WORLD.x
    const hz = HAND_WORLD.z
    // GRIP the staff IN the hand: the group origin sits exactly at the hand (full
    // 3D), so the shaft passes THROUGH the grip like the blade does — not beside
    // it. The shaft geometry extends below the grip to the ground and above it to
    // the crown, so it still reads as a full-length staff.
    s.position.copy(HAND_WORLD)
    // lean the top outward (pivot = the grip) so the shaft clears the wide hood
    // while the grip stays fixed at the hand.
    const len = Math.hypot(hx, hz)
    if (len > 1e-4) {
      LEAN_AXIS.set(hz / len, 0, -hx / len)
      s.quaternion.setFromAxisAngle(LEAN_AXIS, STAFF_LEAN)
    }
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
      {/* the founder's staff — a world-scale group whose ORIGIN is the grip, set to
          the hand's world position each frame (effect above) so the shaft runs
          THROUGH the hand like a held blade. It extends below the grip to the earth
          and above it to a glowing crystal crown over the head (Bloom catches it). */}
      <group ref={staff}>
        {/* the shaft — from the ground (~0.64 below the grip) up past the head */}
        <mesh position={[0, 0.46, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 2.2, 6]} />
          <meshStandardMaterial color="#6b5236" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* the amber binding just beneath the crown */}
        <mesh position={[0, 1.42, 0]}>
          <torusGeometry args={[0.06, 0.02, 6, 12]} />
          <meshStandardMaterial color={PALETTE.amber} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* the crystal crown, above the founder's head */}
        <mesh position={[0, 1.58, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color={PALETTE.crystalCore}
            emissive={PALETTE.teal}
            emissiveIntensity={1.8}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        <mesh position={[0, 1.58, 0]}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.3} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 1.58, 0]} color={PALETTE.teal} intensity={0.5} distance={3} decay={2} />
      </group>
    </group>
  )
}

/** how far the staff's top tips outward from the body (radians ≈ 11°) — enough
 * to clear the wide hood, gentle enough to still read as a planted traveller's staff */
const STAFF_LEAN = 0.2

/** scratch for the per-frame hand→group-local staff placement (no allocation) */
const HAND_WORLD = new Vector3()
/** scratch for the weapon-mount bone (mixed with the hand for the mitt center) */
const SLOT_WORLD = new Vector3()
/** scratch axis for the outward lean (perpendicular to the hand's radial dir) */
const LEAN_AXIS = new Vector3()
