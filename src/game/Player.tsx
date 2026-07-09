// src/game/Player.tsx — the keyboard-driven capsule (game-design §3).
// A dynamic rapier body with locked rotations: WASD/arrows set velocity
// relative to the camera yaw, Shift walks. Movement mutates the body in
// useFrame (never setState per frame, §8). The same loop derives the
// walk-up proximity target — the world owns no state of record; the
// interaction store holds only the ephemeral highlight.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { STAGE1_LAYOUT } from './contracts'
import { getMoveInput } from './controls'
import { INTERACT_RADIUS, useInteractionStore } from './interaction'
import { cameraYaw, playerWorldPos } from './refs'
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

export function Player(): JSX.Element {
  const body = useRef<RapierRigidBody>(null)

  useFrame(() => {
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
      <mesh>
        <capsuleGeometry args={[0.4, 1.1, 6, 16]} />
        <meshStandardMaterial color="#b8b2d9" emissive="#4a3f8f" emissiveIntensity={0.2} />
      </mesh>
    </RigidBody>
  )
}
