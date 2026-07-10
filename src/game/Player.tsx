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

/** The cloaked wanderer — a chunky, rounded N64 silhouette (big-hood charm,
 * hood + scarf, faceless-mysterious). A soft cowl, never a pointed hat; never a
 * bare capsule. */
function Wanderer(): JSX.Element {
  return (
    <group>
      {/* the cloak: a chunky rounded bell, wide at the hem */}
      <mesh position={[0, -0.02, 0]}>
        <coneGeometry args={[0.54, 1.34, 12, 1]} />
        <meshToonMaterial color={PALETTE.cloak} gradientMap={TOON_RAMP} />
      </mesh>
      {/* an inner fold for a little silhouette irregularity */}
      <mesh position={[0.05, -0.08, 0.03]} rotation={[0.04, 0.4, 0.06]}>
        <coneGeometry args={[0.4, 1.14, 10, 1]} />
        <meshToonMaterial color={PALETTE.cloakDeep} gradientMap={TOON_RAMP} />
      </mesh>
      {/* rounded shoulders — a squashed dome that fattens the N64 silhouette */}
      <mesh position={[0, 0.44, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[0.33, 14, 12]} />
        <meshToonMaterial color={PALETTE.cloak} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the scarf ring at the neck — chunky, warm and faintly lit */}
      <mesh position={[0, 0.5, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.08, 10, 18]} />
        <meshToonMaterial
          color={PALETTE.scarf}
          emissive={PALETTE.scarf}
          emissiveIntensity={0.3}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* a trailing scarf end, tossed behind (local -z) */}
      <mesh position={[0.13, 0.44, -0.26]} rotation={[0.55, 0, -0.4]}>
        <boxGeometry args={[0.12, 0.4, 0.03]} />
        <meshToonMaterial color={PALETTE.scarf} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the hood — a big rounded head, N64 charm */}
      <mesh position={[0, 0.82, -0.02]}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshToonMaterial color={PALETTE.cloak} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the hood's rounded back-fold — a soft cowl, deliberately NOT a peak */}
      <mesh position={[0, 0.9, -0.2]} rotation={[0.6, 0, 0]} scale={[1, 1.2, 1]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshToonMaterial color={PALETTE.cloakDeep} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the shadowed face, set into the hood and looking forward (local +z) */}
      <mesh position={[0, 0.8, 0.23]}>
        <sphereGeometry args={[0.21, 12, 12]} />
        <meshToonMaterial
          color="#160f28"
          emissive={PALETTE.teal}
          emissiveIntensity={0.16}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* a faint rune-lit hem trim around the cloak base — a little glow the
          bloom catches, so the silhouette reads lit from within */}
      <mesh position={[0, -0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 8, 20]} />
        <meshToonMaterial
          color={PALETTE.teal}
          emissive={PALETTE.teal}
          emissiveIntensity={0.55}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* the wanderer's staff, carried at the right hand — a weathered shaft
          topped by a glowing shard. The strongest read of "adventurer" in the
          silhouette; the shard catches bloom like the shrine runes. */}
      <group position={[0.44, 0, 0.08]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 1.9, 6]} />
          <meshToonMaterial color="#6b5a44" gradientMap={TOON_RAMP} />
        </mesh>
        {/* the binding just below the shard */}
        <mesh position={[0, 1.36, 0]}>
          <torusGeometry args={[0.06, 0.02, 6, 12]} />
          <meshToonMaterial color={PALETTE.amber} gradientMap={TOON_RAMP} />
        </mesh>
        {/* the crowning shard */}
        <mesh position={[0, 1.56, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshToonMaterial
            color={PALETTE.crystalCore}
            emissive={PALETTE.teal}
            emissiveIntensity={1.4}
            gradientMap={TOON_RAMP}
          />
        </mesh>
        {/* a soft glow core around the shard */}
        <mesh position={[0, 1.56, 0]}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      </group>
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
        vis.rotation.z = 0
        if (moving) vis.rotation.y = Math.atan2(vx, vz)
      } else {
        const time = clock.elapsedTime
        const bounce = moving ? Math.sin(time * 9) * 0.055 : 0
        vis.position.y = Math.sin(time * 1.8) * 0.035 + bounce
        const lean = moving ? 0.15 : 0
        vis.rotation.x += (lean - vis.rotation.x) * Math.min(1, delta * 6)
        // a gentle waddle: a wider side-to-side roll on the march, a soft
        // breathing tilt at rest — the little N64 life, still under reduced motion
        const sway = moving ? Math.sin(time * 4.5) * 0.06 : Math.sin(time * 1.2) * 0.015
        vis.rotation.z += (sway - vis.rotation.z) * Math.min(1, delta * 6)
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
