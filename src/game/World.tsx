// src/game/World.tsx — the Stage-1 grey-box Swirling Nebula scene and the
// <GameRoot/> mount. The world is a PURE RENDER of the quest store: shrines,
// flagpoles, vault seal, and guardians all derive from useStore selectors; the
// only writes go through the contracts callbacks. Physics pauses whenever a
// DOM surface (trance/panel) owns the player's attention (§2 F1, §8).
// This module makes ZERO network calls; fetch lives only in src/transport.

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier'
import { ACESFilmicToneMapping, NoToneMapping } from 'three'
import { useUiStore } from '../state/ui'
import { WORLD_COPY } from '../strings'
import { CameraRig } from './CameraRig'
import type { WorldEvents } from './contracts'
import { useWorldControls } from './controls'
import { defaultWorldEvents } from './events'
import { Interactables } from './Interactables'
import { PALETTE, TOON_RAMP } from './materials'
import { Nebula } from './Nebula'
import { LOW_POWER, WORLD_DPR } from './perf'
import { Player, PLAYER_SPAWN } from './Player'
import { PostFx } from './PostFx'
import { GroundField } from './props'
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
      {/* the plateau's drum — a dark toon cliff below the dressed top disk */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[PLATEAU_RADIUS, PLATEAU_RADIUS + 2, 1, 48]} />
        <meshToonMaterial color="#241d3c" gradientMap={TOON_RAMP} />
      </mesh>
      {/* the ground's edge dissolves into the nebula — a faint rim glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[PLATEAU_RADIUS - 1.5, PLATEAU_RADIUS + 0.5, 48]} />
        <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </RigidBody>
  )
}

/**
 * Fires `onFirstFrame` once, after the scene's first few rendered frames.
 * Mounted INSIDE the world's Suspense boundary, so the callback proves the
 * whole scene (rapier WASM included) resolved and frames actually drew — the
 * same readiness signal the dev FPS sampler uses (ruled fix 7). We wait for a
 * handful of painted frames rather than exactly one: it makes the readiness
 * signal unambiguous and gives the DOM loading line a stable, observable
 * lifetime (it never blinks out sub-frame on a fast warm boot).
 */
const READY_FRAMES = 3

function FirstFrameNotifier({ onFirstFrame }: { onFirstFrame: () => void }): null {
  const fired = useRef(false)
  const frames = useRef(0)
  useFrame(() => {
    if (fired.current) return
    frames.current += 1
    if (frames.current < READY_FRAMES) return
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
      <color attach="background" args={[PALETTE.space]} />
      <fog attach="fog" args={[PALETTE.fog, 24, 96]} />
      {/* §8 light budget: a warm golden-hour key + a cool violet fill, no shadow
          maps. Monuments carry their own small accent lights (constant count). */}
      <hemisphereLight args={[PALETTE.fillCool, '#151022', 0.55]} />
      <ambientLight color={PALETTE.fillCool} intensity={0.16} />
      <directionalLight color={PALETTE.keyWarm} position={[13, 9, 6]} intensity={1.25} />
      <Nebula reduced={reduced} />
      <GroundField />
      <Interactables reduced={reduced} />
      <ShadowTwin reduced={reduced} />
      <CameraRig reduced={reduced} />
      <Physics paused={paused} timeStep={1 / 60}>
        <Ground />
        <Player reduced={reduced} />
      </Physics>
      {onFirstFrame !== undefined ? <FirstFrameNotifier onFirstFrame={onFirstFrame} /> : null}
      {import.meta.env.DEV ? <FpsSampler /> : null}
      <PostFx reduced={reduced} lowPower={LOW_POWER} />
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
        dpr={WORLD_DPR}
        camera={{
          fov: 50,
          near: 0.1,
          far: 400,
          position: [PLAYER_SPAWN[0], PLAYER_SPAWN[1] + 2.2, PLAYER_SPAWN[2] + 6],
        }}
        // Full path: NoToneMapping on the renderer so the PostFx ToneMapping
        // effect owns the final curve (never double-mapped). Low power: no
        // composer, so the renderer tone-maps in-shader (cheap, one pass).
        gl={{
          antialias: !LOW_POWER,
          powerPreference: 'high-performance',
          toneMapping: LOW_POWER ? ACESFilmicToneMapping : NoToneMapping,
        }}
      >
        <Suspense fallback={null}>
          <World reduced={reduced} onFirstFrame={onFirstFrame} />
        </Suspense>
      </Canvas>
    </div>
  )
}
