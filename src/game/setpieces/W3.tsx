// src/game/setpieces/W3.tsx — World 3 "Prototyping — The Phoenix" landmark:
// THE FORGE + PYRE. A charcoal blocky forge with a glowing ember mouth and a
// hand-stacked chimney; an anvil on a stump before it; to the side THE PYRE —
// a raised fire-bowl of charcoal logs under tall ember flame cones with spark
// motes drifting upward; and apart from all the fire, the SPARK OF JOY — one
// single warm lantern on a slender post, deliberately alone.
//
// Scenery only: no store reads/writes, no strings, no Html. Mounted inside a
// world <group>, so everything renders at LOCAL origin (footprint r <= 5.5,
// height <= 8) and reads from the spawn side (+z looking toward -z). Placement
// is index-hashed (no Math.random) so every boot and screenshot is identical.
// Motion runs through useSafeFrame and settles fully static under `reduced`.
// Light count is CONSTANT (two point lights, full tier only) — no recompiles.

import { useRef } from 'react'
import type { Group } from 'three'
import { GlowSprite, useFlame } from '../fx'
import { PALETTE } from '../materials'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

// ---- the Phoenix register: world-3 sky accents over charcoal ----

const SKY = skyForStage(3)
/** signature ember accent (matches PALETTE.ember) */
const EMBER = SKY.accent
/** the forge-glow orange banked into the world-3 sky */
const FLAME = SKY.glow
/** the world's gilded aurora tone — every third spark flies gold */
const SPARK_GOLD = SKY.aurora

/** charcoal masses — the canyon's burnt stone, never cold grey */
const CHARCOAL = '#26191b'
const CHARCOAL_DARK = '#180f12'
const SOOT = '#332327'
/** cold-iron anvil (matte — the art law keeps metalness near zero) */
const IRON = '#332e36'
/** warm scorched timber for the stump and the lantern post */
const TIMBER = '#6b5442'

/** Deterministic 0..1 hash of an index — seeded scatter, identical every boot. */
function hashUnit(n: number): number {
  let h = 2166136261
  h = Math.imul(h ^ (n & 0xff), 16777619)
  h = Math.imul(h ^ ((n >> 8) & 0xff), 16777619)
  h = Math.imul(h ^ ((n >> 16) & 0xff), 16777619)
  return (h >>> 0) / 0xffffffff
}

// ---- the pyre's spark motes (index-hashed, drift upward on the frame loop) ----

/** how far a spark climbs above the ember bed before it winks out */
const SPARK_RISE = 1.85

interface SparkSpec {
  angle: number
  radius: number
  speed: number
  phase: number
  size: number
  gold: boolean
}

const SPARKS: readonly SparkSpec[] = Array.from({ length: 9 }, (_, i) => ({
  angle: hashUnit(i * 7 + 1) * Math.PI * 2,
  radius: 0.12 + hashUnit(i * 13 + 5) * 0.3,
  speed: 0.55 + hashUnit(i * 3 + 2) * 0.5,
  phase: hashUnit(i * 11 + 3),
  size: 0.035 + hashUnit(i * 5 + 4) * 0.03,
  gold: i % 3 === 0,
}))

/** a spark shrinks away over the last stretch of its climb */
function sparkFade(cycle: number): number {
  return Math.max(0.001, cycle < 0.82 ? 1 : 1 - (cycle - 0.82) / 0.18)
}

// ---- scattered ember boulders ringing the site (charcoal, some still lit) ----

interface RockSpec {
  x: number
  z: number
  size: number
  tilt: number
  yaw: number
  lit: boolean
}

const EMBER_ROCKS: readonly RockSpec[] = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * Math.PI * 2 + 0.85 + hashUnit(i * 17 + 9) * 0.45
  const radius = 4.0 + hashUnit(i * 23 + 4) * 0.9
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
    size: 0.2 + hashUnit(i * 29 + 7) * 0.24,
    tilt: (hashUnit(i * 31 + 2) - 0.5) * 0.5,
    yaw: hashUnit(i * 41 + 6) * Math.PI * 2,
    lit: i % 3 === 0,
  }
})

// ---- the forge: a charcoal blocky mass, ember mouth toward the spawn side ----

function Forge(): JSX.Element {
  return (
    <group position={[0, 0, -2.4]} rotation={[0, 0.04, 0]}>
      {/* stepped foundation slabs */}
      <mesh position={[0, 0.15, 0]} rotation={[0, -0.03, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.3, 2.8]} />
        <meshStandardMaterial color={CHARCOAL_DARK} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.3, 2.4]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the main burnt-stone mass */}
      <mesh position={[0, 1.35, 0]} rotation={[0, 0.02, 0.01]} castShadow>
        <boxGeometry args={[2.4, 1.7, 1.9]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.82} metalness={0.04} />
      </mesh>
      {/* shoulder buttresses, hand-set and tilted */}
      <mesh position={[-1.42, 0.95, 0.1]} rotation={[0.03, 0.18, 0.08]} castShadow>
        <boxGeometry args={[0.85, 1.15, 1.6]} />
        <meshStandardMaterial color={SOOT} roughness={0.84} metalness={0.03} />
      </mesh>
      <mesh position={[1.44, 0.9, -0.08]} rotation={[-0.02, -0.22, -0.07]} castShadow>
        <boxGeometry args={[0.8, 1.05, 1.5]} />
        <meshStandardMaterial color={SOOT} roughness={0.84} metalness={0.03} />
      </mesh>
      {/* crowning cap slab */}
      <mesh position={[0.08, 2.32, 0]} rotation={[0, -0.06, 0]} castShadow>
        <boxGeometry args={[2.05, 0.35, 1.75]} />
        <meshStandardMaterial color={CHARCOAL_DARK} roughness={0.85} metalness={0.03} />
      </mesh>

      {/* the ember mouth — jambs, lintel, and the glow banked inside */}
      <mesh position={[-0.58, 0.85, 0.97]} castShadow>
        <boxGeometry args={[0.3, 1.0, 0.26]} />
        <meshStandardMaterial color={SOOT} roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh position={[0.58, 0.85, 0.97]} castShadow>
        <boxGeometry args={[0.3, 1.0, 0.26]} />
        <meshStandardMaterial color={SOOT} roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh position={[0, 1.44, 0.98]} rotation={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[1.5, 0.3, 0.3]} />
        <meshStandardMaterial color={CHARCOAL_DARK} roughness={0.82} metalness={0.04} />
      </mesh>
      {/* the hearth glow — the mouth reads lit from across the canyon */}
      <mesh position={[0, 0.82, 0.93]}>
        <boxGeometry args={[0.86, 0.78, 0.14]} />
        <meshStandardMaterial
          color={FLAME}
          emissive={EMBER}
          emissiveIntensity={1.5}
          roughness={0.72}
          metalness={0.02}
          toneMapped={false}
        />
      </mesh>
      {/* the coal bed spilling at the sill */}
      <mesh position={[0, 0.4, 1.06]}>
        <boxGeometry args={[0.92, 0.14, 0.3]} />
        <meshStandardMaterial
          color={PALETTE.amber}
          emissive={PALETTE.amberBright}
          emissiveIntensity={1.1}
          roughness={0.75}
          metalness={0.02}
        />
      </mesh>
      {/* ember seams — heat cracking through the charcoal face */}
      <mesh position={[-0.86, 1.15, 0.96]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.05, 0.55, 0.05]} />
        <meshStandardMaterial
          color={EMBER}
          emissive={EMBER}
          emissiveIntensity={0.9}
          roughness={0.75}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[0.94, 1.7, 0.96]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.05, 0.42, 0.05]} />
        <meshStandardMaterial
          color={EMBER}
          emissive={EMBER}
          emissiveIntensity={0.9}
          roughness={0.75}
          metalness={0.02}
        />
      </mesh>

      {/* the chimney — three hand-stacked courses, ember-lit at the throat */}
      <mesh position={[-0.62, 3.0, -0.42]} rotation={[0, 0.12, 0.015]} castShadow>
        <boxGeometry args={[0.98, 1.15, 0.98]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.84} metalness={0.03} />
      </mesh>
      <mesh position={[-0.6, 4.1, -0.4]} rotation={[0, -0.1, -0.02]} castShadow>
        <boxGeometry args={[0.82, 1.2, 0.82]} />
        <meshStandardMaterial color={SOOT} roughness={0.84} metalness={0.03} />
      </mesh>
      <mesh position={[-0.63, 5.18, -0.42]} rotation={[0, 0.07, 0.01]} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.7]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.84} metalness={0.03} />
      </mesh>
      <mesh position={[-0.62, 5.82, -0.41]} castShadow>
        <boxGeometry args={[0.95, 0.2, 0.95]} />
        <meshStandardMaterial color={CHARCOAL_DARK} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the throat glow — a coal light breathing at the chimney's lip */}
      <mesh position={[-0.62, 5.96, -0.41]}>
        <cylinderGeometry args={[0.2, 0.26, 0.14, 8]} />
        <meshStandardMaterial
          color={EMBER}
          emissive={EMBER}
          emissiveIntensity={1.2}
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>

      {/* firelight pooled on the ground before the mouth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.8]}>
        <circleGeometry args={[0.62, 20]} />
        <meshBasicMaterial color={FLAME} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ---- the anvil on its stump, set before the forge mouth ----

function AnvilStump(): JSX.Element {
  return (
    <group position={[0.18, 0, -0.55]} rotation={[0, -0.3, 0]}>
      {/* the scorched stump */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.42, 0.5, 9]} />
        <meshStandardMaterial color={TIMBER} roughness={0.85} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.51, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.05, 9]} />
        <meshStandardMaterial color={PALETTE.stoneWarm} roughness={0.85} metalness={0.02} />
      </mesh>
      {/* the anvil: base, waist, body, and the horn */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.5, 0.13, 0.34]} />
        <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.73, 0]}>
        <boxGeometry args={[0.26, 0.16, 0.2]} />
        <meshStandardMaterial color={IRON} roughness={0.74} metalness={0.05} />
      </mesh>
      <mesh position={[0.02, 0.9, 0]} castShadow>
        <boxGeometry args={[0.72, 0.18, 0.26]} />
        <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh position={[0.53, 0.9, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.09, 0.34, 8]} />
        <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
      </mesh>
      {/* the smith's hammer, left resting across the anvil face */}
      <group position={[-0.16, 1.03, 0.02]} rotation={[0.12, 0.5, -0.5]}>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.024, 0.03, 0.44, 6]} />
          <meshStandardMaterial color={TIMBER} roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.15, 0.09, 0.09]} />
          <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
        </mesh>
      </group>
    </group>
  )
}

// ---- the pyre: raised fire-bowl, charcoal logs, tall flame, rising sparks ----

function Pyre({ reduced }: { reduced: boolean }): JSX.Element {
  const sparks = useRef<Group>(null)
  // the LIVING flame (fx kit shader — QA 2026-07-14: the painted nested cones
  // read as MS-paint); animates itself, stands still under reduced motion
  const flameOuter = useFlame()
  const flameCore = useFlame({ base: PALETTE.amberBright })

  // the sparks climb; dead still under reduced
  useSafeFrame(({ clock }) => {
    const t = clock.elapsedTime
    const g = sparks.current
    if (g === null) return
    g.children.forEach((child, i) => {
      const s = SPARKS[i]
      if (s === undefined) return
      const cycle = reduced ? s.phase : (s.phase + t * s.speed * 0.22) % 1
      const sway = reduced ? 0 : Math.sin(t * 1.7 + s.phase * 12) * 0.06
      child.position.set(
        Math.cos(s.angle) * s.radius + sway,
        cycle * SPARK_RISE,
        Math.sin(s.angle) * s.radius,
      )
      child.scale.setScalar(sparkFade(cycle))
    })
  })

  return (
    <group position={[3.1, 0, 0.6]}>
      {/* scorch ring burnt into the ground around the bowl */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.28, 1.5, 28]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {/* plinth, pedestal, and the raised fire-bowl */}
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.36, 8]} />
        <meshStandardMaterial color={CHARCOAL_DARK} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.6, 0.7, 8]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.84} metalness={0.03} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.5, 0.52, 10]} />
        <meshStandardMaterial color={SOOT} roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.56, 0]}>
        <torusGeometry args={[0.82, 0.07, 8, 20]} />
        <meshStandardMaterial color={CHARCOAL_DARK} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* charcoal logs crossed in the bowl, coal-veined */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 1.9) * 0.08, 1.58, Math.sin(i * 1.9) * 0.08]}
          rotation={[0, (i / 4) * Math.PI + 0.3, Math.PI / 2.15]}
          castShadow
        >
          <cylinderGeometry args={[0.07, 0.09, 0.95, 6]} />
          <meshStandardMaterial
            color={CHARCOAL_DARK}
            emissive={PALETTE.emberDeep}
            emissiveIntensity={0.35}
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
      ))}
      {/* the ember bed the flame stands in */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.08, 10]} />
        <meshStandardMaterial
          color={PALETTE.amber}
          emissive={PALETTE.amberBright}
          emissiveIntensity={1.2}
          roughness={0.75}
          metalness={0.02}
        />
      </mesh>
      {/* the phoenix flame — the LIVING shader, tall heart + bright core */}
      <mesh material={flameOuter} position={[0, 2.55, 0]}>
        <coneGeometry args={[0.5, 1.95, 8, 4, true]} />
      </mesh>
      <mesh material={flameCore} position={[0.02, 2.4, -0.02]}>
        <coneGeometry args={[0.28, 1.4, 7, 4, true]} />
      </mesh>
      <GlowSprite position={[0, 2.7, 0]} color={PALETTE.amber} scale={2.2} opacity={0.5} pulse />
      {/* spark motes drifting up out of the bowl */}
      <group ref={sparks} position={[0, 1.66, 0]}>
        {SPARKS.map((s, i) => (
          <mesh
            key={i}
            position={[Math.cos(s.angle) * s.radius, s.phase * SPARK_RISE, Math.sin(s.angle) * s.radius]}
            scale={sparkFade(s.phase)}
          >
            <octahedronGeometry args={[s.size, 0]} />
            <meshStandardMaterial
              color={s.gold ? SPARK_GOLD : EMBER}
              emissive={s.gold ? SPARK_GOLD : EMBER}
              emissiveIntensity={1.5}
              roughness={0.72}
              metalness={0.02}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---- the Spark of Joy: one warm lantern on a slender post, apart from the fire ----

function SparkOfJoy(): JSX.Element {
  return (
    <group position={[-3.3, 0, 1.9]} rotation={[0, 0.5, 0]}>
      {/* a soft warm pool on the ground beneath it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.02, 0]}>
        <circleGeometry args={[0.52, 18]} />
        <meshBasicMaterial color={PALETTE.amber} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* footing stone and the slender post */}
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.18, 7]} />
        <meshStandardMaterial color={SOOT} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.2, 7]} />
        <meshStandardMaterial color={TIMBER} roughness={0.82} metalness={0.02} />
      </mesh>
      {/* the crook arm the lantern hangs from */}
      <mesh position={[0.16, 2.36, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.032, 0.46, 6]} />
        <meshStandardMaterial color={TIMBER} roughness={0.82} metalness={0.02} />
      </mesh>
      <mesh position={[0.34, 2.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.014, 6, 12]} />
        <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
      </mesh>
      {/* the lantern: cap, six-paned body, and the small warm heart */}
      <group position={[0.34, 2.02, 0]}>
        <mesh position={[0, 0.24, 0]}>
          <coneGeometry args={[0.17, 0.15, 6]} />
          <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.13, 0.15, 0.32, 6]} />
          <meshStandardMaterial
            color={PALETTE.amber}
            emissive={PALETTE.amber}
            emissiveIntensity={0.55}
            roughness={0.72}
            metalness={0.04}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial
            color={PALETTE.amberBright}
            emissive={PALETTE.amberBright}
            emissiveIntensity={1.6}
            roughness={0.72}
            metalness={0.02}
          />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 0.08, 6]} />
          <meshStandardMaterial color={IRON} roughness={0.72} metalness={0.05} />
        </mesh>
        {/* the soft glow shell that catches bloom */}
        <mesh>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshBasicMaterial color={PALETTE.amber} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

// ---- assembly ----

export function SetPieceW3({ reduced }: { reduced: boolean }): JSX.Element {
  return (
    <group>
      <Forge />
      <AnvilStump />
      <Pyre reduced={reduced} />
      <SparkOfJoy />
      {/* charcoal boulders ringing the site — every third still holds its coal */}
      {EMBER_ROCKS.map((rock, i) => (
        <mesh
          key={i}
          position={[rock.x, rock.size * 0.55, rock.z]}
          rotation={[rock.tilt, rock.yaw, rock.tilt * 0.6]}
          castShadow
        >
          <dodecahedronGeometry args={[rock.size, 0]} />
          <meshStandardMaterial
            color={rock.lit ? SOOT : CHARCOAL}
            emissive={rock.lit ? PALETTE.emberDeep : '#000000'}
            emissiveIntensity={rock.lit ? 0.4 : 0}
            roughness={0.85}
            metalness={0.03}
          />
        </mesh>
      ))}
      {/* firelight: one ember light over the pyre, one warm breath at the
          lantern — constant count, dim and steady, full tier only */}
      {!LOW_POWER ? (
        <>
          <pointLight
            position={[3.1, 2.7, 0.6]}
            color={EMBER}
            intensity={1.1}
            distance={7}
            decay={2}
          />
          <pointLight
            position={[-2.96, 2.1, 1.9]}
            color={PALETTE.amber}
            intensity={0.6}
            distance={5}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
