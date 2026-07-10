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
import { PALETTE } from './materials'
import { LOW_POWER } from './perf'
import { cameraYaw, playerWorldPos } from './refs'
import { RogueCharacter, type Gait } from './RogueCharacter'
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

export interface PlayerProps {
  reduced: boolean
}

export function Player({ reduced }: PlayerProps): JSX.Element {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  // live gait for the rigged character's animation state machine (idle/walk/run);
  // written here in the physics frame, read inside <RogueCharacter/> — no re-render
  const gait = useRef<Gait>('idle')

  useSafeFrame((_, delta) => {
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
    let walking = false
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
        walking = move.walk
        const speed = walking ? WALK_SPEED : RUN_SPEED
        vx = dx * speed
        vz = dz * speed
      }
    }
    const velocity = rb.linvel()
    rb.setLinvel({ x: vx, y: velocity.y, z: vz }, true)

    // heading + gait for the rigged character. The baked clips own the body
    // motion (bob, stride); here we only turn the avatar toward its heading and
    // pick idle / walk / run from the ground speed.
    const speed = Math.hypot(vx, vz)
    const moving = speed > 0.05
    gait.current = !moving ? 'idle' : walking ? 'walk' : 'run'
    const vis = visual.current
    if (vis !== null && moving) {
      const desired = Math.atan2(vx, vz)
      if (reduced) {
        vis.rotation.y = desired
      } else {
        const d = Math.atan2(Math.sin(desired - vis.rotation.y), Math.cos(desired - vis.rotation.y))
        vis.rotation.y += d * Math.min(1, delta * 10)
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
        <RogueCharacter gait={gait} reduced={reduced} />
      </group>
      {/* a soft cool rim so the silhouette lifts off the warm ground */}
      {!LOW_POWER ? (
        <pointLight position={[0.8, 1.9, -0.9]} color={PALETTE.rimCool} intensity={0.5} distance={5} decay={2} />
      ) : null}
    </RigidBody>
  )
}
