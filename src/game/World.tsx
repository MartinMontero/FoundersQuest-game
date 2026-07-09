// src/game/World.tsx — the Stage-1 grey-box Swirling Nebula scene and the
// <GameRoot/> mount. The world is a PURE RENDER of the quest store: shrines,
// flagpoles, vault seal, and guardians all derive from useStore selectors; the
// only writes go through the contracts callbacks. Physics pauses whenever a
// DOM surface (trance/panel) owns the player's attention (§2 F1, §8).
// This module makes ZERO network calls; fetch lives only in src/transport.

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier'
import { useUiStore } from '../state/ui'
import { WORLD_COPY } from '../strings'
import { CameraRig } from './CameraRig'
import type { WorldEvents } from './contracts'
import { useWorldControls } from './controls'
import { defaultWorldEvents } from './events'
import { Interactables } from './Interactables'
import { Nebula } from './Nebula'
import { Player, PLAYER_SPAWN } from './Player'
import { ShadowTwin } from './ShadowTwin'
import { FpsSampler } from './useFps'
import { useReducedMotion } from './useReducedMotion'

const PLATEAU_RADIUS = 24
/** rim wall radius — just inside the disk so the capsule can never step off it */
const RIM_RADIUS = PLATEAU_RADIUS - 0.5
/** segments in the circular rim: 16 short walls approximate the disk edge */
const RIM_SEGMENTS = 16
// half the chord length per segment, padded so neighbouring walls overlap —
// no gap exists anywhere around the circumference (the old four square walls
// left the whole diagonal edge open: a void fall)
const RIM_HALF_WIDTH = RIM_RADIUS * Math.tan(Math.PI / RIM_SEGMENTS) + 0.3

const RIM_WALLS: readonly { position: [number, number, number]; yaw: number }[] = Array.from(
  { length: RIM_SEGMENTS },
  (_, i) => {
    const angle = (i / RIM_SEGMENTS) * Math.PI * 2
    return {
      position: [Math.cos(angle) * RIM_RADIUS, 2, Math.sin(angle) * RIM_RADIUS] as [
        number,
        number,
        number,
      ],
      // local X tangent to the circle, local Z (thickness) pointing radially
      yaw: Math.PI / 2 - angle,
    }
  },
)

/** The nebula plateau: one fixed body — cylinder ground + a circular rim wall. */
function Ground(): JSX.Element {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[0.5, PLATEAU_RADIUS]} position={[0, -0.5, 0]} />
      {/* circular rim keeps the capsule on the disk — invisible, grey-box only */}
      {RIM_WALLS.map((wall, i) => (
        <CuboidCollider
          key={i}
          args={[RIM_HALF_WIDTH, 2, 0.5]}
          position={wall.position}
          rotation={[0, wall.yaw, 0]}
        />
      ))}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[PLATEAU_RADIUS, PLATEAU_RADIUS + 2, 1, 48]} />
        <meshStandardMaterial color="#221c38" />
      </mesh>
      {/* the ground's edge dissolves into the nebula — a faint rim glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[PLATEAU_RADIUS - 1.5, PLATEAU_RADIUS, 48]} />
        <meshBasicMaterial color="#6f5cf0" transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </RigidBody>
  )
}

/**
 * Fires `onFirstFrame` once, on the scene's first rendered frame. Mounted
 * INSIDE the world's Suspense boundary, so the callback proves the whole
 * scene (rapier WASM included) resolved and a frame actually drew — the same
 * readiness signal the dev FPS sampler uses (ruled fix 7).
 */
function FirstFrameNotifier({ onFirstFrame }: { onFirstFrame: () => void }): null {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    onFirstFrame()
  })
  return null
}

export interface WorldProps {
  reduced: boolean
  /** called once on the first rendered frame — the DOM loading line reads this */
  onFirstFrame?: () => void
}

/** Scene contents — everything inside the Canvas. */
export function World({ reduced, onFirstFrame }: WorldProps): JSX.Element {
  const paused = useUiStore((s) => s.mode !== 'roam')
  return (
    <>
      <color attach="background" args={['#0b0817']} />
      <fog attach="fog" args={['#191233', 20, 95]} />
      {/* §8 light budget: one directional + one hemisphere, no shadow maps */}
      <hemisphereLight args={['#7d6ff0', '#151022', 0.7]} />
      <directionalLight position={[10, 16, 8]} intensity={1.0} />
      <Nebula reduced={reduced} />
      <Interactables reduced={reduced} />
      <ShadowTwin reduced={reduced} />
      <CameraRig reduced={reduced} />
      <Physics paused={paused} timeStep={1 / 60}>
        <Ground />
        <Player />
      </Physics>
      {onFirstFrame !== undefined ? <FirstFrameNotifier onFirstFrame={onFirstFrame} /> : null}
      {import.meta.env.DEV ? <FpsSampler /> : null}
    </>
  )
}

export interface GameRootProps {
  /** contracts callbacks; defaults wire into the ui/quest stores (events.ts) */
  events?: WorldEvents
  /** called once on the world's first rendered frame (App's loading line) */
  onFirstFrame?: () => void
}

/** The world mount: keyboard bindings + the R3F canvas. */
export function GameRoot({ events = defaultWorldEvents, onFirstFrame }: GameRootProps): JSX.Element {
  useWorldControls(events)
  const reduced = useReducedMotion()
  return (
    <div className="absolute inset-0" role="application" aria-label={WORLD_COPY.worldName}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 50,
          near: 0.1,
          far: 160,
          position: [PLAYER_SPAWN[0], PLAYER_SPAWN[1] + 2.2, PLAYER_SPAWN[2] + 6],
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <World reduced={reduced} onFirstFrame={onFirstFrame} />
        </Suspense>
      </Canvas>
    </div>
  )
}
