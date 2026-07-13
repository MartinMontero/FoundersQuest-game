// src/game/setpieces/W6.tsx — World 6 "Refinement — The Sculptor" landmark:
// THE ATELIER. An open-air marble workshop in chisel-dust light: a pale, lightly
// warm quarried floor slab; two half-carved statues on plinths — each a rough
// block stepped by chisel courses (stacked offset boxes) with a polished head
// and shoulder-mass just emerging from the uncut matrix; a work trestle with a
// leaning slab, mallet, and chisel; and behind it all THE UNSEEN — a rough-cut
// dark doorway into an unlit annex, four near-black translucent hooded
// silhouettes standing just outside the light, facing the atelier. Warm motes
// of chisel dust drift over the working floor.
//
// Scenery only: no store reads/writes, no strings, no Html. Mounted inside a
// world <group>, so everything renders at LOCAL origin (footprint r <= 5.5,
// height <= 8) and reads from the spawn side (+z looking toward -z: statues
// front the approach, the dark doorway waits behind them). Placement is
// index-hashed (no Math.random) so every boot and screenshot is identical.
// Motion runs through useSafeFrame and settles fully static under `reduced`.
// Light count is CONSTANT (two point lights, full tier only) — no recompiles;
// the annex stays outside both pools so the Unseen read as shadow, not props.

import { useRef } from 'react'
import type { Group } from 'three'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

// ---- the Sculptor register: pale warm marble under warm-clay ordeal light ----

const SKY = skyForStage(6)
/** signature warm-clay accent — the chisel-dust glow (worldPalette stage 6) */
const ACCENT = SKY.accent

/** polished marble — the emerged head and shoulders catch the most light */
const MARBLE_LIT = '#efe8d8'
/** quarried marble — floor slab and block courses, pale and lightly warm */
const MARBLE = '#ddd5c2'
/** shadowed marble courses and the raised working floor */
const MARBLE_DIM = '#c2b7a0'
/** the working stone under the marble — plinths, threshold */
const PLINTH = '#93876f'
/** rough-cut annex stone — the doorway's jambs and lintel */
const FRAME = '#75695a'
/** the trestle's oiled timber */
const TIMBER = '#5d4a36'
const TIMBER_DEEP = '#43352a'
/** the unlit annex behind the doorway */
const VOID = '#060409'
/** the Unseen — near-black, faintly violet, half-there */
const SHADE = '#0e0a14'

/** Deterministic 0..1 hash of an index — seeded scatter, identical every boot. */
function hash01(n: number): number {
  let h = Math.imul(n + 1, 2654435761)
  h = Math.imul(h ^ (h >>> 13), 1597334677)
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}

// ---- the half-carved statues: chisel courses, an emerging figure ----

/** one chisel course — a block stepped/spun off the course below it */
interface CourseSpec {
  w: number
  h: number
  d: number
  x: number
  y: number
  z: number
  spin: number
}

interface StatueSpec {
  x: number
  z: number
  yaw: number
  /** the block, bottom-up: each course cut smaller and knocked off-line */
  block: readonly CourseSpec[]
  /** the shoulder-mass breaking free of the top course */
  shoulder: { w: number; h: number; d: number; x: number; y: number; z: number; roll: number }
  /** the head-sphere, pushed forward out of the stone */
  head: { r: number; x: number; y: number; z: number; bow: number }
  /** the uncut matrix corner still gripping the figure from behind */
  matrix: CourseSpec
}

/** two statues, no two alike: one freed to the shoulders and looking up-level,
 * one barely surfaced and bowed — plinth top sits at y 0.64 for both */
const STATUES: readonly StatueSpec[] = [
  {
    x: -1.75,
    z: -0.35,
    yaw: 0.35,
    block: [
      { w: 0.95, h: 0.7, d: 0.8, x: 0, y: 0.99, z: 0, spin: 0 },
      { w: 0.84, h: 0.5, d: 0.72, x: 0.05, y: 1.59, z: -0.02, spin: 0.09 },
      { w: 0.66, h: 0.34, d: 0.6, x: -0.04, y: 2.01, z: 0.03, spin: -0.12 },
    ],
    shoulder: { w: 0.68, h: 0.26, d: 0.46, x: 0, y: 2.3, z: 0.02, roll: 0.05 },
    head: { r: 0.23, x: 0.02, y: 2.6, z: 0.08, bow: 0.1 },
    matrix: { w: 0.3, h: 0.55, d: 0.34, x: -0.3, y: 2.42, z: -0.16, spin: 0.2 },
  },
  {
    x: 1.85,
    z: -1.05,
    yaw: -0.5,
    block: [
      { w: 0.9, h: 0.85, d: 0.78, x: 0, y: 1.07, z: 0, spin: 0 },
      { w: 0.82, h: 0.62, d: 0.7, x: -0.05, y: 1.8, z: 0.02, spin: -0.08 },
      { w: 0.74, h: 0.5, d: 0.64, x: 0.06, y: 2.36, z: -0.03, spin: 0.14 },
    ],
    shoulder: { w: 0.52, h: 0.24, d: 0.42, x: 0.14, y: 2.72, z: 0.03, roll: -0.12 },
    head: { r: 0.21, x: 0.1, y: 2.94, z: 0.07, bow: 0.34 },
    matrix: { w: 0.34, h: 0.6, d: 0.4, x: -0.2, y: 2.8, z: -0.12, spin: -0.16 },
  },
]

/** A half-carved statue: working plinth, stepped chisel courses, and the
 * polished figure — shoulders and head — emerging from the uncut matrix. */
function HalfCarvedStatue({ spec }: { spec: StatueSpec }): JSX.Element {
  const { x, z, yaw, block, shoulder, head, matrix } = spec
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      {/* the working plinth: base and cap */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[1.15, 0.5, 1.15]} />
        <meshStandardMaterial color={PLINTH} roughness={0.85} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.57, 0]} castShadow>
        <boxGeometry args={[1.0, 0.14, 1.0]} />
        <meshStandardMaterial color={MARBLE_DIM} roughness={0.82} metalness={0.03} />
      </mesh>
      {/* the chisel courses — each block cut smaller and knocked off-line */}
      {block.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} rotation={[0, c.spin, 0]} castShadow>
          <boxGeometry args={[c.w, c.h, c.d]} />
          <meshStandardMaterial
            color={i === 0 ? MARBLE_DIM : MARBLE}
            roughness={0.82}
            metalness={0.03}
          />
        </mesh>
      ))}
      {/* the shoulder-mass breaking free — polished, catching the light */}
      <mesh position={[shoulder.x, shoulder.y, shoulder.z]} rotation={[0, 0, shoulder.roll]} castShadow>
        <boxGeometry args={[shoulder.w, shoulder.h, shoulder.d]} />
        <meshStandardMaterial color={MARBLE_LIT} roughness={0.72} metalness={0.03} />
      </mesh>
      {/* the head-sphere, pushed forward out of the stone */}
      <mesh position={[head.x, head.y, head.z]} rotation={[head.bow, 0, 0]} castShadow>
        <sphereGeometry args={[head.r, 12, 12]} />
        <meshStandardMaterial color={MARBLE_LIT} roughness={0.72} metalness={0.03} />
      </mesh>
      {/* the uncut matrix corner still gripping the figure from behind */}
      <mesh position={[matrix.x, matrix.y, matrix.z]} rotation={[0, matrix.spin, 0]} castShadow>
        <boxGeometry args={[matrix.w, matrix.h, matrix.d]} />
        <meshStandardMaterial color={MARBLE} roughness={0.85} metalness={0.03} />
      </mesh>
    </group>
  )
}

// ---- deterministic scatter: marble chips knocked off the blocks ----

const CHIPS: readonly { x: number; z: number; yaw: number; s: number }[] = Array.from(
  { length: 7 },
  (_, i) => {
    const a = hash01(i * 5 + 3) * Math.PI * 2
    const r = 0.9 + hash01(i * 5 + 4) * 1.7
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r * 0.75 - 0.2,
      yaw: hash01(i * 5 + 5) * Math.PI * 2,
      s: 0.05 + hash01(i * 5 + 6) * 0.07,
    }
  },
)

// ---- chisel-dust motes adrift over the working floor ----

interface MoteSpec {
  x: number
  z: number
  y: number
  phase: number
  speed: number
}

const MOTES: readonly MoteSpec[] = Array.from({ length: 5 }, (_, i) => {
  const a = hash01(i * 9 + 1) * Math.PI * 2
  const r = 0.6 + hash01(i * 9 + 2) * 1.9
  return {
    x: Math.cos(a) * r,
    z: Math.sin(a) * r * 0.7 - 0.5,
    y: 1.1 + hash01(i * 9 + 3) * 1.4,
    phase: hash01(i * 9 + 4) * Math.PI * 2,
    speed: 0.45 + hash01(i * 9 + 5) * 0.4,
  }
})

// ---- the Unseen: four shadowed watchers just outside the light ----

/** near-black hooded silhouettes ranged before the annex door, facing the
 * atelier (+z) — varied heights and stances, none quite in line */
const UNSEEN: readonly { x: number; z: number; yaw: number; s: number }[] = [
  { x: -1.35, z: -3.1, yaw: 0.18, s: 0.95 },
  { x: -0.45, z: -3.45, yaw: -0.06, s: 1.1 },
  { x: 0.55, z: -3.35, yaw: 0.1, s: 1.0 },
  { x: 1.4, z: -3.0, yaw: -0.22, s: 0.88 },
]

/** One watcher — the game's menhir-figure silhouette, near-black and half-there. */
function UnseenFigure({ x, z, yaw, s }: { x: number; z: number; yaw: number; s: number }): JSX.Element {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]} scale={s}>
      {/* the hooded body — a tapered standing shadow */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.17, 0.36, 1.6, 5]} />
        <meshStandardMaterial
          color={SHADE}
          transparent
          opacity={0.5}
          roughness={0.8}
          metalness={0.02}
        />
      </mesh>
      {/* the hood */}
      <mesh position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshStandardMaterial
          color={SHADE}
          transparent
          opacity={0.5}
          roughness={0.8}
          metalness={0.02}
        />
      </mesh>
    </group>
  )
}

// ---- assembly ----

export function SetPieceW6({ reduced }: { reduced: boolean }): JSX.Element {
  const motes = useRef<Group>(null)

  // the chisel dust drifts and slowly turns in the still air; dead still under
  // reduced motion (no shake, ever) — everything else in the atelier is stone
  useSafeFrame(({ clock }) => {
    const g = motes.current
    if (g === null) return
    const t = clock.elapsedTime
    g.children.forEach((child, i) => {
      const m = MOTES[i]
      if (m === undefined) return
      child.position.y = reduced ? m.y : m.y + Math.sin(t * m.speed + m.phase) * 0.11
      child.rotation.y = reduced ? 0 : t * 0.4 + m.phase
    })
  })

  return (
    <group>
      {/* ---- the marble floor: a pale quarried slab, one raised course ---- */}
      <mesh position={[0, 0.08, -0.2]} receiveShadow>
        <boxGeometry args={[6.6, 0.16, 5.2]} />
        <meshStandardMaterial color={MARBLE} roughness={0.82} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.21, -0.5]} rotation={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.1, 3.6]} />
        <meshStandardMaterial color={MARBLE_DIM} roughness={0.82} metalness={0.03} />
      </mesh>

      {/* ---- the two half-carved statues on their plinths ---- */}
      {STATUES.map((s, i) => (
        <HalfCarvedStatue key={i} spec={s} />
      ))}

      {/* ---- the work trestle: A-frame legs, beam, leaning slab, tools ---- */}
      <group position={[2.4, 0, 1.55]} rotation={[0, -0.35, 0]}>
        {/* two pairs of splayed legs */}
        {[-0.62, 0.62].map((lx) =>
          [-0.24, 0.24].map((lz) => (
            <mesh
              key={`${lx}-${lz}`}
              position={[lx, 0.38, lz]}
              rotation={[lz > 0 ? -0.42 : 0.42, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.045, 0.06, 0.85, 6]} />
              <meshStandardMaterial color={TIMBER_DEEP} roughness={0.85} metalness={0.03} />
            </mesh>
          )),
        )}
        {/* the beam */}
        <mesh position={[0, 0.78, 0]} castShadow>
          <boxGeometry args={[1.6, 0.12, 0.22]} />
          <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* the leaning marble slab, propped against the beam */}
        <mesh position={[0.05, 0.84, 0.12]} rotation={[-0.34, 0.05, 0]} castShadow>
          <boxGeometry args={[1.05, 1.75, 0.12]} />
          <meshStandardMaterial color={MARBLE} roughness={0.8} metalness={0.03} />
        </mesh>
        {/* the mallet, laid on the beam */}
        <mesh position={[0.55, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 8]} />
          <meshStandardMaterial color={TIMBER_DEEP} roughness={0.85} metalness={0.03} />
        </mesh>
        <mesh position={[0.55, 0.86, 0.16]} rotation={[1.1, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 5]} />
          <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* a chisel beside it */}
        <mesh position={[-0.45, 0.86, 0.02]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.22]} />
          <meshStandardMaterial color={PLINTH} roughness={0.72} metalness={0.05} />
        </mesh>
      </group>

      {/* ---- marble chips knocked across the working floor ---- */}
      {CHIPS.map((c, i) => (
        <mesh key={i} position={[c.x, 0.2 + c.s * 0.4, c.z]} rotation={[0, c.yaw, 0]}>
          <tetrahedronGeometry args={[c.s, 0]} />
          <meshStandardMaterial color={MARBLE_LIT} roughness={0.8} metalness={0.03} />
        </mesh>
      ))}

      {/* ---- chisel-dust motes, warm points adrift in the light ---- */}
      <group ref={motes}>
        {MOTES.map((m, i) => (
          <mesh key={i} position={[m.x, m.y, m.z]}>
            <octahedronGeometry args={[0.04, 0]} />
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={1.1}
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>

      {/* ---- the annex doorway: rough-cut jambs, a lintel, and the dark ---- */}
      <group position={[0.15, 0, -4.15]} rotation={[0, 0.06, 0]}>
        {/* threshold slab, half-buried */}
        <mesh position={[0, 0.06, 0.25]} receiveShadow>
          <boxGeometry args={[2.3, 0.12, 0.8]} />
          <meshStandardMaterial color={PLINTH} roughness={0.85} metalness={0.04} />
        </mesh>
        {/* left jamb — two rough courses, knocked off-line */}
        <mesh position={[-1.05, 0.8, 0]} castShadow>
          <boxGeometry args={[0.55, 1.6, 0.6]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} metalness={0.04} />
        </mesh>
        <mesh position={[-1.01, 2.15, 0]} rotation={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.46, 1.35, 0.5]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} metalness={0.04} />
        </mesh>
        {/* right jamb */}
        <mesh position={[1.05, 0.85, 0]} castShadow>
          <boxGeometry args={[0.5, 1.7, 0.55]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} metalness={0.04} />
        </mesh>
        <mesh position={[1.0, 2.3, 0]} rotation={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[0.44, 1.2, 0.48]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} metalness={0.04} />
        </mesh>
        {/* the lintel, settled a degree off level */}
        <mesh position={[0, 3.05, 0]} rotation={[0, 0, 0.025]} castShadow>
          <boxGeometry args={[2.75, 0.6, 0.6]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} metalness={0.04} />
        </mesh>
        {/* the unlit annex — a doorway of plain dark */}
        <mesh position={[0, 1.38, -0.05]}>
          <planeGeometry args={[1.65, 2.75]} />
          <meshBasicMaterial color={VOID} />
        </mesh>
        {/* rubble at the jamb feet */}
        <mesh position={[-1.35, 0.14, 0.45]} rotation={[0, 1.2, 0]}>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} metalness={0.04} />
        </mesh>
        <mesh position={[1.4, 0.11, 0.4]} rotation={[0, 2.6, 0]}>
          <dodecahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color={PLINTH} roughness={0.85} metalness={0.04} />
        </mesh>
      </group>

      {/* ---- the Unseen, ranged just outside the light ---- */}
      {UNSEEN.map((u, i) => (
        <UnseenFigure key={i} x={u.x} z={u.z} yaw={u.yaw} s={u.s} />
      ))}

      {/* ---- lights: constant count, dim, full tier only — the annex and its
           watchers stand beyond both pools, lit only by the sky ---- */}
      {!LOW_POWER ? (
        <>
          {/* the chisel-dust light pooled over the statues */}
          <pointLight
            position={[0, 3.4, 0.6]}
            color={SKY.glow}
            intensity={0.65}
            distance={8}
            decay={2}
          />
          {/* a warmer, dimmer note over the trestle corner */}
          <pointLight
            position={[2.4, 1.7, 1.5]}
            color={ACCENT}
            intensity={0.35}
            distance={5}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
