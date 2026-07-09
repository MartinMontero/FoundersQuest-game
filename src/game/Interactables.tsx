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
  STAGE1_LAYOUT,
  STAGE1_MILESTONES,
  type InteractableSpec,
} from './contracts'
import { SPEC_BY_ID, activeTargetId, useInteractionStore } from './interaction'
import { PALETTE, TOON_RAMP } from './materials'
import { LOW_POWER } from './perf'
import { useSafeFrame } from './useSafeFrame'

// ---- derived lookups (strings/contracts, built once) ----

const stage1 = STAGES.find((s) => s.stage === 1)
/** question text by qid — canon copy from src/strings, shown on the name chip */
const QUESTION_TEXT: ReadonlyMap<string, string> = new Map(
  (stage1?.questions ?? []).map((q) => [q.id, q.text]),
)
const MILESTONE_LABEL: ReadonlyMap<string, string> = new Map(
  STAGE1_MILESTONES.map((m) => [m.id, m.label]),
)

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
  const answered = useQuestStore((s) => hasInk(s.data.answers['s1']?.[qid]))
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
      g.position.y = 2.6
      g.rotation.y = 0
      return
    }
    g.position.y = 2.6 + Math.sin(clock.elapsedTime * 1.6 + yaw) * 0.09
    g.rotation.y += 0.006
  })

  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {/* base slab */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.0, 1.25, 0.3, 8]} />
        <meshToonMaterial color={PALETTE.stone} gradientMap={TOON_RAMP} />
      </mesh>
      {/* a rune ring cut into the slab, lit by the shrine's state */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <torusGeometry args={[0.52, 0.05, 8, 24]} />
        <meshToonMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={answered ? 1.0 : 0.5}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* the standing stone: a faceted six-sided pillar */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.24, 0.4, 1.7, 6]} />
        <meshToonMaterial
          color={answered ? '#4d4370' : PALETTE.violetDeep}
          emissive={glow}
          emissiveIntensity={answered ? 0.5 : 0.16}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* the capstone */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.42, 0.5, 6, 1]} />
        <meshToonMaterial color={PALETTE.stoneWarm} gradientMap={TOON_RAMP} />
      </mesh>
      {/* the floating glyph, wrapped in a soft glow core that catches bloom
          (full) / reads as a bright emissive point (constrained) */}
      <group ref={glyph} position={[0, 2.6, 0]}>
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
          <meshToonMaterial
            color={glow}
            emissive={glow}
            emissiveIntensity={answered ? 1.3 : 0.9}
            gradientMap={TOON_RAMP}
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
        <meshToonMaterial color="#9a8a86" gradientMap={TOON_RAMP} />
      </mesh>
      {/* the finial */}
      <mesh position={[0, 3.25, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshToonMaterial
          color={PALETTE.amber}
          emissive={PALETTE.amber}
          emissiveIntensity={0.7}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* the banner — a bent cloth plane, hoisted or furled by the milestone */}
      <group ref={banner} position={[0.04, flagY, 0]}>
        <mesh position={[0.46, 0, 0]} rotation={[0, 0, -0.06]}>
          <planeGeometry args={[0.9, 0.55, 4, 1]} />
          <meshToonMaterial
            color={raised ? PALETTE.amber : '#4b4670'}
            emissive={raised ? PALETTE.amber : '#000000'}
            emissiveIntensity={raised ? 0.45 : 0}
            gradientMap={TOON_RAMP}
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
        <meshToonMaterial
          color={PALETTE.violetDeep}
          emissive={PALETTE.violet}
          emissiveIntensity={0.28}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {/* ornate corner posts */}
      {VAULT_POSTS.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0, pz]}>
          <cylinderGeometry args={[0.08, 0.1, 1.02, 6]} />
          <meshToonMaterial color={PALETTE.stoneWarm} gradientMap={TOON_RAMP} />
        </mesh>
      ))}
      {/* a crowning finial */}
      <mesh position={[0, 0.62, 0]}>
        <octahedronGeometry args={[0.17, 0]} />
        <meshToonMaterial
          color={PALETTE.amber}
          emissive={PALETTE.amber}
          emissiveIntensity={locked ? 0.9 : 0.4}
          gradientMap={TOON_RAMP}
        />
      </mesh>
      {locked ? (
        <>
          {/* chains: crossed bands over the lid (01: captured, visible, sealed) */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.72, 0.05, 8, 24]} />
            <meshToonMaterial color="#8b88a8" gradientMap={TOON_RAMP} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.3, 0, 0]}>
            <torusGeometry args={[0.6, 0.05, 8, 24]} />
            <meshToonMaterial color="#8b88a8" gradientMap={TOON_RAMP} />
          </mesh>
          {/* the amber wax seal on the face */}
          <mesh position={[0, -0.05, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshToonMaterial
              color={PALETTE.amberBright}
              emissive={PALETTE.amber}
              emissiveIntensity={1.1}
              gradientMap={TOON_RAMP}
            />
          </mesh>
          <mesh position={[0, -0.05, 0.5]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshToonMaterial
              color={PALETTE.amberBright}
              emissive={PALETTE.amberBright}
              emissiveIntensity={1.2}
              gradientMap={TOON_RAMP}
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
          <meshToonMaterial
            color={tint}
            emissive={crowned ? PALETTE.ember : tint}
            emissiveIntensity={crowned ? 0.6 : 0.1}
            gradientMap={TOON_RAMP}
          />
        </mesh>
        {/* the hood */}
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshToonMaterial
            color={tint}
            emissive={crowned ? PALETTE.emberDeep : '#000000'}
            emissiveIntensity={crowned ? 0.4 : 0}
            gradientMap={TOON_RAMP}
          />
        </mesh>
        {crowned ? (
          <>
            {/* the warning crown */}
            <mesh position={[0, 1.98, 0]}>
              <coneGeometry args={[0.2, 0.32, 6, 1]} />
              <meshToonMaterial
                color={PALETTE.ember}
                emissive={PALETTE.ember}
                emissiveIntensity={1.1}
                gradientMap={TOON_RAMP}
              />
            </mesh>
            {/* a floating warning ember */}
            <mesh position={[0, 2.45, 0]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshToonMaterial
                color={PALETTE.ember}
                emissive={PALETTE.ember}
                emissiveIntensity={1.3}
                gradientMap={TOON_RAMP}
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
        <meshToonMaterial
          color={PALETTE.stone}
          emissive={PALETTE.teal}
          emissiveIntensity={0.35}
          gradientMap={TOON_RAMP}
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
          <meshToonMaterial color={PALETTE.stoneCool} gradientMap={TOON_RAMP} />
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
  return (
    <group>
      {STAGE1_LAYOUT.map((spec) => {
        switch (spec.kind) {
          case 'shrine':
            return <ShrineStone key={spec.id} spec={spec} reduced={reduced} />
          case 'flagpole':
            return <Flagpole key={spec.id} spec={spec} reduced={reduced} />
          case 'vault':
            return <VaultMonument key={spec.id} spec={spec} reduced={reduced} />
          case 'registry':
            return <RegistryCircle key={spec.id} reduced={reduced} />
        }
      })}
      {!LOW_POWER ? <ProximityLight reduced={reduced} /> : null}
      <HighlightRing reduced={reduced} />
    </group>
  )
}
