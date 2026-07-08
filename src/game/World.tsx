// src/game/World.tsx — the Stage-1 grey-box Swirling Nebula scene and the
// <GameRoot/> mount. The world is a PURE RENDER of the quest store: shrines,
// flagpoles, vault seal, and guardians all derive from useStore selectors; the
// only writes go through the contracts callbacks. Physics pauses whenever a
// DOM surface (trance/panel) owns the player's attention (§2 F1, §8).
// This module makes ZERO network calls; fetch lives only in src/transport.

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
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
const WALL = PLATEAU_RADIUS - 0.5

/** The nebula plateau: one fixed body — cylinder ground + four unseen edge walls. */
function Ground(): JSX.Element {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[0.5, PLATEAU_RADIUS]} position={[0, -0.5, 0]} />
      {/* edge walls keep the capsule on the plateau — invisible, grey-box only */}
      <CuboidCollider args={[PLATEAU_RADIUS, 2, 0.5]} position={[0, 2, -WALL]} />
      <CuboidCollider args={[PLATEAU_RADIUS, 2, 0.5]} position={[0, 2, WALL]} />
      <CuboidCollider args={[0.5, 2, PLATEAU_RADIUS]} position={[-WALL, 2, 0]} />
      <CuboidCollider args={[0.5, 2, PLATEAU_RADIUS]} position={[WALL, 2, 0]} />
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

export interface WorldProps {
  reduced: boolean
}

/** Scene contents — everything inside the Canvas. */
export function World({ reduced }: WorldProps): JSX.Element {
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
      {import.meta.env.DEV ? <FpsSampler /> : null}
    </>
  )
}

export interface GameRootProps {
  /** contracts callbacks; defaults wire into the ui/quest stores (events.ts) */
  events?: WorldEvents
}

/** The world mount: keyboard bindings + the R3F canvas. */
export function GameRoot({ events = defaultWorldEvents }: GameRootProps): JSX.Element {
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
          <World reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  )
}
