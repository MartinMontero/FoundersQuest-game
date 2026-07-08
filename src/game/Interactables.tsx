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

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import { DoubleSide } from 'three'
import type { Group, Mesh } from 'three'
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

// ---- shrine stones ----

interface ShrineProps {
  spec: InteractableSpec
}

function ShrineStone({ spec }: ShrineProps): JSX.Element {
  const qid = spec.qid ?? spec.id
  const answered = useQuestStore((s) => hasInk(s.data.answers['s1']?.[qid]))
  const [x, y, z] = spec.position
  return (
    <group position={[x, y, z]}>
      {/* base slab */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.1, 1.3, 0.3, 8]} />
        <meshStandardMaterial color="#2a2447" />
      </mesh>
      {/* standing stone: faint glow unanswered, inked/lit answered (§2 F0) */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.9, 1.5, 0.35]} />
        <meshStandardMaterial
          color={answered ? '#4d4370' : '#38305c'}
          emissive={answered ? '#e8b34b' : '#6f5cf0'}
          emissiveIntensity={answered ? 0.65 : 0.18}
        />
      </mesh>
    </group>
  )
}

// ---- milestone flagpoles ----

function Flagpole({ spec }: ShrineProps): JSX.Element {
  const milestoneId = spec.milestoneId ?? spec.id
  const raised = useQuestStore((s) => s.data.milestones[milestoneId] === true)
  const [x, y, z] = spec.position
  const flagY = raised ? 2.7 : 1.0
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#8f89b8" />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#e8b34b" emissive="#e8b34b" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.5, flagY, 0]}>
        <planeGeometry args={[0.9, 0.55]} />
        <meshStandardMaterial
          color={raised ? '#e8b34b' : '#4b4670'}
          emissive={raised ? '#c78f1f' : '#000000'}
          emissiveIntensity={raised ? 0.5 : 0}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

// ---- the Vault ----

interface VaultProps {
  spec: InteractableSpec
  reduced: boolean
}

function VaultMonument({ spec, reduced }: VaultProps): JSX.Element {
  const locked = useQuestStore((s) => !s.data.vaultUnlocked)
  const [x, y, z] = spec.position

  const chest = (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[1.4, 0.9, 0.9]} />
        <meshStandardMaterial color="#1d1834" emissive="#31285e" emissiveIntensity={0.3} />
      </mesh>
      {locked ? (
        <>
          {/* chains: crossed bands over the lid (01: captured, visible, sealed) */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.75, 0.05, 8, 24]} />
            <meshStandardMaterial color="#767394" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.35, 0, 0]}>
            <torusGeometry args={[0.62, 0.05, 8, 24]} />
            <meshStandardMaterial color="#767394" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* the lock, facing the spiral */}
          <mesh position={[0, -0.1, 0.5]}>
            <boxGeometry args={[0.28, 0.34, 0.12]} />
            <meshStandardMaterial color="#3b3557" emissive="#d9484f" emissiveIntensity={0.8} />
          </mesh>
        </>
      ) : null}
    </group>
  )

  // drei Float ok — but no idle motion at all under reduced motion
  if (reduced) return chest
  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.7} floatingRange={[-0.15, 0.15]}>
      {chest}
    </Float>
  )
}

// ---- the Registry circle + guardian figures ----

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
}

function GuardianFigure({
  assumption,
  evidence,
  crowned,
  reduced,
  position,
}: GuardianProps): JSX.Element {
  const group = useRef<Group>(null)
  const weight = IMPORTANCE_WEIGHT[assumption.importance]
  const scale = 0.65 + weight * 0.35 // dies=3 large · wobbles=2 · shrugs=1 small
  const tint = TIER_TINT[tierOf(assumption, evidence)]

  // riskiest: a larger idle animation — a slow bob, static under reduced motion
  useFrame(({ clock }) => {
    const g = group.current
    if (g === null) return
    g.position.y = crowned && !reduced ? Math.sin(clock.elapsedTime * 2) * 0.08 : 0
  })

  return (
    <group position={position}>
      <group ref={group} scale={scale}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.22, 0.3, 1.1, 10]} />
          <meshStandardMaterial
            color={tint}
            emissive={crowned ? '#e8b34b' : tint}
            emissiveIntensity={crowned ? 0.45 : 0.12}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshStandardMaterial color={tint} metalness={0.5} roughness={0.5} />
        </mesh>
        {crowned ? (
          <mesh position={[0, 1.72, 0]}>
            <coneGeometry args={[0.2, 0.3, 6]} />
            <meshStandardMaterial color="#e8b34b" emissive="#e8b34b" emissiveIntensity={0.8} />
          </mesh>
        ) : null}
      </group>
      {crowned ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.5 * scale, 0.62 * scale, 24]} />
          <meshBasicMaterial color="#e8b34b" transparent opacity={0.7} />
        </mesh>
      ) : null}
    </group>
  )
}

function RegistryCircle({ reduced }: { reduced: boolean }): JSX.Element {
  const assumptions = useQuestStore((s) => s.data.assumptions)
  const evidence = useQuestStore((s) => s.data.evidence)
  const riskiest = useRiskiest()
  const standing = assumptions.filter((a) => a.status !== 'invalidated')
  const [cx, cy, cz] = REGISTRY_POSITION

  return (
    <group position={[cx, cy, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.9, 3.15, 40]} />
        <meshBasicMaterial color="#6f5cf0" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.16, 12]} />
        <meshStandardMaterial color="#2a2447" emissive="#6f5cf0" emissiveIntensity={0.25} />
      </mesh>
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
  useFrame(({ clock }) => {
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
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, z]}>
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
            return <ShrineStone key={spec.id} spec={spec} />
          case 'flagpole':
            return <Flagpole key={spec.id} spec={spec} />
          case 'vault':
            return <VaultMonument key={spec.id} spec={spec} reduced={reduced} />
          case 'registry':
            return <RegistryCircle key={spec.id} reduced={reduced} />
        }
      })}
      <HighlightRing reduced={reduced} />
    </group>
  )
}
