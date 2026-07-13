// src/game/setpieces/W7.tsx — World 7 "Implementation — The Bridge" landmark:
// THE ROPE BRIDGE. One suspended span segment over a dark chasm-crack, caught
// in morning light. Two heavy timber A-frame pylons carry four swagged rope
// lines (hand ropes above, carrier ropes below); a walkway of individual
// planks — each laid at its own slight jitter — hangs between them over the
// dark recessed crack. ONE plank is visibly wrong: the SPOF plank, cracked
// into two offset halves, scorched dark, a faint warning-ember glowing up
// through the break. Back-stay ropes anchor each pylon to a ground stake, and
// broken stone lips and boulders ring the crack's rim.
//
// Scenery only: no store reads/writes, no strings, no Html. Mounted inside a
// world <group>, so everything renders at LOCAL origin (footprint r <= 5.5,
// height <= 8) and reads from the spawn side (+z looking toward -z) — the span
// runs left-right across that view, the crack running away beneath it.
// Placement is index-hashed (no Math.random) so every boot and screenshot is
// identical. Motion runs through useSafeFrame and settles fully static under
// `reduced`. Light count is CONSTANT (two point lights, full tier only).

import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import { PALETTE } from '../materials'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

// ---- the Bridge register: world-7 hopeful-dawn gold over warm timber ----

const SKY = skyForStage(7)
/** signature morning-gold accent — the pylon beacons and the dawn light */
const ACCENT = SKY.accent
/** the low warm horizon tone — morning catching the pylon saddles */
const DAWN = SKY.horizon

/** heavy pylon timber, morning-warm */
const TIMBER = '#7a5a3e'
const TIMBER_DARK = '#5c4330'
/** walkway planks — two weathered tones so the deck reads hand-laid */
const PLANK = '#8a6a48'
const PLANK_PALE = '#9d7d58'
/** the SPOF plank — scorched near-black, the one wrong board */
const SPOF_WOOD = '#33241c'
/** pale hemp rope */
const ROPE = '#b08d62'
/** broken stone at the crack's rim */
const STONE = '#8f7c60'
const STONE_DARK = '#6e5e48'
/** the chasm void — depthless dark, never lit */
const VOID = '#0b0910'
const VOID_DEEP = '#060509'

/** Deterministic 0..1 hash of an index — seeded scatter, identical every boot. */
function hash01(n: number): number {
  let h = Math.imul(n + 1, 2654435761)
  h = Math.imul(h ^ (h >>> 13), 1597334677)
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}

// ---- the span's sag: shallow catenary-ish parabolas, anchored at the pylons ----

/** half-span — the rope anchors sit at x = ±HALF on the pylon saddles */
const HALF = 3.45

/** walkway height along the span (1.16 at the pylons, sagging to 0.76 mid) */
function deckY(x: number): number {
  return 1.16 - 0.4 * (1 - (x / HALF) * (x / HALF))
}

/** hand-rope height along the span — deeper swag than the deck */
function railY(x: number): number {
  return 2.2 - 0.72 * (1 - (x / HALF) * (x / HALF))
}

// ---- rope lines: thin cylinder segments laid along the swag curves ----

const ROPE_SEGMENTS = 7

interface RopeSeg {
  x: number
  y: number
  z: number
  /** rotation about Z aligning the segment to the local rope slope */
  tilt: number
  len: number
}

/** chop one swagged rope line into straight segments along its curve */
function swag(yAt: (x: number) => number, z: number, drop: number): readonly RopeSeg[] {
  return Array.from({ length: ROPE_SEGMENTS }, (_, i) => {
    const ax = -HALF + (2 * HALF * i) / ROPE_SEGMENTS
    const bx = -HALF + (2 * HALF * (i + 1)) / ROPE_SEGMENTS
    const ay = yAt(ax) - drop
    const by = yAt(bx) - drop
    return {
      x: (ax + bx) / 2,
      y: (ay + by) / 2,
      z,
      tilt: Math.atan2(by - ay, bx - ax) - Math.PI / 2,
      len: Math.hypot(bx - ax, by - ay) + 0.03,
    }
  })
}

/** two hand ropes above, two carrier ropes riding just under the plank ends */
const ROPES: readonly RopeSeg[] = [
  ...swag(railY, 0.72, 0),
  ...swag(railY, -0.72, 0),
  ...swag(deckY, 0.66, 0.08),
  ...swag(deckY, -0.66, 0.08),
]

/** vertical suspender cords tying the hand ropes down to the deck */
const SUSPENDERS: readonly { x: number; z: number; y: number; len: number }[] = [
  -2.35, 0, 2.35,
].flatMap((x) =>
  [0.69, -0.69].map((z) => {
    const lo = deckY(x)
    const hi = railY(x)
    return { x, z, y: (lo + hi) / 2, len: hi - lo }
  }),
)

// ---- the walkway: individual planks, each at its own slight jitter ----

const PLANK_COUNT = 13
/** the one wrong board — just past the span's centre, on the walker's line */
const SPOF_INDEX = 8

function plankX(i: number): number {
  return -3 + i * 0.5
}

interface PlankSpec {
  x: number
  y: number
  yaw: number
  roll: number
  len: number
  pale: boolean
}

const PLANKS: readonly PlankSpec[] = Array.from({ length: PLANK_COUNT }, (_, i) => ({
  x: plankX(i),
  y: deckY(plankX(i)) + 0.03 + (hash01(i * 5 + 1) - 0.5) * 0.02,
  yaw: (hash01(i * 5 + 2) - 0.5) * 0.13,
  roll: (hash01(i * 5 + 3) - 0.5) * 0.09,
  len: 1.42 + hash01(i * 5 + 4) * 0.14,
  pale: hash01(i * 5 + 5) > 0.55,
})).filter((_, i) => i !== SPOF_INDEX)

const SPOF_X = plankX(SPOF_INDEX)
const SPOF_Y = deckY(SPOF_X) + 0.03

// ---- the chasm rim: broken stone lips and boulders along the crack ----

const LIP_SLABS: readonly {
  x: number
  z: number
  yaw: number
  tip: number
  w: number
  d: number
}[] = Array.from({ length: 4 }, (_, i) => ({
  x: (i % 2 === 0 ? 1 : -1) * (1.42 + hash01(i * 11 + 3) * 0.25),
  z: (i < 2 ? 1.6 : -1.9) + (hash01(i * 11 + 4) - 0.5) * 1.6,
  yaw: (hash01(i * 11 + 5) - 0.5) * 0.5,
  tip: (i % 2 === 0 ? 1 : -1) * (0.05 + hash01(i * 11 + 6) * 0.07),
  w: 0.85 + hash01(i * 11 + 7) * 0.5,
  d: 2.0 + hash01(i * 11 + 8) * 1.1,
}))

const RIM_ROCKS: readonly { x: number; z: number; s: number; yaw: number; tilt: number }[] =
  Array.from({ length: 6 }, (_, i) => ({
    x: (i % 2 === 0 ? 1 : -1) * (1.55 + hash01(i * 7 + 2) * 0.55),
    z: -3.8 + hash01(i * 7 + 3) * 7.4,
    s: 0.16 + hash01(i * 7 + 4) * 0.18,
    yaw: hash01(i * 7 + 5) * Math.PI * 2,
    tilt: (hash01(i * 7 + 6) - 0.5) * 0.5,
  }))

// ---- back-stays: one rope from each pylon apex down to a ground stake ----

const STAYS: readonly { side: number; x: number; y: number; tilt: number; len: number }[] = [
  1, -1,
].map((side) => {
  const ax = side * 3.7
  const ay = 3.28
  const bx = side * 4.5
  const by = 0.42
  return {
    side,
    x: (ax + bx) / 2,
    y: (ay + by) / 2,
    tilt: Math.atan2(by - ay, bx - ax) - Math.PI / 2,
    len: Math.hypot(bx - ax, by - ay),
  }
})

// ---- one heavy timber A-frame pylon (legs spread along z, saddle on top) ----

function Pylon({ x }: { x: number }): JSX.Element {
  return (
    <group position={[x, 0, 0]}>
      {/* the two legs, leaning together to the apex */}
      <mesh position={[0, 1.65, 0.475]} rotation={[-0.28, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 3.45, 7]} />
        <meshStandardMaterial color={TIMBER} roughness={0.82} metalness={0.03} />
      </mesh>
      <mesh position={[0, 1.65, -0.475]} rotation={[0.28, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 3.45, 7]} />
        <meshStandardMaterial color={TIMBER} roughness={0.82} metalness={0.03} />
      </mesh>
      {/* the lashed crossbar at deck height */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 1.35]} />
        <meshStandardMaterial color={TIMBER_DARK} roughness={0.84} metalness={0.03} />
      </mesh>
      {/* the apex saddle beam the ropes ride over — morning catches its face */}
      <mesh position={[0, 3.32, 0]} castShadow>
        <boxGeometry args={[0.3, 0.24, 0.85]} />
        <meshStandardMaterial
          color={TIMBER_DARK}
          emissive={DAWN}
          emissiveIntensity={0.15}
          roughness={0.82}
          metalness={0.03}
        />
      </mesh>
      {/* the dawn beacon crowning the frame */}
      <mesh position={[0, 3.55, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.0}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      {/* footing stones under each leg */}
      <mesh position={[0, 0.12, 0.95]} receiveShadow>
        <cylinderGeometry args={[0.24, 0.32, 0.24, 7]} />
        <meshStandardMaterial color={STONE} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.12, -0.95]} receiveShadow>
        <cylinderGeometry args={[0.24, 0.32, 0.24, 7]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.85} metalness={0.03} />
      </mesh>
    </group>
  )
}

// ---- assembly ----

export function SetPieceW7({ reduced }: { reduced: boolean }): JSX.Element {
  const span = useRef<Group>(null)
  const emberGlow = useRef<Mesh>(null)

  // the whole hung span sways as one — a slow breath of wind; the SPOF ember
  // pulses beneath the broken plank. Both dead still under reduced motion.
  useSafeFrame(({ clock }) => {
    const t = clock.elapsedTime
    const s = span.current
    if (s !== null) s.rotation.x = reduced ? 0 : Math.sin(t * 0.55) * 0.012
    const m = emberGlow.current
    if (m !== null) {
      const mat = m.material as { opacity?: number }
      mat.opacity = reduced ? 0.3 : 0.24 + Math.sin(t * 2.3) * 0.09
    }
  })

  return (
    <group>
      {/* ---- the chasm: a dark recessed crack running away beneath the span ---- */}
      <mesh position={[0.06, 0.025, 0]} rotation={[0, 0.06, 0]}>
        <boxGeometry args={[2.3, 0.05, 9.4]} />
        <meshBasicMaterial color={VOID} />
      </mesh>
      <mesh position={[-0.04, 0.032, 0.3]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[1.55, 0.05, 8.2]} />
        <meshBasicMaterial color={VOID_DEEP} />
      </mesh>
      {/* broken stone lips settling over the crack's edges */}
      {LIP_SLABS.map((s, i) => (
        <mesh
          key={`lip-${i}`}
          position={[s.x, 0.07, s.z]}
          rotation={[0, s.yaw, s.tip]}
          receiveShadow
        >
          <boxGeometry args={[s.w, 0.14, s.d]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? STONE : STONE_DARK}
            roughness={0.85}
            metalness={0.03}
          />
        </mesh>
      ))}
      {/* boulders scattered along the rim */}
      {RIM_ROCKS.map((r, i) => (
        <mesh
          key={`rock-${i}`}
          position={[r.x, r.s * 0.55, r.z]}
          rotation={[r.tilt, r.yaw, r.tilt * 0.6]}
          castShadow
        >
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.85} metalness={0.03} />
        </mesh>
      ))}

      {/* ---- the two A-frame pylons and their back-stays ---- */}
      <Pylon x={-3.7} />
      <Pylon x={3.7} />
      {STAYS.map((s) => (
        <group key={`stay-${s.side}`}>
          <mesh position={[s.x, s.y, 0]} rotation={[0, 0, s.tilt]}>
            <cylinderGeometry args={[0.022, 0.022, s.len, 5]} />
            <meshStandardMaterial color={ROPE} roughness={0.85} metalness={0.02} />
          </mesh>
          <mesh position={[s.side * 4.5, 0.22, 0]} rotation={[0, 0, s.side * -0.25]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.5, 6]} />
            <meshStandardMaterial color={TIMBER_DARK} roughness={0.84} metalness={0.03} />
          </mesh>
        </group>
      ))}

      {/* ---- the hung span: ropes, suspenders, planks — sways as one ---- */}
      <group ref={span}>
        {/* four swagged rope lines: hand ropes above, carriers under the deck */}
        {ROPES.map((s, i) => (
          <mesh key={`rope-${i}`} position={[s.x, s.y, s.z]} rotation={[0, 0, s.tilt]}>
            <cylinderGeometry args={[0.028, 0.028, s.len, 5]} />
            <meshStandardMaterial color={ROPE} roughness={0.85} metalness={0.02} />
          </mesh>
        ))}
        {/* suspender cords */}
        {SUSPENDERS.map((s, i) => (
          <mesh key={`susp-${i}`} position={[s.x, s.y, s.z]}>
            <cylinderGeometry args={[0.016, 0.016, s.len, 5]} />
            <meshStandardMaterial color={ROPE} roughness={0.85} metalness={0.02} />
          </mesh>
        ))}
        {/* the walkway planks, each laid at its own slight jitter */}
        {PLANKS.map((p, i) => (
          <mesh
            key={`plank-${i}`}
            position={[p.x, p.y, 0]}
            rotation={[p.roll, p.yaw, 0]}
            castShadow
          >
            <boxGeometry args={[0.34, 0.06, p.len]} />
            <meshStandardMaterial
              color={p.pale ? PLANK_PALE : PLANK}
              roughness={0.84}
              metalness={0.03}
            />
          </mesh>
        ))}

        {/* ---- the SPOF plank: cracked in two offset halves, scorched dark,
             a warning ember glowing up through the break ---- */}
        <mesh position={[SPOF_X, SPOF_Y - 0.04, 0.38]} rotation={[0.1, 0.08, 0.02]} castShadow>
          <boxGeometry args={[0.34, 0.055, 0.66]} />
          <meshStandardMaterial
            color={SPOF_WOOD}
            emissive={PALETTE.emberDeep}
            emissiveIntensity={0.18}
            roughness={0.86}
            metalness={0.02}
          />
        </mesh>
        <mesh position={[SPOF_X + 0.03, SPOF_Y, -0.4]} rotation={[-0.06, -0.05, 0]} castShadow>
          <boxGeometry args={[0.34, 0.055, 0.66]} />
          <meshStandardMaterial
            color={SPOF_WOOD}
            emissive={PALETTE.emberDeep}
            emissiveIntensity={0.18}
            roughness={0.86}
            metalness={0.02}
          />
        </mesh>
        {/* the faint ember underglow, pulsing up through the crack */}
        <mesh
          ref={emberGlow}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[SPOF_X, SPOF_Y - 0.07, 0]}
        >
          <planeGeometry args={[0.72, 1.5]} />
          <meshBasicMaterial color={PALETTE.ember} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      </group>

      {/* ---- lights: constant count, dim, full tier only ---- */}
      {!LOW_POWER ? (
        <>
          {/* morning-gold warmth pooled over the crossing */}
          <pointLight
            position={[0, 4.4, 1.4]}
            color={ACCENT}
            intensity={0.65}
            distance={10}
            decay={2}
          />
          {/* the warning ember breathing under the SPOF plank */}
          <pointLight
            position={[SPOF_X, 0.4, 0]}
            color={PALETTE.ember}
            intensity={0.55}
            distance={3.5}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
