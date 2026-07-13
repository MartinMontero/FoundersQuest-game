// src/game/setpieces/W4.tsx — World 4 "Testing — The Labyrinth" landmark:
// THE MAZE MOUTH. Two tall hedge-stone walls — dark green-grey megalith slabs,
// each hand-set with its own slight lean — form an entrance corridor that dead-
// ends five units in against a cross wall and turns hard left, hinting at the
// depth beyond; THE SEAL STONE — a waist-high engraved slab centred before the
// mouth, a stone-teal rune ring breathing on its face; and THE RED THREAD — a
// thin bright-red line unspooling from a bobbin at the seal stone's foot, down
// the corridor's centre, and around the turn where the walls swallow it. A
// small red glint travels the thread inward (still under reduced motion).
//
// Scenery only: no store reads/writes, no strings, no Html. Mounted inside a
// world <group>, so everything renders at LOCAL origin (footprint r <= 5.5,
// height <= 8) and reads from the spawn side (+z looking toward -z). Placement
// is index-hashed (no Math.random) so every boot and screenshot is identical.
// Motion runs through useSafeFrame and settles fully static under `reduced`.
// Light count is CONSTANT (two point lights, full tier only) — no recompiles.

import { useRef } from 'react'
import type { Mesh } from 'three'
import { PALETTE } from '../materials'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

// ---- the Labyrinth register: world-4 stone-teal over hedge-dark green-grey ----

const SKY = skyForStage(4)
/** signature stone-teal accent — the rune ring, the way-gems, the lichen veins */
const ACCENT = SKY.accent

/** hedge-stone — dark green-grey megaliths, never cold concrete */
const HEDGE = '#2f3d33'
const HEDGE_DEEP = '#232d26'
/** the lighter hewn cap-course tone */
const HEDGE_LIT = '#41544a'
/** moss crowning the slab tops */
const MOSS = '#3f5c42'
/** the seal stone's paler carved face */
const STONE_LIT = '#5b6a60'
/** the trodden labyrinth floor */
const FLOOR = '#1a2420'
/** worn flagstones along the approach */
const FLAG = '#39463f'
/** the red thread and its brighter travelling glint */
const THREAD = '#d8352b'
const THREAD_BRIGHT = '#ff5a44'

/** Deterministic 0..1 hash of an index — seeded scatter, identical every boot. */
function hashUnit(n: number): number {
  let h = 2166136261
  h = Math.imul(h ^ (n & 0xff), 16777619)
  h = Math.imul(h ^ ((n >> 8) & 0xff), 16777619)
  h = Math.imul(h ^ ((n >> 16) & 0xff), 16777619)
  return (h >>> 0) / 0xffffffff
}

// ---- the hedge-stone walls: four runs of hand-set megalith slabs ----
// Plan view (viewer at +z): two parallel runs make the entrance corridor; the
// left run stops short, a near cross wall picks up heading -x, and a far cross
// wall dead-ends the straight — together they read as one right-angle turn.

interface RunSpec {
  x0: number
  z0: number
  x1: number
  z1: number
  count: number
}

const RUNS: readonly RunSpec[] = [
  // right wall — runs deep, past the turn, forming the turn's outer face
  { x0: 1.62, z0: 1.35, x1: 1.55, z1: -3.7, count: 4 },
  // left wall — stops short where the corridor breaks left
  { x0: -1.62, z0: 1.35, x1: -1.55, z1: -1.2, count: 3 },
  // near cross wall — the turned corridor's near face, heading -x
  { x0: -1.9, z0: -1.5, x1: -3.9, z1: -1.55, count: 2 },
  // far cross wall — the slab face the straight corridor dead-ends into
  { x0: 0.9, z0: -3.85, x1: -3.0, z1: -3.9, count: 4 },
]

interface SlabSpec {
  x: number
  z: number
  yaw: number
  w: number
  h: number
  t: number
  leanX: number
  leanZ: number
  dark: boolean
  cap: boolean
  moss: boolean
  /** the two mouth-front slabs carry a small accent way-gem */
  gem: boolean
}

const SLABS: readonly SlabSpec[] = RUNS.flatMap((run, r) =>
  Array.from({ length: run.count }, (_, i): SlabSpec => {
    const f = run.count === 1 ? 0 : i / (run.count - 1)
    const dx = run.x1 - run.x0
    const dz = run.z1 - run.z0
    const len = Math.hypot(dx, dz)
    const spacing = run.count === 1 ? len : len / (run.count - 1)
    const seed = r * 101 + i * 13
    const gem = r < 2 && i === 0
    return {
      x: run.x0 + dx * f,
      z: run.z0 + dz * f,
      yaw: Math.atan2(-dz, dx) + (hashUnit(seed + 1) - 0.5) * 0.1,
      w: spacing * 1.06 + hashUnit(seed + 2) * 0.12,
      h: 4.0 + hashUnit(seed + 3) * 1.0,
      t: 0.5 + hashUnit(seed + 4) * 0.18,
      leanX: (hashUnit(seed + 5) - 0.5) * 0.07,
      leanZ: (hashUnit(seed + 6) - 0.5) * 0.09,
      dark: hashUnit(seed + 9) > 0.5,
      cap: gem ? true : hashUnit(seed + 7) > 0.42,
      moss: gem ? false : hashUnit(seed + 8) > 0.5,
      gem,
    }
  }),
)

/** One megalith slab with its optional cap-course, moss crown, and way-gem. */
function HedgeSlab({ spec }: { spec: SlabSpec }): JSX.Element {
  return (
    <group
      position={[spec.x, spec.h / 2 - 0.12, spec.z]}
      rotation={[spec.leanX, spec.yaw, spec.leanZ]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[spec.w, spec.h, spec.t]} />
        <meshStandardMaterial
          color={spec.dark ? HEDGE_DEEP : HEDGE}
          roughness={0.85}
          metalness={0.03}
        />
      </mesh>
      {spec.cap ? (
        <mesh position={[0, spec.h / 2 + 0.12, 0]} rotation={[0, spec.leanZ * 2, 0]} castShadow>
          <boxGeometry args={[spec.w * 0.78, 0.28, spec.t + 0.2]} />
          <meshStandardMaterial color={HEDGE_LIT} roughness={0.84} metalness={0.03} />
        </mesh>
      ) : null}
      {spec.moss ? (
        <mesh
          position={[spec.w * 0.12, spec.h / 2 + (spec.cap ? 0.3 : 0.08), 0]}
          scale={[1, 0.35, 1]}
        >
          <sphereGeometry args={[spec.t * 0.62, 8, 8]} />
          <meshStandardMaterial color={MOSS} roughness={0.85} metalness={0.02} />
        </mesh>
      ) : null}
      {spec.gem ? (
        <mesh position={[0, spec.h / 2 + 0.42, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.0}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
      ) : null}
    </group>
  )
}

// ---- lichen veins: faint teal seams glowing in the deep slab faces ----

const VEINS: readonly { pos: [number, number, number]; roll: number }[] = [
  { pos: [-0.55, 1.9, -3.52], roll: 0.42 },
  { pos: [0.5, 2.7, -3.55], roll: -0.3 },
  { pos: [1.28, 2.2, -0.9], roll: 0.35 },
]

// ---- the red thread: waypoints from the seal stone, in, and around the turn ----

const THREAD_PATH: readonly (readonly [number, number])[] = [
  [0.38, 3.18],
  [0.1, 1.7],
  [-0.06, 0.35],
  [0.09, -1.15],
  [-0.02, -2.5],
  [-1.35, -2.62],
  [-2.8, -2.55],
  [-3.65, -2.66],
]

interface ThreadSeg {
  mx: number
  mz: number
  len: number
  yaw: number
  x0: number
  z0: number
  ux: number
  uz: number
  /** distance along the whole thread where this segment starts */
  cum: number
}

function buildThreadSegs(): readonly ThreadSeg[] {
  const out: ThreadSeg[] = []
  let cum = 0
  for (let i = 0; i + 1 < THREAD_PATH.length; i += 1) {
    const a = THREAD_PATH[i]
    const b = THREAD_PATH[i + 1]
    if (a === undefined || b === undefined) continue
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const len = Math.hypot(dx, dz)
    out.push({
      mx: (a[0] + b[0]) / 2,
      mz: (a[1] + b[1]) / 2,
      len,
      yaw: Math.atan2(-dz, dx),
      x0: a[0],
      z0: a[1],
      ux: dx / len,
      uz: dz / len,
      cum,
    })
    cum += len
  }
  return out
}

const THREAD_SEGS: readonly ThreadSeg[] = buildThreadSegs()
const THREAD_LEN: number = THREAD_SEGS.reduce((t, s) => Math.max(t, s.cum + s.len), 0)

/** The x/z point a distance `d` along the thread polyline. */
function threadPoint(d: number): [number, number] {
  for (const s of THREAD_SEGS) {
    if (d <= s.cum + s.len) {
      const t = Math.max(0, d - s.cum)
      return [s.x0 + s.ux * t, s.z0 + s.uz * t]
    }
  }
  const last = THREAD_SEGS[THREAD_SEGS.length - 1]
  return last === undefined ? [0, 0] : [last.x0 + last.ux * last.len, last.z0 + last.uz * last.len]
}

/** where the glint rests under reduced motion — mid-corridor, mid-story */
const GLINT_REST: readonly [number, number] = threadPoint(0.22 * THREAD_LEN)

function RedThread({ reduced }: { reduced: boolean }): JSX.Element {
  const glint = useRef<Mesh>(null)

  // the glint walks the thread inward and winks out at the turn; dead still
  // under reduced motion (no shake, ever)
  useSafeFrame(({ clock }) => {
    const g = glint.current
    if (g === null) return
    if (reduced) {
      g.position.set(GLINT_REST[0], 0.09, GLINT_REST[1])
      g.scale.setScalar(1)
      return
    }
    const cycle = (clock.elapsedTime * 0.055) % 1
    const [gx, gz] = threadPoint(cycle * THREAD_LEN)
    g.position.set(gx, 0.09, gz)
    g.scale.setScalar(Math.max(0.001, Math.sqrt(Math.sin(Math.PI * cycle))))
  })

  return (
    <group>
      {/* the laid line — thin strips, joint-overlapped so the doglegs read taut */}
      {THREAD_SEGS.map((s, i) => (
        <mesh key={i} position={[s.mx, 0.045, s.mz]} rotation={[0, s.yaw, 0]}>
          <boxGeometry args={[s.len + 0.06, 0.024, 0.05]} />
          <meshStandardMaterial
            color={THREAD}
            emissive={THREAD}
            emissiveIntensity={0.6}
            roughness={0.72}
            metalness={0.02}
          />
        </mesh>
      ))}
      {/* the travelling glint */}
      <mesh ref={glint} position={[GLINT_REST[0], 0.09, GLINT_REST[1]]}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshStandardMaterial
          color={THREAD_BRIGHT}
          emissive={THREAD_BRIGHT}
          emissiveIntensity={1.6}
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>
    </group>
  )
}

// ---- the seal stone: a waist-high engraved slab before the mouth ----

function SealStone({ reduced }: { reduced: boolean }): JSX.Element {
  const ring = useRef<Mesh>(null)

  // the rune ring breathes in the world's stone-teal; steady under reduced
  useSafeFrame(({ clock }) => {
    const m = ring.current
    if (m === null) return
    const mat = m.material as { emissiveIntensity?: number }
    mat.emissiveIntensity = reduced ? 0.95 : 0.95 + Math.sin(clock.elapsedTime * 1.7) * 0.3
  })

  return (
    <group position={[0, 0, 3.0]} rotation={[0, 0.06, 0]}>
      {/* footing course */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <boxGeometry args={[1.7, 0.22, 0.85]} />
        <meshStandardMaterial color={HEDGE_DEEP} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the waist-high slab, leaning a breath toward the maze */}
      <mesh position={[0, 0.68, 0]} rotation={[-0.05, 0, 0.02]} castShadow>
        <boxGeometry args={[1.28, 0.95, 0.38]} />
        <meshStandardMaterial color={STONE_LIT} roughness={0.82} metalness={0.04} />
      </mesh>
      {/* engraved grooves banding the face */}
      <mesh position={[0, 0.3, 0.2]}>
        <boxGeometry args={[1.02, 0.03, 0.03]} />
        <meshStandardMaterial color={HEDGE_DEEP} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0, 1.06, 0.19]}>
        <boxGeometry args={[0.94, 0.03, 0.03]} />
        <meshStandardMaterial color={HEDGE_DEEP} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the rune ring, breathing on the face — the world's teal signature */}
      <mesh ref={ring} position={[0, 0.72, 0.22]} rotation={[-0.05, 0, 0]}>
        <torusGeometry args={[0.3, 0.035, 8, 24]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.95}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {/* its small carved heart */}
      <mesh position={[0, 0.72, 0.24]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.7}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {/* the thread bobbin resting at its foot — warm timber, red-wound */}
      <group position={[0.42, 0.1, 0.34]} rotation={[0, 0.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.26, 8]} />
          <meshStandardMaterial color={PALETTE.stoneWarm} roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.09, 0.032, 8, 16]} />
          <meshStandardMaterial
            color={THREAD}
            emissive={THREAD}
            emissiveIntensity={0.5}
            roughness={0.75}
            metalness={0.02}
          />
        </mesh>
      </group>
    </group>
  )
}

// ---- deterministic ground scatter: worn flagstones and fallen rubble ----

const FLAGSTONES: readonly { x: number; z: number; yaw: number; w: number; d: number }[] =
  Array.from({ length: 5 }, (_, i) => {
    const side = i % 2 === 0 ? 1 : -1
    return {
      x: side * (0.4 + hashUnit(i * 19 + 3) * 0.35),
      z: 2.3 - i * 1.15 + (hashUnit(i * 19 + 4) - 0.5) * 0.3,
      yaw: hashUnit(i * 19 + 5) * Math.PI,
      w: 0.55 + hashUnit(i * 19 + 6) * 0.3,
      d: 0.45 + hashUnit(i * 19 + 7) * 0.25,
    }
  })

const RUBBLE: readonly { x: number; z: number; yaw: number; tilt: number; s: number }[] =
  Array.from({ length: 6 }, (_, i) => {
    const a = hashUnit(i * 23 + 2) * Math.PI * 2
    const r = 2.4 + hashUnit(i * 23 + 5) * 2.4
    let x = Math.cos(a) * r
    const z = Math.sin(a) * r
    // keep the thread's line clear — corridor rubble hugs the wall feet instead
    if (Math.abs(x) < 0.9 && z > -2.6 && z < 3.4) {
      x = Math.sign(x || 1) * (1.05 + hashUnit(i * 23 + 7) * 0.25)
    }
    return {
      x,
      z,
      yaw: hashUnit(i * 23 + 9) * Math.PI * 2,
      tilt: (hashUnit(i * 23 + 13) - 0.5) * 0.5,
      s: 0.14 + hashUnit(i * 23 + 11) * 0.16,
    }
  })

// ---- assembly ----

export function SetPieceW4({ reduced }: { reduced: boolean }): JSX.Element {
  return (
    <group>
      {/* ---- the trodden labyrinth floor ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <circleGeometry args={[5.3, 28]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} metalness={0.02} />
      </mesh>
      {/* the faint inscribed ring around the seal stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 3.0]}>
        <ringGeometry args={[0.95, 1.08, 32]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {/* worn flagstones marching toward the mouth */}
      {FLAGSTONES.map((f, i) => (
        <mesh key={`flag-${i}`} position={[f.x, 0.03, f.z]} rotation={[0, f.yaw, 0]}>
          <boxGeometry args={[f.w, 0.05, f.d]} />
          <meshStandardMaterial color={FLAG} roughness={0.85} metalness={0.03} />
        </mesh>
      ))}

      {/* ---- the maze mouth: four runs of hand-set hedge-stone megaliths ---- */}
      {SLABS.map((slab, i) => (
        <HedgeSlab key={`slab-${i}`} spec={slab} />
      ))}
      {/* the corner post where the left wall breaks into the turn */}
      <mesh position={[-1.72, 2.15, -1.42]} rotation={[0.03, 0.5, -0.04]} castShadow>
        <boxGeometry args={[0.72, 4.55, 0.72]} />
        <meshStandardMaterial color={HEDGE} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* a broken half-slab, fallen against the right wall's outer face */}
      <mesh position={[2.6, 0.75, 0.6]} rotation={[0, 0.3, 1.05]} castShadow>
        <boxGeometry args={[1.0, 2.2, 0.4]} />
        <meshStandardMaterial color={HEDGE_DEEP} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* lichen veins — faint teal seams in the deep slab faces */}
      {VEINS.map((v, i) => (
        <mesh key={`vein-${i}`} position={v.pos} rotation={[0, 0, v.roll]}>
          <boxGeometry args={[0.045, 0.66, 0.045]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.7}
            roughness={0.75}
            metalness={0.02}
          />
        </mesh>
      ))}

      {/* ---- the seal stone and the red thread it anchors ---- */}
      <SealStone reduced={reduced} />
      <RedThread reduced={reduced} />

      {/* ---- fallen rubble at the wall feet ---- */}
      {RUBBLE.map((r, i) => (
        <mesh
          key={`rock-${i}`}
          position={[r.x, r.s * 0.55, r.z]}
          rotation={[r.tilt, r.yaw, r.tilt * 0.6]}
          castShadow
        >
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color={HEDGE_DEEP} roughness={0.85} metalness={0.03} />
        </mesh>
      ))}

      {/* ---- lights: constant count, dim, real tiers only ---- */}
      {!LOW_POWER ? (
        <>
          {/* a teal pool over the seal stone's rune ring */}
          <pointLight
            position={[0, 1.7, 3.0]}
            color={ACCENT}
            intensity={0.7}
            distance={6}
            decay={2}
          />
          {/* a dim breath of the same stone-teal banked inside the turn — depth */}
          <pointLight
            position={[-0.6, 2.1, -2.4]}
            color={ACCENT}
            intensity={0.5}
            distance={7}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
