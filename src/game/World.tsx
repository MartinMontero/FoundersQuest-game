// src/game/World.tsx — the Stage-1 grey-box Swirling Nebula scene and the
// <GameRoot/> mount. The world is a PURE RENDER of the quest store: shrines,
// flagpoles, vault seal, and guardians all derive from useStore selectors; the
// only writes go through the contracts callbacks. Physics pauses whenever a
// DOM surface (trance/panel) owns the player's attention (§2 F1, §8).
// This module makes ZERO network calls; fetch lives only in src/transport.

import { Suspense, useRef, useState } from 'react'
import { Canvas, type RootState } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier'
import { ACESFilmicToneMapping, type Mesh, NoToneMapping } from 'three'
import { useUiStore } from '../state/ui'
import { WORLD_COPY } from '../strings'
import { CameraRig } from './CameraRig'
import type { WorldEvents } from './contracts'
import { useWorldControls } from './controls'
import { defaultWorldEvents } from './events'
import { Clouds } from './Clouds'
import { Grass } from './Grass'
import { Interactables } from './Interactables'
import { PALETTE } from './materials'
import { Nebula, SunDisc } from './Nebula'
import { Trees } from './Trees'
import { FULL_POWER, IS_AUTOMATION, LOW_POWER, WORLD_DPR } from './perf'
import { Player, PLAYER_SPAWN } from './Player'
import { PostFx } from './PostFx'
import { GroundField } from './props'
import { ShadowTwin } from './ShadowTwin'
import { FpsSampler } from './useFps'
import { useReducedMotion } from './useReducedMotion'
import { useSafeFrame } from './useSafeFrame'

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
      {/* the plateau's drum — a warm-dark PBR cliff below the dressed top disk
          (warmed off pure black so its edge reads as rock, not a void panel) */}
      <mesh position={[0, -0.9, 0]} receiveShadow>
        <cylinderGeometry args={[PLATEAU_RADIUS, PLATEAU_RADIUS + 2, 1.8, 48]} />
        <meshStandardMaterial color="#3a2b40" roughness={0.92} metalness={0.05} />
      </mesh>
      {/* the ground's edge dissolves into the nebula — a faint rim glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[PLATEAU_RADIUS - 1.5, PLATEAU_RADIUS + 0.5, 48]} />
        <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.22} depthWrite={false} />
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
  useSafeFrame(() => {
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
  // the sun mesh, lifted so <PostFx/> can key its God Rays off the same disc
  // the sky draws (full tier only; null keeps God Rays out of the chain)
  const [sun, setSun] = useState<Mesh | null>(null)
  return (
    <>
      <color attach="background" args={[PALETTE.space]} />
      {/* warm indigo fog banked into the distance — depth + the OoT "air".
          Pushed back a little so the redressed islands read before it swallows
          them; the star dome and sun ignore fog (they are the far sky). */}
      <fog attach="fog" args={[PALETTE.fog, 34, 104]} />
      {/* image-based lighting: a real CC0 HDR (Poly Haven "venice_sunset") drives
          reflections + ambient on the PBR surfaces (character, ground, monuments)
          — the single biggest realism lever per the premium-UI research. Lighting
          only, no background: our nebula sky stays. Skipped on the software-GL
          automation tier (its PMREM prefilter is the one step SwiftShader chokes
          on under parallel CI load); brighter direct lights stand in there. */}
      {!IS_AUTOMATION ? <Environment files="/hdr/venice_sunset_1k.hdr" /> : null}
      {/* a warm golden-hour KEY that also casts the world's real shadows (full
          tier), a soft warm back-RIM, a cool-violet hemisphere with a warm ground
          bounce, and an ambient lift (stronger when there is no IBL to fill). */}
      <hemisphereLight args={[PALETTE.fillCool, PALETTE.groundBounce, IS_AUTOMATION ? 0.8 : 0.35]} />
      <ambientLight color={PALETTE.keyWarm} intensity={IS_AUTOMATION ? 0.5 : 0.1} />
      <directionalLight
        color={PALETTE.keyWarm}
        position={[-18, 22, -14]}
        intensity={2.0}
        castShadow={FULL_POWER}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.0004}
      />
      <directionalLight color={PALETTE.rimWarm} position={[14, 5, 12]} intensity={0.4} />
      <SunDisc onReady={setSun} />
      {/* soft cloud banks around the floating islands (off the CI tier) */}
      {IS_AUTOMATION ? null : <Clouds reduced={reduced} />}
      <Nebula reduced={reduced} />
      <GroundField />
      <Grass reduced={reduced} />
      {/* real trees off the CI tier (keeps the ~4 MB of bark textures out of
          the software-GL automation path) */}
      {IS_AUTOMATION ? null : <Trees />}
      <Interactables reduced={reduced} />
      <ShadowTwin reduced={reduced} />
      <CameraRig reduced={reduced} />
      <Physics paused={paused} timeStep={1 / 60}>
        <Ground />
        <Player reduced={reduced} />
      </Physics>
      {onFirstFrame !== undefined ? <FirstFrameNotifier onFirstFrame={onFirstFrame} /> : null}
      {import.meta.env.DEV ? <FpsSampler /> : null}
      <PostFx reduced={reduced} lowPower={LOW_POWER} sun={sun} />
    </>
  )
}

export interface GameRootProps {
  /** contracts callbacks; defaults wire into the ui/quest stores (events.ts) */
  events?: WorldEvents
  /** called once on the world's first rendered frame (App's loading line) */
  onFirstFrame?: () => void
}

/** Recover from WebGL context loss instead of dying to the app error boundary.
 * `preventDefault()` on 'webglcontextlost' asks the browser to restore the
 * context; on 'webglcontextrestored' we invalidate so R3F repaints the scene.
 * Mobile GPUs drop contexts under memory/thermal pressure routinely — this
 * turns "the world failed to hold together" into a recoverable blip. */
function handleCreated(state: RootState): void {
  const canvas = state.gl.domElement
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault(), false)
  canvas.addEventListener('webglcontextrestored', () => state.invalidate(), false)
}

/** The world mount: keyboard bindings + the R3F canvas. */
export function GameRoot({ events = defaultWorldEvents, onFirstFrame }: GameRootProps): JSX.Element {
  useWorldControls(events)
  const reduced = useReducedMotion()
  return (
    <div className="absolute inset-0" role="application" aria-label={WORLD_COPY.worldName}>
      <Canvas
        dpr={WORLD_DPR}
        shadows={FULL_POWER}
        camera={{
          fov: 50,
          near: 0.1,
          far: 400,
          position: [PLAYER_SPAWN[0], PLAYER_SPAWN[1] + 2.2, PLAYER_SPAWN[2] + 6],
        }}
        // Full path: NoToneMapping on the renderer so the PostFx ToneMapping
        // effect owns the final curve (never double-mapped). Low power: no
        // composer, so the renderer tone-maps in-shader (cheap, one pass).
        // 'high-performance' only on the full tier — on a phone it can force a
        // hotter GPU path for no benefit (constrained ships no effect stack).
        gl={{
          antialias: FULL_POWER,
          powerPreference: FULL_POWER ? 'high-performance' : 'default',
          toneMapping: LOW_POWER ? ACESFilmicToneMapping : NoToneMapping,
          // let a lost context be recovered rather than abandoned as a dead frame
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={handleCreated}
      >
        <Suspense fallback={null}>
          <World reduced={reduced} onFirstFrame={onFirstFrame} />
        </Suspense>
      </Canvas>
    </div>
  )
}
