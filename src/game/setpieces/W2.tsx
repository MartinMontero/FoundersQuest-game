// src/game/setpieces/W2.tsx — World 2 Research (The Raven): THE FELLOWSHIP.
// A firelit clearing in the dusk forest, miniature-diorama scale: a low stone
// fire-bowl at center (the one warm ember note in an ink-dark world), four
// rough-hewn log/stone seats ringed around it, a bare-branched raven tree with
// small black corvid silhouettes perched on the snags, and the field-rules
// banner arch at the clearing edge — two dark posts, a crossbar, and a hanging
// paper-white banner (blank; the banner is scenery, no strings). Palette is
// ink-dark timber/stone with paper-white accents; the stage-2 sky accent
// (cold steel-blue) tints the inscribed ring and the arch gem. Pure scenery —
// no store reads/writes, no interaction, deterministic (index-hash scatter).
// Mounted at the SETPIECE_ANCHOR ([-8, 0, -14] since QA 2026-07-14); everything
// here is LOCAL-origin, footprint radius <= 5.5, height <= 8. Reads from the
// spawn side (+z looking toward -z). Trees/grass keep clear via their KEEPOUTs.

import { useRef } from 'react'
import { DoubleSide } from 'three'
import type { Group } from 'three'
import { GlowSprite, useFlame } from '../fx'
import { PALETTE } from '../materials'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

/** World 2's signature accent — cold corvid steel-blue (worldPalette stage 2). */
const ACCENT = skyForStage(2).accent

// ---- the ink-dark register (paper-white accents against near-black blues) ----
const INK = '#10141c' // clearing floor
const TIMBER = '#1e2531' // dark hewn wood — posts, logs, trunk
const TIMBER_DEEP = '#141a24' // branch/bark shadow tone
const STONE = '#2a3140' // cold dark stone
const STONE_LIT = '#39445a' // the hewn slab's lighter top
const PAPER = '#e7ecef' // paper-white — banner, cut end-grain
const RAVEN = '#0b0e14' // corvid silhouette black

/** Deterministic 0..1 hash of an index — scatter without Math.random. */
function hash01(n: number): number {
  let h = Math.imul(n + 1, 2654435761)
  h = Math.imul(h ^ (h >>> 13), 1597334677)
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}

// ---- the fellowship circle: four seats facing the fire ----

const SEAT_RADIUS = 1.75
const SEATS: readonly { angle: number; kind: 'log' | 'stone' }[] = [
  { angle: 0.45, kind: 'log' },
  { angle: 1.95, kind: 'stone' },
  { angle: 3.5, kind: 'log' },
  { angle: 5.0, kind: 'stone' },
]

// ---- the raven tree: a bent trunk and angular bare branches ----

interface BranchSpec {
  /** attach point on the trunk, tree-local */
  base: readonly [number, number, number]
  /** spin around the trunk */
  yaw: number
  /** lean away from vertical — sharp angles, a dead corvid snag */
  tilt: number
  len: number
}

const BRANCHES: readonly BranchSpec[] = [
  { base: [0.12, 1.25, -0.08], yaw: 2.6, tilt: 1.22, len: 1.15 },
  { base: [0.05, 1.75, 0.05], yaw: 0.4, tilt: 0.95, len: 1.55 },
  { base: [-0.08, 2.25, 0.06], yaw: 3.9, tilt: 0.8, len: 1.7 },
  { base: [0.1, 2.65, -0.05], yaw: 1.6, tilt: 0.62, len: 1.45 },
  { base: [-0.05, 3.05, 0.03], yaw: 5.2, tilt: 0.72, len: 1.3 },
  { base: [0.02, 3.35, 0], yaw: 2.1, tilt: 0.38, len: 1.05 },
]

/** A point `along` (0..1) a branch, tree-local — where a raven can perch.
 * Matches the branch's nested rotation: yaw about Y, then -tilt about Z. */
function perchPoint(b: BranchSpec, along: number): [number, number, number] {
  const d = b.len * along
  return [
    b.base[0] + Math.sin(b.tilt) * Math.cos(b.yaw) * d,
    b.base[1] + Math.cos(b.tilt) * d,
    b.base[2] - Math.sin(b.tilt) * Math.sin(b.yaw) * d,
  ]
}

/** Three small ravens on the snags: branch index, how far out, facing. */
const RAVENS: readonly { pos: [number, number, number]; yaw: number }[] = (
  [
    [1, 0.78, 0.7],
    [2, 0.88, 2.9],
    [4, 0.62, -1.8],
  ] as const
).flatMap(([branch, along, yaw]) => {
  const b = BRANCHES[branch]
  if (b === undefined) return []
  const [px, py, pz] = perchPoint(b, along)
  return [{ pos: [px, py + 0.04, pz] as [number, number, number], yaw }]
})

// ---- deterministic ground scatter: pale leaf-paper and dark rocks ----

const LEAVES: readonly { x: number; z: number; yaw: number; s: number }[] = Array.from(
  { length: 5 },
  (_, i) => {
    const a = hash01(i * 3 + 1) * Math.PI * 2
    const r = 2.3 + hash01(i * 3 + 2) * 2.3
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      yaw: hash01(i * 3 + 3) * Math.PI,
      s: 0.16 + hash01(i * 5 + 4) * 0.1,
    }
  },
)

const ROCKS: readonly { x: number; z: number; yaw: number; s: number }[] = Array.from(
  { length: 4 },
  (_, i) => {
    const a = hash01(i * 7 + 11) * Math.PI * 2
    const r = 2.1 + hash01(i * 7 + 12) * 2.2
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      yaw: hash01(i * 7 + 13) * Math.PI * 2,
      s: 0.13 + hash01(i * 7 + 14) * 0.12,
    }
  },
)

// ---- composed pieces ----

/** A tiny perched raven — cone body (tail swept back-up), sphere head, beak. */
function Raven({ pos, yaw }: { pos: [number, number, number]; yaw: number }): JSX.Element {
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      {/* body — tilted so the cone tip reads as the swept tail */}
      <mesh position={[0, 0.08, 0]} rotation={[-1.25, 0, 0]}>
        <coneGeometry args={[0.075, 0.22, 6]} />
        <meshStandardMaterial color={RAVEN} roughness={0.75} metalness={0.02} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.15, 0.09]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color={RAVEN} roughness={0.75} metalness={0.02} />
      </mesh>
      {/* beak */}
      <mesh position={[0, 0.14, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.02, 0.08, 5]} />
        <meshStandardMaterial color={STONE_LIT} roughness={0.72} metalness={0.05} />
      </mesh>
    </group>
  )
}

/** One rough seat: a hewn log (pale cut end-grain, a branch stub) or a stone
 * slab on a tapered base — long axis tangent to the circle, facing the fire. */
function Seat({ angle, kind, index }: { angle: number; kind: 'log' | 'stone'; index: number }): JSX.Element {
  const x = Math.cos(angle) * SEAT_RADIUS
  const z = Math.sin(angle) * SEAT_RADIUS
  const jitter = (hash01(index + 21) - 0.5) * 0.3
  return (
    <group position={[x, 0, z]} rotation={[0, angle + Math.PI / 2 + jitter, 0]}>
      {kind === 'log' ? (
        <>
          {/* the log body, laid on its side */}
          <mesh position={[0, 0.26, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.21, 0.25, 1.1, 7]} />
            <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
          </mesh>
          {/* pale cut end-grain — the paper-white accent on dark wood */}
          <mesh position={[0.56, 0.26, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 0.03, 7]} />
            <meshStandardMaterial color={PAPER} roughness={0.8} metalness={0.02} />
          </mesh>
          {/* a sawn-off branch stub */}
          <mesh position={[-0.28, 0.42, 0.1]} rotation={[0.5, 0, -0.3]}>
            <cylinderGeometry args={[0.05, 0.08, 0.26, 5]} />
            <meshStandardMaterial color={TIMBER_DEEP} roughness={0.85} metalness={0.03} />
          </mesh>
        </>
      ) : (
        <>
          {/* tapered stone base */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.42, 0.36, 6]} />
            <meshStandardMaterial color={STONE} roughness={0.85} metalness={0.04} />
          </mesh>
          {/* the hewn slab top */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.74, 0.14, 0.5]} />
            <meshStandardMaterial color={STONE_LIT} roughness={0.82} metalness={0.04} />
          </mesh>
        </>
      )}
    </group>
  )
}

/** ember coals heaped in the bowl */
const COALS: readonly [number, number, number][] = [
  [0.18, 0.56, 0.05],
  [-0.15, 0.55, 0.14],
  [0.02, 0.57, -0.18],
]

export function SetPieceW2({ reduced }: { reduced: boolean }): JSX.Element {
  const banner = useRef<Group>(null)
  // the LIVING flame (fx kit vertex-sway temperature-ramp shader — QA
  // 2026-07-14: the painted emissive cones read as MS-paint); the shader
  // animates itself via uTime and stands still under reduced motion
  const flameOuter = useFlame()
  const flameCore = useFlame({ base: PALETTE.amberBright })

  // the banner sways in a slow dusk wind — dead still under reduced motion
  useSafeFrame(({ clock }) => {
    const b = banner.current
    if (b !== null) b.rotation.x = reduced ? 0 : Math.sin(clock.elapsedTime * 1.1) * 0.07
  })

  return (
    <group>
      {/* ---- the clearing floor: an ink-dark trodden circle ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[5.2, 28]} />
        <meshStandardMaterial color={INK} roughness={0.85} metalness={0.02} />
      </mesh>
      {/* the inscribed fellowship ring, in the world's steel-blue accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[2.35, 2.5, 40]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* ---- the fire-bowl: the one warm note in the corvid dusk ---- */}
      <group>
        {/* plinth */}
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <cylinderGeometry args={[1.02, 1.12, 0.12, 9]} />
          <meshStandardMaterial color={STONE} roughness={0.85} metalness={0.04} />
        </mesh>
        {/* the carved bowl */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.4, 0.42, 9]} />
          <meshStandardMaterial color={STONE_LIT} roughness={0.82} metalness={0.04} />
        </mesh>
        {/* its stone lip */}
        <mesh position={[0, 0.53, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.06, 8, 18]} />
          <meshStandardMaterial color={STONE} roughness={0.85} metalness={0.04} />
        </mesh>
        {/* the ember bed */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.58, 0.58, 0.08, 12]} />
          <meshStandardMaterial
            color={PALETTE.emberDeep}
            emissive={PALETTE.ember}
            emissiveIntensity={0.85}
            roughness={0.8}
            metalness={0}
          />
        </mesh>
        {/* heaped coals */}
        {COALS.map(([cx, cy, cz], i) => (
          <mesh key={i} position={[cx, cy, cz]} rotation={[0, hash01(i + 41) * Math.PI, 0]}>
            <dodecahedronGeometry args={[0.1]} />
            <meshStandardMaterial
              color={PALETTE.emberDeep}
              emissive={PALETTE.ember}
              emissiveIntensity={1.0}
              roughness={0.8}
              metalness={0}
            />
          </mesh>
        ))}
        {/* the low flame — the LIVING shader, its glow riding above the bowl */}
        <group position={[0, 0.56, 0]}>
          <mesh material={flameOuter} position={[0, 0.3, 0]}>
            <coneGeometry args={[0.24, 0.66, 8, 4, true]} />
          </mesh>
          <mesh material={flameCore} position={[0, 0.24, 0]}>
            <coneGeometry args={[0.12, 0.46, 7, 4, true]} />
          </mesh>
          <GlowSprite position={[0, 0.42, 0]} color={PALETTE.amber} scale={1.2} opacity={0.5} pulse />
        </group>
      </group>

      {/* ---- four rough-hewn seats, ringed and facing the fire ---- */}
      {SEATS.map((seat, i) => (
        <Seat key={i} angle={seat.angle} kind={seat.kind} index={i} />
      ))}

      {/* ---- the raven tree: bent trunk, angular bare snags, perched birds ---- */}
      <group position={[-2.8, 0, -2.2]} rotation={[0, 0.7, 0]}>
        {/* root flare */}
        <mesh position={[0, 0.16, 0]} receiveShadow>
          <cylinderGeometry args={[0.32, 0.5, 0.34, 7]} />
          <meshStandardMaterial color={TIMBER_DEEP} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* lower trunk, leaning */}
        <mesh position={[0.03, 1.15, -0.02]} rotation={[0.06, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.17, 0.29, 2.1, 7]} />
          <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* upper trunk, bending harder — the corvid crook */}
        <mesh position={[-0.06, 2.95, 0.03]} rotation={[-0.05, 0, 0.16]} castShadow>
          <cylinderGeometry args={[0.08, 0.17, 1.7, 6]} />
          <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* bare angular branches */}
        {BRANCHES.map((b, i) => (
          <group key={i} position={[b.base[0], b.base[1], b.base[2]]} rotation={[0, b.yaw, 0]}>
            <group rotation={[0, 0, -b.tilt]}>
              <mesh position={[0, b.len / 2, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.055, b.len, 5]} />
                <meshStandardMaterial color={TIMBER_DEEP} roughness={0.85} metalness={0.03} />
              </mesh>
            </group>
          </group>
        ))}
        {/* the rookery — small black silhouettes on the snags */}
        {RAVENS.map((r, i) => (
          <Raven key={i} pos={r.pos} yaw={r.yaw} />
        ))}
      </group>

      {/* ---- the field-rules banner arch at the clearing edge ---- */}
      <group position={[3.1, 0, 2.3]} rotation={[0, -0.3, 0]}>
        {/* two dark posts with spiked finials */}
        {[-1.1, 1.1].map((px) => (
          <group key={px} position={[px, 0, 0]}>
            <mesh position={[0, 1.45, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.13, 2.9, 7]} />
              <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
            </mesh>
            <mesh position={[0, 3.02, 0]}>
              <coneGeometry args={[0.13, 0.3, 5]} />
              <meshStandardMaterial color={TIMBER_DEEP} roughness={0.82} metalness={0.03} />
            </mesh>
          </group>
        ))}
        {/* the crossbar */}
        <mesh position={[0, 2.72, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 2.5, 7]} />
          <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* hanging cords */}
        {[-0.48, 0.48].map((cx) => (
          <mesh key={cx} position={[cx, 2.62, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 4]} />
            <meshStandardMaterial color={STONE_LIT} roughness={0.8} metalness={0.04} />
          </mesh>
        ))}
        {/* the paper-white banner — blank cloth, hinged at the cords */}
        <group ref={banner} position={[0, 2.53, 0]}>
          <mesh position={[0, -0.7, 0]}>
            <planeGeometry args={[1.15, 1.35, 4, 1]} />
            <meshStandardMaterial
              color={PAPER}
              emissive={PAPER}
              emissiveIntensity={0.12}
              roughness={0.8}
              metalness={0.02}
              side={DoubleSide}
            />
          </mesh>
        </group>
        {/* the accent gem crowning the arch — the world's steel-blue signature */}
        <mesh position={[0, 2.95, 0]}>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.1}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* ---- deterministic scatter: pale leaf-paper drifts and dark rocks ---- */}
      {LEAVES.map((l, i) => (
        <mesh key={`leaf-${i}`} position={[l.x, 0.025, l.z]} rotation={[-Math.PI / 2, 0, l.yaw]}>
          <planeGeometry args={[l.s, l.s * 1.4]} />
          <meshStandardMaterial color={PAPER} roughness={0.85} metalness={0.02} />
        </mesh>
      ))}
      {ROCKS.map((r, i) => (
        <mesh key={`rock-${i}`} position={[r.x, r.s * 0.55, r.z]} rotation={[0, r.yaw, 0]}>
          <dodecahedronGeometry args={[r.s]} />
          <meshStandardMaterial color={STONE} roughness={0.85} metalness={0.04} />
        </mesh>
      ))}

      {/* ---- lights: constant count, dim, real tiers only ---- */}
      {!LOW_POWER ? (
        <>
          {/* the ember pool over the fire-bowl */}
          <pointLight
            position={[0, 1.1, 0]}
            color={PALETTE.ember}
            intensity={1.1}
            distance={7}
            decay={2}
          />
          {/* a cold steel-blue wash on the banner arch */}
          <pointLight
            position={[3.1, 2.6, 2.9]}
            color={ACCENT}
            intensity={0.45}
            distance={6}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
