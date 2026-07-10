// src/game/Interactables.tsx — every placed Stage-1 interactable, rendered
// purely from the stores (the world owns NO state of record):
//   shrine stones    — inked/lit when answers['s1'][qid] holds ink (§2 F0)
//   flagpoles        — raised state from data.milestones (Action, self-report)
//   the Vault        — visibly chained until vaultUnlocked (01: sealed till S3)
//   the Registry     — guardian figures from data.assumptions: size by
//                      importance weight 3/2/1, metal tint by DERIVED tier,
//                      riskiest crowned (metrics.riskiest via useRiskiest)
// One highlight ring + name chip serves walk-up proximity AND Tab focus —
// the same affordance, keyboard a11y parity (game-design §3).
//
// LOOK: cel-shaded toon everywhere (shared ramp in materials.ts). Shrines are
// rune monuments with a floating glyph; the Vault an ornate sealed sanctum; the
// Registry a standing-stone circle of cloaked menhirs. Interactables glow via
// emissive (Bloom catches it); a single proximity point light pools on the
// active target and pulses — static under reduced motion. Light COUNT is held
// constant (lights dim to zero, never unmount) so no shader recompiles as the
// player roams.

import { useRef } from 'react'
import { Float, Html } from '@react-three/drei'
import { DoubleSide } from 'three'
import type { Group, Mesh, PointLight } from 'three'
import { IMPORTANCE_WEIGHT, tierOf } from '../core/metrics'
import type { Answer, Assumption, EvidenceEntry, EvidenceTier } from '../core/schema'
import { useQuestStore, useRiskiest } from '../state/store'
import { useUiStore } from '../state/ui'
import { STAGES, WORLD_COPY } from '../strings'
import {
  REGISTRY_POSITION,
  layoutForStage,
  milestonesForStage,
  type InteractableSpec,
} from './contracts'
import { useJourneyStore } from '../state/journey'
import { SPEC_BY_ID, activeTargetId, useInteractionStore } from './interaction'
import { PALETTE } from './materials'
import { Pillar } from './models'
import { IS_AUTOMATION, LOW_POWER } from './perf'
import { useSafeFrame } from './useSafeFrame'

// ---- derived lookups (strings/contracts, built once) ----

/** question text by qid — canon copy from src/strings, shown on the name chip (all worlds) */
const QUESTION_TEXT: ReadonlyMap<string, string> = new Map(
  STAGES.flatMap((s) => s.questions.map((q) => [q.id, q.text] as const)),
)
/** milestone label by id, across every world (s{n}-m{k}) */
const MILESTONE_LABEL: ReadonlyMap<string, string> = new Map(
  STAGES.flatMap((s) => milestonesForStage(s.stage).map((m) => [m.id, m.label] as const)),
)
/** world name by stage number — for the traversal portal chips */
const WORLD_NAME: ReadonlyMap<number, string> = new Map(STAGES.map((s) => [s.stage, s.world]))

/** An answer counts as ink when any 02 field holds content. */
function hasInk(answer: Answer | undefined): boolean {
  if (answer === undefined) return false
  if (answer.text !== undefined && answer.text.trim() !== '') return true
  if (answer.whys !== undefined && answer.whys.some((w) => w.trim() !== '')) return true
  return (
    answer.sealedAt !== undefined ||
    answer.verdict !== undefined ||
    answer.decision !== undefined ||
    answer.ifPart !== undefined ||
    answer.thenPart !== undefined
  )
}

/** Deterministic 0..1 hash of a string — per-shrine silhouette variation. */
function hashUnit(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 0xffffffff
}

// ---- shrine rune monuments ----

type GlyphKind = 'ring' | 'halo' | 'diamond' | 'prism' | 'tetra' | 'shard' | 'cube' | 'star'

/** A distinct floating glyph per shrine so no two monuments read alike. */
const GLYPH_BY_QID: Readonly<Record<string, GlyphKind>> = {
  's1-th': 'ring',
  's1-l1': 'diamond',
  's1-l2': 'halo', // the Five Whys well at the spiral's centre
  's1-l3': 'prism',
  's1-l4': 'tetra',
  's1-l5': 'shard',
  's1-fp': 'cube',
  's1-fx': 'star',
}

function GlyphGeometry({ kind }: { kind: GlyphKind }): JSX.Element {
  switch (kind) {
    case 'ring':
      return <torusGeometry args={[0.24, 0.07, 10, 20]} />
    case 'halo':
      return <torusGeometry args={[0.34, 0.06, 10, 24]} />
    case 'diamond':
      return <octahedronGeometry args={[0.3, 0]} />
    case 'prism':
      return <cylinderGeometry args={[0.22, 0.22, 0.34, 6]} />
    case 'tetra':
      return <tetrahedronGeometry args={[0.32, 0]} />
    case 'shard':
      return <coneGeometry args={[0.18, 0.62, 3, 1]} />
    case 'cube':
      return <boxGeometry args={[0.34, 0.34, 0.34]} />
    case 'star':
      return <icosahedronGeometry args={[0.3, 0]} />
  }
}

interface ShrineProps {
  spec: InteractableSpec
  reduced: boolean
}

function ShrineStone({ spec, reduced }: ShrineProps): JSX.Element {
  const qid = spec.qid ?? spec.id
  // stageId is the qid prefix (s2-th → s2) — the shrine lights from THIS world's answers
  const stageId = qid.slice(0, qid.indexOf('-'))
  const answered = useQuestStore((s) => hasInk(s.data.answers[stageId]?.[qid]))
  const glyph = useRef<Group>(null)
  const yaw = hashUnit(qid) * Math.PI * 2
  const kind = GLYPH_BY_QID[qid] ?? 'diamond'
  const glow = answered ? PALETTE.amber : PALETTE.teal
  const [x, y, z] = spec.position

  // the glyph hovers and turns slowly; dead still under reduced motion (§2 F0)
  useSafeFrame(({ clock }) => {
    const g = glyph.current
    if (g === null) return
    if (reduced) {
      g.position.y = 2.9
      g.rotation.y = 0
      return
    }
    g.position.y = 2.9 + Math.sin(clock.elapsedTime * 1.6 + yaw) * 0.09
    g.rotation.y += 0.006
  })

  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {/* the shrine monument — a real CC0 KayKit stone pillar (~2.7 u), lit by
          the HDR and casting a real shadow. Replaces the old primitive stack. */}
      <Pillar scale={[0.68, 0.68, 0.68]} />
      {/* a glowing rune band around the pillar's throat, lit by shrine state */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.05, 0]}>
        <torusGeometry args={[0.42, 0.055, 8, 24]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={answered ? 1.5 : 0.7}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      {/* the floating glyph, wrapped in a soft glow core that catches bloom
          (full) / reads as a bright emissive point (constrained) */}
      <group ref={glyph} position={[0, 2.9, 0]}>
        <mesh scale={answered ? 0.62 : 0.5}>
          <sphereGeometry args={[0.34, 12, 12]} />
          <meshBasicMaterial
            color={glow}
            transparent
            opacity={answered ? 0.42 : 0.28}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <GlyphGeometry kind={kind} />
          <meshStandardMaterial
            color={glow}
            emissive={glow}
            emissiveIntensity={answered ? 1.6 : 1.0}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      </group>
    </group>
  )
}

// ---- milestone flagpoles ----

function Flagpole({ spec, reduced }: ShrineProps): JSX.Element {
  const milestoneId = spec.milestoneId ?? spec.id
  const raised = useQuestStore((s) => s.data.milestones[milestoneId] === true)
  const banner = useRef<Group>(null)
  const [x, y, z] = spec.position
  const flagY = raised ? 2.7 : 1.0

  // the banner sways like cloth catching a slow wind; still under reduced motion
  useSafeFrame(({ clock }) => {
    const b = banner.current
    if (b === null) return
    b.rotation.y = reduced ? 0 : Math.sin(clock.elapsedTime * 1.3 + x) * 0.22
  })

  return (
    <group position={[x, y, z]}>
      {/* the pole — a warm weathered timber, not cold steel */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#9a8a86" roughness={0.72} metalness={0.05} />
      </mesh>
      {/* the finial */}
      <mesh position={[0, 3.25, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial
          color={PALETTE.amber}
          emissive={PALETTE.amber}
          emissiveIntensity={0.7}
          roughness={0.72} metalness={0.05}
        />
      </mesh>
      {/* the banner — a bent cloth plane, hoisted or furled by the milestone */}
      <group ref={banner} position={[0.04, flagY, 0]}>
        <mesh position={[0.46, 0, 0]} rotation={[0, 0, -0.06]}>
          <planeGeometry args={[0.9, 0.55, 4, 1]} />
          <meshStandardMaterial
            color={raised ? PALETTE.amber : '#4b4670'}
            emissive={raised ? PALETTE.amber : '#000000'}
            emissiveIntensity={raised ? 0.45 : 0}
            roughness={0.72} metalness={0.05}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}

// ---- the Vault: an ornate sealed sanctum ----

interface VaultProps {
  spec: InteractableSpec
  reduced: boolean
}

/** four corner posts of an ornate reliquary */
const VAULT_POSTS: readonly [number, number][] = [
  [0.62, 0.42],
  [-0.62, 0.42],
  [0.62, -0.42],
  [-0.62, -0.42],
]

function VaultMonument({ spec, reduced }: VaultProps): JSX.Element {
  const locked = useQuestStore((s) => !s.data.vaultUnlocked)
  const [x, y, z] = spec.position

  const sanctum = (
    <group>
      {/* the reliquary core */}
      <mesh>
        <boxGeometry args={[1.3, 0.9, 0.85]} />
        <meshStandardMaterial
          color={PALETTE.violetDeep}
          emissive={PALETTE.violet}
          emissiveIntensity={0.28}
          roughness={0.72} metalness={0.05}
        />
      </mesh>
      {/* ornate corner posts */}
      {VAULT_POSTS.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0, pz]}>
          <cylinderGeometry args={[0.08, 0.1, 1.02, 6]} />
          <meshStandardMaterial color={PALETTE.stoneWarm} roughness={0.72} metalness={0.05} />
        </mesh>
      ))}
      {/* a crowning finial */}
      <mesh position={[0, 0.62, 0]}>
        <octahedronGeometry args={[0.17, 0]} />
        <meshStandardMaterial
          color={PALETTE.amber}
          emissive={PALETTE.amber}
          emissiveIntensity={locked ? 0.9 : 0.4}
          roughness={0.72} metalness={0.05}
        />
      </mesh>
      {locked ? (
        <>
          {/* chains: crossed bands over the lid (01: captured, visible, sealed) */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.72, 0.05, 8, 24]} />
            <meshStandardMaterial color="#8b88a8" roughness={0.72} metalness={0.05} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.3, 0, 0]}>
            <torusGeometry args={[0.6, 0.05, 8, 24]} />
            <meshStandardMaterial color="#8b88a8" roughness={0.72} metalness={0.05} />
          </mesh>
          {/* the amber wax seal on the face */}
          <mesh position={[0, -0.05, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshStandardMaterial
              color={PALETTE.amberBright}
              emissive={PALETTE.amber}
              emissiveIntensity={1.1}
              roughness={0.72} metalness={0.05}
            />
          </mesh>
          <mesh position={[0, -0.05, 0.5]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial
              color={PALETTE.amberBright}
              emissive={PALETTE.amberBright}
              emissiveIntensity={1.2}
              roughness={0.72} metalness={0.05}
            />
          </mesh>
        </>
      ) : null}
    </group>
  )

  return (
    <group position={[x, y, z]}>
      {/* a steady amber pool of light on the sealed sanctum (constant light) */}
      {!LOW_POWER ? (
        <pointLight color={PALETTE.amber} intensity={locked ? 1.1 : 0.5} distance={6} decay={2} />
      ) : null}
      {reduced ? (
        sanctum
      ) : (
        <Float
          speed={1.4}
          rotationIntensity={0.15}
          floatIntensity={0.7}
          floatingRange={[-0.15, 0.15]}
        >
          {sanctum}
        </Float>
      )}
    </group>
  )
}

// ---- the Registry: a standing-stone circle of cloaked menhirs ----

/** metal tint by DERIVED tier: E0 mist · E1 tin · E2 silver · E3 steel · E4 gold */
const TIER_TINT: Readonly<Record<EvidenceTier, string>> = {
  0: '#5b6472',
  1: '#8d9aa5',
  2: '#d4d7e4',
  3: '#66788f',
  4: '#d9b74a',
}

interface GuardianProps {
  assumption: Assumption
  evidence: readonly EvidenceEntry[]
  crowned: boolean
  reduced: boolean
  position: [number, number, number]
  facing: number
}

function GuardianFigure({
  assumption,
  evidence,
  crowned,
  reduced,
  position,
  facing,
}: GuardianProps): JSX.Element {
  const group = useRef<Group>(null)
  const weight = IMPORTANCE_WEIGHT[assumption.importance]
  const scale = 0.65 + weight * 0.35 // dies=3 large · wobbles=2 · shrugs=1 small
  const tint = TIER_TINT[tierOf(assumption, evidence)]

  // riskiest: a larger idle animation — a slow bob, static under reduced motion
  useSafeFrame(({ clock }) => {
    const g = group.current
    if (g === null) return
    g.position.y = crowned && !reduced ? Math.sin(clock.elapsedTime * 2) * 0.08 : 0
  })

  return (
    <group position={position}>
      <group ref={group} scale={scale} rotation={[0.05, facing, 0.03]}>
        {/* the menhir body — a tapered, hooded standing stone */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.16, 0.34, 1.5, 5]} />
          <meshStandardMaterial
            color={tint}
            emissive={crowned ? PALETTE.ember : tint}
            emissiveIntensity={crowned ? 0.6 : 0.1}
            roughness={0.72} metalness={0.05}
          />
        </mesh>
        {/* the hood */}
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshStandardMaterial
            color={tint}
            emissive={crowned ? PALETTE.emberDeep : '#000000'}
            emissiveIntensity={crowned ? 0.4 : 0}
            roughness={0.72} metalness={0.05}
          />
        </mesh>
        {crowned ? (
          <>
            {/* the warning crown */}
            <mesh position={[0, 1.98, 0]}>
              <coneGeometry args={[0.2, 0.32, 6, 1]} />
              <meshStandardMaterial
                color={PALETTE.ember}
                emissive={PALETTE.ember}
                emissiveIntensity={1.1}
                roughness={0.72} metalness={0.05}
              />
            </mesh>
            {/* a floating warning ember */}
            <mesh position={[0, 2.45, 0]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial
                color={PALETTE.ember}
                emissive={PALETTE.ember}
                emissiveIntensity={1.3}
                roughness={0.72} metalness={0.05}
              />
            </mesh>
          </>
        ) : null}
      </group>
      {crowned ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.5 * scale, 0.62 * scale, 24]} />
          <meshBasicMaterial color={PALETTE.ember} transparent opacity={0.7} />
        </mesh>
      ) : null}
    </group>
  )
}

/** decorative outer menhirs so the circle reads as a stone ring even when few
 * guardians stand — static silhouettes only. */
const CIRCLE_STONES: readonly { angle: number; height: number }[] = Array.from(
  { length: 8 },
  (_, i) => ({ angle: (i / 8) * Math.PI * 2 + 0.2, height: 1.1 + ((i * 37) % 5) * 0.12 }),
)

function RegistryCircle({ reduced }: { reduced: boolean }): JSX.Element {
  const assumptions = useQuestStore((s) => s.data.assumptions)
  const evidence = useQuestStore((s) => s.data.evidence)
  const riskiest = useRiskiest()
  const standing = assumptions.filter((a) => a.status !== 'invalidated')
  const [cx, cy, cz] = REGISTRY_POSITION

  // where the crowned menhir stands, so its ember light can pool there
  let emberX = 0
  let emberZ = 0
  let hasEmber = false
  standing.forEach((a, index) => {
    if (riskiest !== null && riskiest.id === a.id) {
      const angle = (index / Math.max(standing.length, 1)) * Math.PI * 2
      emberX = Math.cos(angle) * 2.2
      emberZ = Math.sin(angle) * 2.2
      hasEmber = true
    }
  })

  return (
    <group position={[cx, cy, cz]}>
      {/* the inscribed ground circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.9, 3.15, 48]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.5} />
      </mesh>
      {/* the central altar */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.5, 0.62, 0.2, 12]} />
        <meshStandardMaterial
          color={PALETTE.stone}
          emissive={PALETTE.teal}
          emissiveIntensity={0.35}
          roughness={0.72} metalness={0.05}
        />
      </mesh>
      {/* a teal pool of light over the circle (constant) + a warning ember that
          dims to nothing when nothing is riskiest (constant count, no recompile) */}
      {!LOW_POWER ? (
        <>
          <pointLight position={[0, 2.2, 0]} color={PALETTE.teal} intensity={0.8} distance={8} decay={2} />
          <pointLight
            position={[emberX, 1.6, emberZ]}
            color={PALETTE.ember}
            intensity={hasEmber ? 0.9 : 0}
            distance={6}
            decay={2}
          />
        </>
      ) : null}
      {/* the outer standing stones */}
      {CIRCLE_STONES.map((stone, i) => (
        <mesh
          key={i}
          position={[Math.cos(stone.angle) * 3.05, stone.height / 2, Math.sin(stone.angle) * 3.05]}
          rotation={[0.04, stone.angle, ((i % 3) - 1) * 0.05]}
        >
          <cylinderGeometry args={[0.18, 0.28, stone.height, 5]} />
          <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.72} metalness={0.05} />
        </mesh>
      ))}
      {standing.map((assumption, index) => {
        const angle = (index / Math.max(standing.length, 1)) * Math.PI * 2
        return (
          <GuardianFigure
            key={assumption.id}
            assumption={assumption}
            evidence={evidence}
            crowned={riskiest !== null && riskiest.id === assumption.id}
            reduced={reduced}
            position={[Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2]}
            facing={-angle + Math.PI / 2}
          />
        )
      })}
    </group>
  )
}

// ---- the traversal portal: an ornate rune-gate, its destination named on a
// ---- carved sign, a shimmering veil between fluted columns you walk into ----

/** one fluted column with a base, capital, and a brazier gem on top */
function GateColumn({ x, glow }: { x: number; glow: string }): JSX.Element {
  return (
    <group position={[x, 0, 0]}>
      {/* plinth */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.7, 0.66]} />
        <meshStandardMaterial color={PALETTE.stoneWarm} roughness={0.82} metalness={0.05} />
      </mesh>
      {/* fluted shaft */}
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.3, 2.5, 10]} />
        <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.8} metalness={0.06} />
      </mesh>
      {/* capital */}
      <mesh position={[0, 3.35, 0]} castShadow>
        <boxGeometry args={[0.62, 0.34, 0.62]} />
        <meshStandardMaterial color={PALETTE.stoneWarm} roughness={0.82} metalness={0.05} />
      </mesh>
      {/* a brazier flame gem crowning the column */}
      <mesh position={[0, 3.72, 0]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.4} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** the three runes floating within the arch, per gate */
const GATE_RUNES: readonly [number, number][] = [
  [-0.5, 2.0],
  [0.5, 2.4],
  [0, 1.6],
]

function PortalArch({ spec, reduced }: ShrineProps): JSX.Element {
  const [x, y, z] = spec.position
  const onward = spec.portalDir === 'onward'
  const glow = onward ? PALETTE.teal : PALETTE.violet
  const dir = onward ? WORLD_COPY.portalOnward : WORLD_COPY.portalBack
  const worldName = spec.targetStage !== undefined ? WORLD_NAME.get(spec.targetStage) : undefined
  const shimmer = useRef<Mesh>(null)
  const runes = useRef<Group>(null)

  // the veil breathes and the runes drift; both still under reduced motion
  useSafeFrame(({ clock }) => {
    const m = shimmer.current
    if (m !== null) {
      const mat = m.material as { opacity?: number }
      mat.opacity = reduced ? 0.42 : 0.32 + Math.sin(clock.elapsedTime * 1.8) * 0.14
    }
    const r = runes.current
    if (r !== null) r.rotation.y = reduced ? 0 : clock.elapsedTime * 0.4
  })

  // The software-GL automation/CI tier gets a minimal gate — the ornate columns,
  // arch, runes, lights, and the Html sign are real-tier chrome that would drop the
  // already-low CI fps (and re-trip the rapid Tab-then-E timing in the self-play
  // spec). The interactable still exists here, so traversal tests are unaffected.
  if (IS_AUTOMATION) {
    return (
      <group position={[x, y, z]}>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2.3, 3, 0.3]} />
          <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.85} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={[x, y, z]}>
      {/* stepped stone base */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.16, 1.7]} />
        <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.85} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.24, 0]} receiveShadow>
        <boxGeometry args={[3.1, 0.16, 1.3]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.85} metalness={0.04} />
      </mesh>

      <GateColumn x={-1.15} glow={glow} />
      <GateColumn x={1.15} glow={glow} />

      {/* the arch — a half-torus resting on the capitals */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <torusGeometry args={[1.22, 0.17, 8, 28, Math.PI]} />
        <meshStandardMaterial color={PALETTE.stoneWarm} roughness={0.82} metalness={0.06} />
      </mesh>
      {/* the keystone gem at the apex */}
      <mesh position={[0, 4.62, 0]}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.5} roughness={0.15} />
      </mesh>

      {/* layered shimmering veil */}
      <mesh ref={shimmer} position={[0, 1.9, 0]}>
        <planeGeometry args={[1.9, 3.2]} />
        <meshBasicMaterial color={glow} transparent opacity={0.4} depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 1.9, 0.02]}>
        <planeGeometry args={[1.5, 2.9]} />
        <meshBasicMaterial color="#eaf6ff" transparent opacity={0.08} depthWrite={false} side={DoubleSide} />
      </mesh>

      {/* runes drifting within the arch */}
      <group ref={runes}>
        {GATE_RUNES.map(([rx, ry], i) => (
          <mesh key={i} position={[rx, ry, 0.1]}>
            <tetrahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.2} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* keystone + brazier light so the gate reads from across the world */}
      {!LOW_POWER ? (
        <pointLight position={[0, 3.0, 0.5]} color={glow} intensity={0.9} distance={9} decay={2} />
      ) : null}

      {/* the carved sign: the destination world, named on the gate */}
      {worldName !== undefined ? (
        <Html
          position={[0, 5.35, 0]}
          center
          distanceFactor={13}
          zIndexRange={[3, 0]}
          wrapperClass="pointer-events-none"
        >
          <div className="pointer-events-none flex select-none flex-col items-center whitespace-nowrap rounded-md border border-amber-300/40 bg-slate-950/85 px-3 py-1 text-center shadow-amber-glow">
            <span className="text-[9px] uppercase tracking-[0.28em] text-parchment-300/70">{dir}</span>
            <span className="quest-heading font-display text-sm font-semibold text-amber-accent-200">
              {worldName}
            </span>
          </div>
        </Html>
      ) : null}
    </group>
  )
}

// ---- the shared highlight: ground ring + name chip + prompt chip ----

/** chip anchor height per kind (the vault hovers, so its chip sits higher) */
function chipHeight(spec: InteractableSpec): number {
  switch (spec.kind) {
    case 'vault':
      return spec.position[1] + 1.4
    case 'flagpole':
      return 3.7
    case 'registry':
      return 2.6
    case 'shrine':
      return 2.5
    case 'portal':
      return 3.8
  }
}

function chipLabel(spec: InteractableSpec): string {
  switch (spec.kind) {
    case 'shrine':
      return QUESTION_TEXT.get(spec.qid ?? spec.id) ?? ''
    case 'flagpole':
      return MILESTONE_LABEL.get(spec.milestoneId ?? spec.id) ?? ''
    case 'vault':
      return WORLD_COPY.vaultName
    case 'registry':
      return WORLD_COPY.registryName
    case 'portal': {
      const dir = spec.portalDir === 'back' ? WORLD_COPY.portalBack : WORLD_COPY.portalOnward
      const name = spec.targetStage !== undefined ? WORLD_NAME.get(spec.targetStage) : undefined
      return name !== undefined ? `${dir} · ${name}` : dir
    }
  }
}

/** A single point light that pools on the active target and pulses gently on
 * proximity. Always mounted (dims to zero when idle) so the light count never
 * changes — no shader recompiles as focus moves. Steady under reduced motion. */
function ProximityLight({ reduced }: { reduced: boolean }): JSX.Element {
  const targetId = useInteractionStore(activeTargetId)
  const roaming = useUiStore((s) => s.mode === 'roam')
  const spec = targetId !== null ? SPEC_BY_ID.get(targetId) : undefined
  const light = useRef<PointLight>(null)
  const active = roaming && spec !== undefined
  const [px, py, pz] = spec ? spec.position : ([0, 0, 0] as [number, number, number])
  const ly = spec?.kind === 'vault' ? py + 0.4 : 1.5

  useSafeFrame(({ clock }) => {
    const l = light.current
    if (l === null) return
    if (!active) {
      l.intensity += (0 - l.intensity) * 0.2
      return
    }
    const base = 1.1
    l.intensity = reduced ? base : base + Math.sin(clock.elapsedTime * 3) * 0.35
  })

  return (
    <pointLight
      ref={light}
      position={[px, ly, pz]}
      color={PALETTE.amberBright}
      intensity={0}
      distance={6}
      decay={2}
    />
  )
}

function HighlightRing({ reduced }: { reduced: boolean }): JSX.Element | null {
  const targetId = useInteractionStore(activeTargetId)
  const roaming = useUiStore((s) => s.mode === 'roam')
  const spec = targetId !== null ? SPEC_BY_ID.get(targetId) : undefined
  const flagRaised = useQuestStore(
    (s) =>
      spec !== undefined &&
      spec.kind === 'flagpole' &&
      s.data.milestones[spec.milestoneId ?? spec.id] === true,
  )
  const vaultLocked = useQuestStore((s) => !s.data.vaultUnlocked)
  const ring = useRef<Mesh>(null)

  // gentle pulse — static under reduced motion (no shake, ever)
  useSafeFrame(({ clock }) => {
    const mesh = ring.current
    if (mesh === null) return
    const pulse = reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 3) * 0.06
    mesh.scale.setScalar(pulse)
  })

  if (!roaming || spec === undefined) return null

  const [x, , z] = spec.position
  const prompt =
    spec.kind === 'flagpole'
      ? flagRaised
        ? WORLD_COPY.prompts.flagpoleLower
        : WORLD_COPY.prompts.flagpoleRaise
      : WORLD_COPY.prompts[spec.kind]

  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z]}>
        <ringGeometry args={[1.0, 1.25, 40]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <Html
        position={[x, chipHeight(spec), z]}
        center
        zIndexRange={[5, 0]}
        wrapperClass="pointer-events-none"
      >
        <div className="pointer-events-none w-56 select-none rounded border border-amber-300/50 bg-slate-950/85 px-2 py-1 text-center">
          <p className="line-clamp-2 text-2xs leading-snug text-slate-100">{chipLabel(spec)}</p>
          {spec.kind === 'vault' && vaultLocked ? (
            <p className="text-2xs text-red-300">{WORLD_COPY.vaultSealedLine}</p>
          ) : null}
          <p className="text-2xs font-semibold text-amber-300">{prompt}</p>
        </div>
      </Html>
    </group>
  )
}

// ---- assembly ----

export interface InteractablesProps {
  reduced: boolean
}

export function Interactables({ reduced }: InteractablesProps): JSX.Element {
  const stage = useJourneyStore((s) => s.currentStage)
  return (
    <group>
      {layoutForStage(stage).map((spec) => {
        switch (spec.kind) {
          case 'shrine':
            return <ShrineStone key={spec.id} spec={spec} reduced={reduced} />
          case 'flagpole':
            return <Flagpole key={spec.id} spec={spec} reduced={reduced} />
          case 'vault':
            return <VaultMonument key={spec.id} spec={spec} reduced={reduced} />
          case 'registry':
            return <RegistryCircle key={spec.id} reduced={reduced} />
          case 'portal':
            return <PortalArch key={spec.id} spec={spec} reduced={reduced} />
        }
      })}
      {!LOW_POWER ? <ProximityLight reduced={reduced} /> : null}
      <HighlightRing reduced={reduced} />
    </group>
  )
}
