// src/game/Player.tsx — the keyboard-driven capsule (game-design §3).
// A dynamic rapier body with locked rotations: WASD/arrows set velocity
// relative to the camera yaw, Shift walks. Movement mutates the body in
// useFrame (never setState per frame, §8). The same loop derives the
// walk-up proximity target — the world owns no state of record; the
// interaction store holds only the ephemeral highlight.
//
// The VISUAL is a small cloaked wanderer built from toon-shaded primitives
// (the physics stays a plain capsule collider). It bobs while idle, leans and
// faces its heading while walking, and carries a soft cool rim light — all of
// which fall still under prefers-reduced-motion.

import { useRef } from 'react'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import type { Group } from 'three'
import { STAGE1_LAYOUT } from './contracts'
import { getMoveInput } from './controls'
import { INTERACT_RADIUS, useInteractionStore } from './interaction'
import { PALETTE, TOON_RAMP } from './materials'
import { LOW_POWER } from './perf'
import { cameraYaw, playerWorldPos } from './refs'
import { useSafeFrame } from './useSafeFrame'
import { useUiStore } from '../state/ui'

const RUN_SPEED = 6
const WALK_SPEED = 2.5

/** Below this height the capsule has left the world — the safety net catches it. */
const VOID_Y = -10

/** Spawn near the plateau's south edge, by the flag row (contracts note). */
export const PLAYER_SPAWN: [number, number, number] = [2, 1.2, 18]

declare global {
  interface Window {
    /** dev/e2e builds only — the capsule's live position (plateau/void assertions) */
    __fq_player?: { x: number; y: number; z: number }
  }
}

function updateNearest(x: number, z: number): void {
  let best: string | null = null
  let bestDistance = INTERACT_RADIUS
  for (const spec of STAGE1_LAYOUT) {
    const distance = Math.hypot(spec.position[0] - x, spec.position[2] - z)
    if (distance < bestDistance) {
      best = spec.id
      bestDistance = distance
    }
  }
  useInteractionStore.getState().setNearest(best)
}

/** The cloaked wanderer — a chunky toon silhouette, never a bare capsule. */
function Wanderer(): JSX.Element {
  return (
    <group>
      {/* the cloak: wide at the hem, narrowing to the shoulders */}
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[0.46, 1.3, 10, 1]} />
        <meshToonMaterial color={PALETTE.cloak} gradientMap={TOON_RAMP} />
      </mesh>
      {/* an inner fold for a little silhouette irregularity */}
      <mesh position={[0.04, -0.1, 0.02]} rotation={[0.05, 0.4, 0.06]}>
        <coneGeometry args={[0.34, 1.1, 8, 1]} />
        <meshToonMaterial color={PALETTE.cloakDeep} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the scarf ring at the neck, warm and faintly lit */}
      <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.06, 8, 16]} />
        <meshToonMaterial
          color={PALETTE.scarf}
          emissive={PALETTE.scarf}
          emissiveIntensity={0.28}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* a trailing scarf end, tossed behind (local -z) */}
      <mesh position={[0.12, 0.42, -0.24]} rotation={[0.5, 0, -0.4]}>
        <boxGeometry args={[0.1, 0.36, 0.02]} />
        <meshToonMaterial color={PALETTE.scarf} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the hood */}
      <mesh position={[0, 0.72, -0.02]}>
        <sphereGeometry args={[0.29, 14, 14]} />
        <meshToonMaterial color={PALETTE.cloak} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the hood's peak */}
      <mesh position={[0, 1.0, -0.05]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.16, 0.34, 8, 1]} />
        <meshToonMaterial color={PALETTE.cloakDeep} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the shadowed face, set into the hood and looking forward (local +z) */}
      <mesh position={[0, 0.7, 0.2]}>
        <sphereGeometry args={[0.19, 12, 12]} />
        <meshToonMaterial
          color="#1a1530"
          emissive={PALETTE.teal}
          emissiveIntensity={0.14}
          gradientMap={TOON_RAMP}
        />
      </mesh>
    </group>
  )
}

export interface PlayerProps {
  reduced: boolean
}

export function Player({ reduced }: PlayerProps): JSX.Element {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)

  useSafeFrame(({ clock }, delta) => {
    const rb = body.current
    if (rb === null) return

    // safety net: if the capsule ever escapes the rim, return it to spawn —
    // a fall into the void must never strand the player (adversarial review 1)
    let t = rb.translation()
    if (t.y < VOID_Y) {
      rb.setTranslation({ x: PLAYER_SPAWN[0], y: PLAYER_SPAWN[1], z: PLAYER_SPAWN[2] }, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      t = rb.translation()
    }
    playerWorldPos.set(t.x, t.y, t.z)
    if (import.meta.env.DEV) {
      const record = window.__fq_player ?? { x: 0, y: 0, z: 0 }
      record.x = t.x
      record.y = t.y
      record.z = t.z
      window.__fq_player = record
    }
    updateNearest(t.x, t.z)

    let vx = 0
    let vz = 0
    if (useUiStore.getState().mode === 'roam') {
      const move = getMoveInput()
      const forward = (move.forward ? 1 : 0) - (move.back ? 1 : 0)
      const strafe = (move.right ? 1 : 0) - (move.left ? 1 : 0)
      if (forward !== 0 || strafe !== 0) {
        const yaw = cameraYaw.value
        // camera-relative axes: forward walks away from the camera
        const fx = -Math.sin(yaw)
        const fz = -Math.cos(yaw)
        const rx = Math.cos(yaw)
        const rz = -Math.sin(yaw)
        let dx = fx * forward + rx * strafe
        let dz = fz * forward + rz * strafe
        const length = Math.hypot(dx, dz)
        dx /= length
        dz /= length
        const speed = move.walk ? WALK_SPEED : RUN_SPEED
        vx = dx * speed
        vz = dz * speed
      }
    }
    const velocity = rb.linvel()
    rb.setLinvel({ x: vx, y: velocity.y, z: vz }, true)

    // wanderer idle bob / walk lean / heading — all still under reduced motion
    const vis = visual.current
    if (vis !== null) {
      const speed = Math.hypot(vx, vz)
      const moving = speed > 0.05
      if (reduced) {
        vis.position.y = 0
        vis.rotation.x = 0
        if (moving) vis.rotation.y = Math.atan2(vx, vz)
      } else {
        const time = clock.elapsedTime
        const bounce = moving ? Math.sin(time * 9) * 0.05 : 0
        vis.position.y = Math.sin(time * 1.8) * 0.03 + bounce
        const lean = moving ? 0.14 : 0
        vis.rotation.x += (lean - vis.rotation.x) * Math.min(1, delta * 6)
        if (moving) {
          const desired = Math.atan2(vx, vz)
          const d = Math.atan2(Math.sin(desired - vis.rotation.y), Math.cos(desired - vis.rotation.y))
          vis.rotation.y += d * Math.min(1, delta * 8)
        }
      }
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      lockRotations
      position={PLAYER_SPAWN}
      linearDamping={0.4}
    >
      <CapsuleCollider args={[0.55, 0.4]} />
      <group ref={visual}>
        <Wanderer />
      </group>
      {/* a soft cool rim so the silhouette lifts off the warm ground */}
      {!LOW_POWER ? (
        <pointLight position={[0.8, 1.9, -0.9]} color={PALETTE.rimCool} intensity={0.5} distance={5} decay={2} />
      ) : null}
    </RigidBody>
  )
}
