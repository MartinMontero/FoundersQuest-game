// src/game/setpieces/W8.tsx — World 8 "Launch — The Rocket" landmark: THE PAD.
// The destination of the whole journey, in miniature-diorama scale under a dawn
// sky: a wide low launch platform (two quarried decks, a scorch-dark center
// ring where past fire has licked the stone), THE ROCKET on its launch table —
// a composed hull (engine nozzle and skirt, lower and upper stages split by the
// story-spine band: a slightly-inset ring carrying small accent-emissive rune
// tabs, then a tapered interstage and nose cone with a red tip beacon), three
// swept fins and three hold-down clamps — and the GANTRY beside it: an open
// lattice tower (four posts, three beam levels, crossed braces), a railed top
// platform with a pulsing cyan beacon, and a service arm reaching across to
// collar the upper stage. Two floodlight posts angle their warm dawn heads at
// the hull; propellant tanks wait at the pad edge; cryo wisps drift at the base.
//
// Scenery only: no store reads/writes, no strings, no Html. Mounted inside a
// world <group>, so everything renders at LOCAL origin (footprint r <= 5.5,
// height <= 8) and reads from the spawn side (+z looking toward -z: floodlights
// frame the approach, the rocket rises center-left, the gantry stands behind-
// right with its arm across the sky). Placement is index-hashed (no
// Math.random) so every boot and screenshot is identical. Motion runs through
// useSafeFrame and settles fully static under `reduced`. Light count is
// CONSTANT (two point lights, full tier only) — no shader recompiles.

import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import { PALETTE } from '../materials'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

// ---- the Launch register: pale hull and warm concrete in bright dawn air ----

const SKY = skyForStage(8)
/** signature launch-cyan accent — the spine runes and beacon (stage 8) */
const ACCENT = SKY.accent

/** dawn-lit pad concrete — warm, quarried */
const PAD = '#9b9184'
/** the lower slab and shadowed courses */
const PAD_DIM = '#7d746a'
/** fire-licked stone under and around the launch table */
const SCORCH = '#1b1512'
/** the rocket's hull — pale, catching the dawn */
const HULL = '#ece6d8'
/** hull in shadow — skirt, nozzle collar, inset band */
const HULL_DIM = '#c8c0ae'
/** fin and clamp signal-paint — retro launch orange */
const FIN = '#c25c39'
/** gantry steel, cool against the warm pad */
const STEEL = '#5c6673'
const STEEL_DEEP = '#454d59'
/** the engine bell */
const NOZZLE = '#3c4048'

/** Deterministic 0..1 hash of an index — scatter without Math.random. */
function hash01(n: number): number {
  let h = Math.imul(n + 1, 2654435761)
  h = Math.imul(h ^ (h >>> 13), 1597334677)
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}

// ---- placement: rocket center-left, gantry behind-right, floods framing ----

/** the rocket's foot on the upper deck (deck top y 0.48) */
const ROCKET_POS: readonly [number, number, number] = [-1.05, 0.48, 0.35]
/** the gantry tower's foot */
const GANTRY_POS: readonly [number, number, number] = [1.85, 0.48, -0.55]
/** yaw that points the service arm's local +x from the tower at the hull */
const ARM_YAW = -2.84

/** three swept fins, offset so none points square at the gantry */
const FIN_ANGLES: readonly number[] = [0.6, 0.6 + (Math.PI * 2) / 3, 0.6 + (Math.PI * 4) / 3]
/** three hold-down clamps, staggered between the fins */
const CLAMP_ANGLES: readonly number[] = FIN_ANGLES.map((a) => a + Math.PI / 3)
/** six rune tabs ringing the story-spine band */
const TAB_ANGLES: readonly number[] = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2)

/** gantry beam levels (tower-local y) below the top platform */
const GANTRY_LEVELS: readonly number[] = [1.7, 3.1, 4.5]

/** two floodlight posts on the +z approach, yawed/tilted to aim at the hull */
const FLOODS: readonly { x: number; z: number; yaw: number; tilt: number }[] = [
  { x: 2.6, z: 2.9, yaw: 2.53, tilt: 0.22 },
  { x: -3.4, z: 2.2, yaw: 0.67, tilt: 0.2 },
]

/** two propellant tanks waiting at the pad edge */
const TANKS: readonly { x: number; z: number; s: number }[] = [
  { x: -3.3, z: -1.5, s: 1 },
  { x: -3.0, z: -2.6, s: 0.82 },
]

// ---- deterministic scatter: cryo wisps and scorch flecks (rocket-local) ----

interface WispSpec {
  x: number
  z: number
  y: number
  s: number
  phase: number
  speed: number
}

/** slow cryo vapor bleeding off the lower stage, adrift at the base */
const WISPS: readonly WispSpec[] = Array.from({ length: 4 }, (_, i) => {
  const a = hash01(i * 11 + 2) * Math.PI * 2
  const r = 0.8 + hash01(i * 11 + 3) * 0.5
  return {
    x: Math.cos(a) * r,
    z: Math.sin(a) * r,
    y: 0.7 + hash01(i * 11 + 4) * 0.9,
    s: 0.14 + hash01(i * 11 + 5) * 0.1,
    phase: hash01(i * 11 + 6) * Math.PI * 2,
    speed: 0.5 + hash01(i * 11 + 7) * 0.35,
  }
})

/** charred flecks thrown across the deck by earlier static fires */
const FLECKS: readonly { x: number; z: number; yaw: number; s: number }[] = Array.from(
  { length: 3 },
  (_, i) => {
    const a = hash01(i * 7 + 5) * Math.PI * 2
    const r = 1.75 + hash01(i * 7 + 6) * 0.55
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      yaw: hash01(i * 7 + 8) * Math.PI * 2,
      s: 0.07 + hash01(i * 7 + 9) * 0.06,
    }
  },
)

// ---- composed pieces ----

/** One swept fin: a signal-orange root blade and a smaller raked tip flare. */
function RocketFin({ angle }: { angle: number }): JSX.Element {
  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0.85, 1.55, 0]} rotation={[0, 0, 0.18]} castShadow>
        <boxGeometry args={[0.7, 1.3, 0.07]} />
        <meshStandardMaterial color={FIN} roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh position={[1.1, 1.0, 0]} rotation={[0, 0, 0.38]} castShadow>
        <boxGeometry args={[0.38, 0.5, 0.055]} />
        <meshStandardMaterial color={HULL_DIM} roughness={0.78} metalness={0.04} />
      </mesh>
    </group>
  )
}

/** One hold-down clamp leaning in against the skirt from the launch table. */
function HoldClamp({ angle }: { angle: number }): JSX.Element {
  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0.76, 0.72, 0]} rotation={[0, 0, 0.34]} castShadow>
        <boxGeometry args={[0.16, 0.72, 0.2]} />
        <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
      </mesh>
    </group>
  )
}

/** One floodlight post: pole, angled head housing, warm emissive lens. */
function Floodlight({ x, z, yaw, tilt }: { x: number; z: number; yaw: number; tilt: number }): JSX.Element {
  return (
    <group position={[x, 0.26, z]}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 2.5, 7]} />
        <meshStandardMaterial color={STEEL_DEEP} roughness={0.82} metalness={0.05} />
      </mesh>
      {/* the head, yawed toward the rocket and tilted up the hull */}
      <group position={[0, 2.55, 0]} rotation={[0, yaw, tilt]}>
        <mesh position={[0.26, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.3, 0.34]} />
          <meshStandardMaterial color={STEEL} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0.49, 0, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.28]} />
          <meshStandardMaterial
            color={SKY.glow}
            emissive={SKY.glow}
            emissiveIntensity={1.4}
            roughness={0.4}
            metalness={0.02}
          />
        </mesh>
      </group>
    </group>
  )
}

/** One propellant tank: a squat cylinder with a domed cap. */
function PropellantTank({ x, z, s }: { x: number; z: number; s: number }): JSX.Element {
  return (
    <group position={[x, 0.26, z]} scale={s}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 1.0, 10]} />
        <meshStandardMaterial color={HULL_DIM} roughness={0.78} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.0, 0]} scale={[1, 0.6, 1]} castShadow>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshStandardMaterial color={HULL} roughness={0.78} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ---- assembly ----

export function SetPieceW8({ reduced }: { reduced: boolean }): JSX.Element {
  const beacon = useRef<Group>(null)
  const tip = useRef<Mesh>(null)
  const wisps = useRef<Group>(null)

  // the gantry beacon breathes, the nose tip winks slower off-phase, and the
  // cryo wisps drift — all dead still under reduced motion (no shake, ever)
  useSafeFrame(({ clock }) => {
    const t = clock.elapsedTime
    const b = beacon.current
    if (b !== null) b.scale.setScalar(reduced ? 1 : 1 + Math.sin(t * 2.4) * 0.18)
    const n = tip.current
    if (n !== null) n.scale.setScalar(reduced ? 1 : 1 + Math.sin(t * 1.7 + 2.1) * 0.12)
    const g = wisps.current
    if (g !== null) {
      g.children.forEach((child, i) => {
        const w = WISPS[i]
        if (w === undefined) return
        child.position.y = reduced ? w.y : w.y + Math.sin(t * w.speed + w.phase) * 0.14
        child.rotation.y = reduced ? 0 : t * 0.3 + w.phase
      })
    }
  })

  return (
    <group>
      {/* ---- the launch platform: two quarried decks and a boarding step ---- */}
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 4.7, 0.26, 10]} />
        <meshStandardMaterial color={PAD_DIM} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.37, 0]} receiveShadow>
        <cylinderGeometry args={[3.6, 3.75, 0.22, 10]} />
        <meshStandardMaterial color={PAD} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0.3, 0.37, 3.95]} receiveShadow>
        <boxGeometry args={[1.4, 0.22, 0.85]} />
        <meshStandardMaterial color={PAD} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the scorch-dark center ring where past fire has licked the deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.05, 0.485, 0.35]}>
        <circleGeometry args={[1.55, 24]} />
        <meshStandardMaterial color={SCORCH} roughness={0.85} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.05, 0.487, 0.35]}>
        <ringGeometry args={[1.55, 2.1, 28]} />
        <meshBasicMaterial color={SCORCH} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* the inscribed perimeter ring, in the world's launch-cyan accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.49, 0]}>
        <ringGeometry args={[3.3, 3.44, 40]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* ---- THE ROCKET on its launch table ---- */}
      <group position={[ROCKET_POS[0], ROCKET_POS[1], ROCKET_POS[2]]} rotation={[0, 0.35, 0]}>
        {/* the launch table */}
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 1.1, 0.36, 9]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.82} metalness={0.05} />
        </mesh>
        {/* the engine bell, hung just clear of the table */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.26, 0.5, 0.55, 10]} />
          <meshStandardMaterial color={NOZZLE} roughness={0.72} metalness={0.05} />
        </mesh>
        {/* the flared engine skirt */}
        <mesh position={[0, 1.28, 0]} castShadow>
          <cylinderGeometry args={[0.58, 0.66, 0.55, 10]} />
          <meshStandardMaterial color={HULL_DIM} roughness={0.78} metalness={0.04} />
        </mesh>
        {/* lower stage */}
        <mesh position={[0, 2.25, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.56, 1.35, 12]} />
          <meshStandardMaterial color={HULL} roughness={0.75} metalness={0.04} />
        </mesh>
        {/* the story-spine band — a slightly-inset ring where the journey would
            engrave, faintly alight in the world's accent */}
        <mesh position={[0, 3.11, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.42, 12]} />
          <meshStandardMaterial
            color={HULL_DIM}
            emissive={ACCENT}
            emissiveIntensity={0.18}
            roughness={0.72}
            metalness={0.05}
          />
        </mesh>
        {/* six rune tabs ringing the band, flush with the hull line */}
        {TAB_ANGLES.map((a, i) => (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.53, 3.11, 0]}>
              <boxGeometry args={[0.1, 0.16, 0.06]} />
              <meshStandardMaterial
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={0.95}
                roughness={0.3}
                metalness={0.05}
              />
            </mesh>
          </group>
        ))}
        {/* upper stage */}
        <mesh position={[0, 3.985, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.56, 1.33, 12]} />
          <meshStandardMaterial color={HULL} roughness={0.75} metalness={0.04} />
        </mesh>
        {/* the interstage seam ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4.65, 0]}>
          <torusGeometry args={[0.56, 0.05, 8, 20]} />
          <meshStandardMaterial color={FIN} roughness={0.78} metalness={0.04} />
        </mesh>
        {/* the taper to the nose */}
        <mesh position={[0, 5.05, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.56, 0.8, 12]} />
          <meshStandardMaterial color={HULL} roughness={0.75} metalness={0.04} />
        </mesh>
        {/* the nose cone */}
        <mesh position={[0, 6.02, 0]} castShadow>
          <coneGeometry args={[0.4, 1.15, 12]} />
          <meshStandardMaterial color={HULL} roughness={0.75} metalness={0.04} />
        </mesh>
        {/* the tip mast and its red aviation beacon */}
        <mesh position={[0, 6.68, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.18, 6]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.78} metalness={0.05} />
        </mesh>
        <mesh ref={tip} position={[0, 6.84, 0]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial
            color={PALETTE.emberDeep}
            emissive={PALETTE.emberDeep}
            emissiveIntensity={1.2}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
        {/* three swept fins and three hold-down clamps, staggered */}
        {FIN_ANGLES.map((a, i) => (
          <RocketFin key={`fin-${i}`} angle={a} />
        ))}
        {CLAMP_ANGLES.map((a, i) => (
          <HoldClamp key={`clamp-${i}`} angle={a} />
        ))}
        {/* cryo vapor adrift at the base */}
        <group ref={wisps}>
          {WISPS.map((w, i) => (
            <mesh key={i} position={[w.x, w.y, w.z]} scale={[1.4, 0.8, 1.4]}>
              <sphereGeometry args={[w.s, 8, 8]} />
              <meshStandardMaterial
                color="#eaf2f5"
                transparent
                opacity={0.22}
                depthWrite={false}
                roughness={0.8}
                metalness={0}
              />
            </mesh>
          ))}
        </group>
        {/* charred flecks thrown across the deck */}
        {FLECKS.map((f, i) => (
          <mesh key={i} position={[f.x, 0.04 + f.s * 0.4, f.z]} rotation={[0, f.yaw, 0]}>
            <dodecahedronGeometry args={[f.s, 0]} />
            <meshStandardMaterial color={SCORCH} roughness={0.85} metalness={0.02} />
          </mesh>
        ))}
      </group>

      {/* ---- the GANTRY: open lattice tower, top platform, cyan beacon ---- */}
      <group position={[GANTRY_POS[0], GANTRY_POS[1], GANTRY_POS[2]]} rotation={[0, 0.12, 0]}>
        {/* foundation pad */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[1.6, 0.2, 1.6]} />
          <meshStandardMaterial color={PAD_DIM} roughness={0.85} metalness={0.03} />
        </mesh>
        {/* four corner posts */}
        {[-0.55, 0.55].map((px) =>
          [-0.55, 0.55].map((pz) => (
            <mesh key={`${px}-${pz}`} position={[px, 3.1, pz]} castShadow>
              <boxGeometry args={[0.09, 5.8, 0.09]} />
              <meshStandardMaterial color={STEEL} roughness={0.8} metalness={0.05} />
            </mesh>
          )),
        )}
        {/* three beam levels — a square frame at each */}
        {GANTRY_LEVELS.map((ly) => (
          <group key={ly}>
            {[-0.55, 0.55].map((pz) => (
              <mesh key={`x-${pz}`} position={[0, ly, pz]}>
                <boxGeometry args={[1.2, 0.07, 0.07]} />
                <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
              </mesh>
            ))}
            {[-0.55, 0.55].map((px) => (
              <mesh key={`z-${px}`} position={[px, ly, 0]}>
                <boxGeometry args={[0.07, 0.07, 1.2]} />
                <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
              </mesh>
            ))}
          </group>
        ))}
        {/* crossed braces on the approach face */}
        <mesh position={[0, 2.4, 0.55]} rotation={[0, 0, 0.72]}>
          <boxGeometry args={[0.06, 1.7, 0.06]} />
          <meshStandardMaterial color={STEEL} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0, 3.8, 0.55]} rotation={[0, 0, -0.72]}>
          <boxGeometry args={[0.06, 1.7, 0.06]} />
          <meshStandardMaterial color={STEEL} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* the top platform and its rails */}
        <mesh position={[0, 5.62, 0]} castShadow>
          <boxGeometry args={[1.5, 0.12, 1.5]} />
          <meshStandardMaterial color={STEEL} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0, 6.02, 0.72]}>
          <boxGeometry args={[1.5, 0.05, 0.05]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0.72, 6.02, 0]}>
          <boxGeometry args={[0.05, 0.05, 1.5]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* the beacon mast and its pulsing cyan lamp, haloed for the bloom */}
        <mesh position={[0, 5.98, 0]}>
          <cylinderGeometry args={[0.03, 0.045, 0.6, 6]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
        </mesh>
        <group ref={beacon} position={[0, 6.42, 0]}>
          <mesh>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={1.5}
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.26, 10, 10]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        </group>
      </group>

      {/* ---- the service arm, reaching from the tower to collar the hull ---- */}
      <group position={[GANTRY_POS[0], GANTRY_POS[1], GANTRY_POS[2]]} rotation={[0, ARM_YAW, 0]}>
        <mesh position={[1.15, 4.55, 0]} castShadow>
          <boxGeometry args={[2.3, 0.1, 0.14]} />
          <meshStandardMaterial color={STEEL} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* the diagonal strut bearing it */}
        <mesh position={[0.55, 4.15, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[1.3, 0.06, 0.06]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* the half-collar closed around the upper stage */}
        <mesh position={[3.04, 4.55, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <torusGeometry args={[0.64, 0.05, 6, 16, Math.PI]} />
          <meshStandardMaterial color={STEEL_DEEP} roughness={0.8} metalness={0.05} />
        </mesh>
      </group>

      {/* ---- two floodlight posts framing the approach ---- */}
      {FLOODS.map((f, i) => (
        <Floodlight key={i} x={f.x} z={f.z} yaw={f.yaw} tilt={f.tilt} />
      ))}

      {/* ---- propellant tanks waiting at the pad edge ---- */}
      {TANKS.map((t, i) => (
        <PropellantTank key={i} x={t.x} z={t.z} s={t.s} />
      ))}

      {/* ---- lights: constant count, dim, full tier only ---- */}
      {!LOW_POWER ? (
        <>
          {/* the warm dawn floodwash pooled on the hull */}
          <pointLight
            position={[-1.0, 3.4, 2.0]}
            color={SKY.glow}
            intensity={0.75}
            distance={9}
            decay={2}
          />
          {/* the cyan note at the gantry beacon */}
          <pointLight
            position={[1.85, 6.9, -0.55]}
            color={ACCENT}
            intensity={0.4}
            distance={6}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
