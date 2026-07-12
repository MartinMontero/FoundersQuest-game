// src/game/setpieces/W5.tsx — World 5 "Feedback — The Mirror" landmark:
// THE MIRROR CAUSEWAY. A still black lake (the one allowed material break —
// dark, glossy, metal-leaning, so it reads as standing water) crossed by a
// straight causeway of flat stone pavers; four tall standing mirrors flank the
// crossing — thin iron-dark frames around pale, faintly-lit faces, varied
// heights and leans — each laying a soft streak of its light on the water.
// Where the causeway lands, a small GRAVEYARD corner adjoins: a low earthen
// islet with an iron rail fence, one bare dead tree, and three small
// headstones. Three pale glints drift low over the lake.
//
// Scenery only: no store reads/writes, no strings, no Html. Mounted inside a
// world <group>, so everything renders at LOCAL origin (footprint r <= 5.5,
// height <= 8) and reads from the spawn side (+z looking toward -z). Placement
// is index-hashed (no Math.random) so every boot and screenshot is identical.
// Motion runs through useSafeFrame and settles fully static under `reduced`.
// Light count is CONSTANT (two point lights, full tier only) — no recompiles.

import { useRef } from 'react'
import type { Group } from 'three'
import { LOW_POWER } from '../perf'
import { useSafeFrame } from '../useSafeFrame'
import { skyForStage } from '../worldPalette'

// ---- the Mirror register: world-5 pale silver over ink-black water ----

const SKY = skyForStage(5)
/** signature pale-silver accent — the mirror light (worldPalette stage 5) */
const ACCENT = SKY.accent
/** near-white glow — the mirror faces and their streaks on the water */
const GLOW = SKY.glow

/** the still black lake — the ONE material break: glossy, metal-leaning */
const WATER = '#0a0d13'
/** causeway stone, two courses so the pavers read hand-laid */
const STONE = '#7b8290'
const STONE_DARK = '#5d6470'
/** iron-dark — mirror frames, the graveyard fence */
const IRON = '#1c2129'
const IRON_DEEP = '#11151b'
/** weathered pale headstone grey */
const BONE = '#a7adb6'
/** the dead tree's cold bark */
const BARK = '#23262d'
/** the graveyard islet's dark earth */
const MOUND = '#2b2f37'

/** Deterministic 0..1 hash of an index — seeded scatter, identical every boot. */
function hash01(n: number): number {
  let h = Math.imul(n + 1, 2654435761)
  h = Math.imul(h ^ (h >>> 13), 1597334677)
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}

// ---- the causeway: flat pavers laid straight across the lake (+z to -z) ----

interface PaverSpec {
  x: number
  z: number
  y: number
  yaw: number
  w: number
  d: number
  dark: boolean
}

const PAVERS: readonly PaverSpec[] = Array.from({ length: 9 }, (_, i) => ({
  x: (hash01(i * 5 + 2) - 0.5) * 0.14,
  z: 4.55 - i * 0.975,
  y: 0.075 + hash01(i * 5 + 6) * 0.03,
  yaw: (hash01(i * 5 + 3) - 0.5) * 0.16,
  w: 0.95 + hash01(i * 5 + 4) * 0.2,
  d: 0.68 + hash01(i * 5 + 5) * 0.14,
  dark: i % 2 === 1,
}))

/** broken pavers slipped off the line, half-sunk in the black water */
const SUNK_STONES: readonly { x: number; z: number; yaw: number; s: number }[] = Array.from(
  { length: 3 },
  (_, i) => ({
    x: (i % 2 === 0 ? 1 : -1) * (0.95 + hash01(i * 7 + 11) * 0.5),
    z: 3.4 - hash01(i * 7 + 12) * 5.6,
    yaw: hash01(i * 7 + 13) * Math.PI * 2,
    s: 0.14 + hash01(i * 7 + 14) * 0.08,
  }),
)

// ---- the standing mirrors: thin dark frames, pale faces, varied leans ----

interface MirrorSpec {
  x: number
  z: number
  /** spin toward the causeway so the faces read from the crossing */
  yaw: number
  w: number
  h: number
  /** [lean toward/away, lean sideways] — no two mirrors stand alike */
  lean: readonly [number, number]
}

const MIRRORS: readonly MirrorSpec[] = [
  { x: -1.95, z: 1.7, yaw: 0.55, w: 1.05, h: 3.3, lean: [0.05, 0.03] },
  { x: 2.05, z: 0.3, yaw: -0.6, w: 1.2, h: 4.05, lean: [-0.04, -0.05] },
  { x: -2.15, z: -1.4, yaw: 0.42, w: 0.9, h: 2.7, lean: [0.07, -0.02] },
  { x: 1.8, z: -2.5, yaw: -0.35, w: 1.0, h: 3.6, lean: [-0.03, 0.04] },
]

/** One standing mirror: stone footing, iron frame, pale slightly-lit face,
 * a small accent finial — and its light streaked flat on the water. */
function StandingMirror({ spec }: { spec: MirrorSpec }): JSX.Element {
  const { x, z, yaw, w, h, lean } = spec
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      {/* the footing plinth, half in the water */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <boxGeometry args={[w + 0.3, 0.22, 0.5]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.85} metalness={0.04} />
      </mesh>
      <group position={[0, 0.22, 0]} rotation={[lean[0], 0, lean[1]]}>
        {/* the thin iron-dark frame */}
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, 0.1]} />
          <meshStandardMaterial color={IRON} roughness={0.78} metalness={0.05} />
        </mesh>
        {/* the pale face, faintly lit — it reads as caught sky at distance */}
        <mesh position={[0, h / 2, 0.06]}>
          <planeGeometry args={[w - 0.16, h - 0.2]} />
          <meshStandardMaterial
            color={GLOW}
            emissive={ACCENT}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
        {/* the crowning finial in the world's silver accent */}
        <mesh position={[0, h + 0.12, 0]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.8}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
      </group>
      {/* the mirror's light, streaked still on the black water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1.05]}>
        <planeGeometry args={[w * 0.62, 1.8]} />
        <meshBasicMaterial color={GLOW} transparent opacity={0.13} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ---- pale glints adrift over the lake (bob on the frame loop) ----

interface GlintSpec {
  x: number
  z: number
  y: number
  phase: number
  speed: number
}

const GLINTS: readonly GlintSpec[] = Array.from({ length: 3 }, (_, i) => {
  const a = hash01(i * 9 + 1) * Math.PI * 2
  const r = 1.6 + hash01(i * 9 + 2) * 2.0
  return {
    x: Math.cos(a) * r,
    z: Math.sin(a) * r,
    y: 0.5 + hash01(i * 9 + 3) * 0.7,
    phase: hash01(i * 9 + 4) * Math.PI * 2,
    speed: 0.6 + hash01(i * 9 + 5) * 0.5,
  }
})

// ---- the graveyard corner: fence, bare tree, headstones on an earth islet ----

/** islet top height — everything in the corner stands on this shelf */
const SHELF_Y = 0.09

/** iron fence posts, an open L along the islet's near edges (local x/z) */
const FENCE_POSTS: readonly [number, number][] = [
  [-0.85, 0.7],
  [-0.28, 0.7],
  [0.28, 0.7],
  [0.85, 0.7],
  [0.85, 0.12],
  [0.85, -0.46],
]

/** two rail heights per fence run */
const RAIL_HEIGHTS: readonly number[] = [0.3, 0.5]

/** the dead tree's bare angular branches: yaw about Y, then -tilt about Z */
const BRANCHES: readonly { base: readonly [number, number, number]; yaw: number; tilt: number; len: number }[] = [
  { base: [0.05, 1.05, -0.03], yaw: 2.3, tilt: 1.0, len: 0.85 },
  { base: [-0.04, 1.45, 0.04], yaw: 4.6, tilt: 0.8, len: 1.05 },
  { base: [0.06, 1.8, 0.02], yaw: 0.7, tilt: 0.65, len: 0.95 },
  { base: [-0.02, 2.1, -0.02], yaw: 3.4, tilt: 0.42, len: 0.7 },
]

/** three small headstones, spread and settled at slight tilts */
const HEADSTONES: readonly { x: number; z: number; yaw: number; tilt: number; s: number }[] = [
  { x: 0.12, z: -0.12, yaw: 0.12, tilt: 0.06, s: 1 },
  { x: -0.38, z: 0.14, yaw: -0.2, tilt: -0.09, s: 0.85 },
  { x: 0.52, z: -0.58, yaw: 0.3, tilt: 0.05, s: 0.92 },
]

function Headstone({
  x,
  z,
  yaw,
  tilt,
  s,
}: {
  x: number
  z: number
  yaw: number
  tilt: number
  s: number
}): JSX.Element {
  return (
    <group position={[x, SHELF_Y, z]} rotation={[tilt, yaw, tilt * 0.6]} scale={s}>
      {/* the slab */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.09]} />
        <meshStandardMaterial color={BONE} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the rounded crown */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.09, 10]} />
        <meshStandardMaterial color={BONE} roughness={0.85} metalness={0.03} />
      </mesh>
    </group>
  )
}

function Graveyard(): JSX.Element {
  return (
    <group position={[1.2, 0, -3.9]}>
      {/* the low earthen islet the graves stand on */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.38, 0.09, 12]} />
        <meshStandardMaterial color={MOUND} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* iron fence: posts with spear finials, two rails per run */}
      {FENCE_POSTS.map(([px, pz], i) => (
        <group key={i} position={[px, SHELF_Y, pz]}>
          <mesh position={[0, 0.31, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.62, 6]} />
            <meshStandardMaterial color={IRON_DEEP} roughness={0.78} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.67, 0]}>
            <coneGeometry args={[0.035, 0.1, 5]} />
            <meshStandardMaterial color={IRON} roughness={0.78} metalness={0.05} />
          </mesh>
        </group>
      ))}
      {RAIL_HEIGHTS.map((ry) => (
        <mesh key={`front-${ry}`} position={[0, SHELF_Y + ry, 0.7]}>
          <boxGeometry args={[1.7, 0.035, 0.035]} />
          <meshStandardMaterial color={IRON_DEEP} roughness={0.78} metalness={0.05} />
        </mesh>
      ))}
      {RAIL_HEIGHTS.map((ry) => (
        <mesh key={`side-${ry}`} position={[0.85, SHELF_Y + ry, 0.12]}>
          <boxGeometry args={[0.035, 0.035, 1.16]} />
          <meshStandardMaterial color={IRON_DEEP} roughness={0.78} metalness={0.05} />
        </mesh>
      ))}

      {/* the bare tree — a cold leaning trunk and angular dead snags */}
      <group position={[-0.72, SHELF_Y, -0.5]} rotation={[0, 1.1, 0]}>
        <mesh position={[0, 0.11, 0]} receiveShadow>
          <cylinderGeometry args={[0.16, 0.26, 0.22, 7]} />
          <meshStandardMaterial color={IRON_DEEP} roughness={0.85} metalness={0.03} />
        </mesh>
        <mesh position={[0.02, 1.0, -0.01]} rotation={[0.05, 0, -0.09]} castShadow>
          <cylinderGeometry args={[0.09, 0.16, 1.8, 6]} />
          <meshStandardMaterial color={BARK} roughness={0.85} metalness={0.03} />
        </mesh>
        <mesh position={[-0.05, 2.25, 0.02]} rotation={[-0.04, 0, 0.14]} castShadow>
          <cylinderGeometry args={[0.04, 0.09, 0.9, 6]} />
          <meshStandardMaterial color={BARK} roughness={0.85} metalness={0.03} />
        </mesh>
        {BRANCHES.map((b, i) => (
          <group key={i} position={[b.base[0], b.base[1], b.base[2]]} rotation={[0, b.yaw, 0]}>
            <group rotation={[0, 0, -b.tilt]}>
              <mesh position={[0, b.len / 2, 0]} castShadow>
                <cylinderGeometry args={[0.018, 0.05, b.len, 5]} />
                <meshStandardMaterial color={BARK} roughness={0.85} metalness={0.03} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* the small headstones */}
      {HEADSTONES.map((h, i) => (
        <Headstone key={i} x={h.x} z={h.z} yaw={h.yaw} tilt={h.tilt} s={h.s} />
      ))}
    </group>
  )
}

// ---- assembly ----

export function SetPieceW5({ reduced }: { reduced: boolean }): JSX.Element {
  const glints = useRef<Group>(null)

  // the glints drift and slowly turn over the still water; dead still under
  // reduced motion (no shake, ever) — the lake itself never moves
  useSafeFrame(({ clock }) => {
    const g = glints.current
    if (g === null) return
    const t = clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = GLINTS[i]
      if (s === undefined) return
      child.position.y = reduced ? s.y : s.y + Math.sin(t * s.speed + s.phase) * 0.09
      child.rotation.y = reduced ? 0 : t * 0.5 + s.phase
    })
  })

  return (
    <group>
      {/* ---- the still black lake: the ONE allowed material break — glossy,
           metal-leaning, so it reads as standing water, not stone ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[5.2, 36]} />
        <meshStandardMaterial color={WATER} roughness={0.15} metalness={0.4} />
      </mesh>
      {/* the water's edge, rimmed in the world's pale accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[5.0, 5.18, 40]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.14} depthWrite={false} />
      </mesh>

      {/* ---- the causeway: flat pavers laid straight across the crossing ---- */}
      {PAVERS.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]} castShadow receiveShadow>
          <boxGeometry args={[p.w, 0.1, p.d]} />
          <meshStandardMaterial color={p.dark ? STONE_DARK : STONE} roughness={0.85} metalness={0.04} />
        </mesh>
      ))}
      {/* broken pavers, half-sunk beside the line */}
      {SUNK_STONES.map((r, i) => (
        <mesh key={`sunk-${i}`} position={[r.x, 0.02, r.z]} rotation={[0, r.yaw, 0]}>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.85} metalness={0.04} />
        </mesh>
      ))}

      {/* ---- the hall of standing mirrors, flanking the crossing ---- */}
      {MIRRORS.map((m, i) => (
        <StandingMirror key={i} spec={m} />
      ))}

      {/* ---- pale glints adrift low over the water ---- */}
      <group ref={glints}>
        {GLINTS.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, s.z]}>
            <octahedronGeometry args={[0.05, 0]} />
            <meshStandardMaterial
              color={GLOW}
              emissive={ACCENT}
              emissiveIntensity={1.2}
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>

      {/* ---- the graveyard corner adjoining the far landing ---- */}
      <Graveyard />

      {/* ---- lights: constant count, dim, full tier only ---- */}
      {!LOW_POWER ? (
        <>
          {/* pale mirror-light pooled over the causeway */}
          <pointLight
            position={[0, 2.6, 0.4]}
            color={ACCENT}
            intensity={0.55}
            distance={8}
            decay={2}
          />
          {/* a colder, dimmer breath over the graves */}
          <pointLight
            position={[1.2, 1.8, -3.6]}
            color={SKY.aurora}
            intensity={0.3}
            distance={5}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}
