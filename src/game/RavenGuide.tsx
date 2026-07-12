// src/game/RavenGuide.tsx — the Cartographer: First Light's raven, PHYSICALLY
// present in the world for the induction's duration (backlog E-10; the audit
// (D36) confirmed no CC0 rigged raven exists, so this is the sanctioned
// stylized in-engine build). Same silhouette language as the W2 fellowship
// ravens — cone body, sphere head, cone beak — at ~1.5x scale, perched on a
// dead snag beside the threshold shrine (s1-th), visible from spawn looking
// toward the dialogue frame. Exactly two distinguishing tells: a tiny amber
// eye and a small rolled chart at its feet. It exists ONLY while First Light
// is live (openingCompletedAt and openingSkippedAt both null); the moment the
// induction completes or is skipped it renders null — the dialogue already
// says it flies ahead, and the W2 rookery carries the corvid continuity.
// Pure scenery: no store writes, no interaction, no text, ZERO new lights.
// Idle bob (≤0.05u) + occasional head tilt derive from clock.elapsedTime only
// (deterministic — no Math.random, no Date.now) and go dead still under
// reduced motion. The software-GL automation tier gets a static box stand-in,
// the same gating the gate/portal chrome uses (CI fps budget).

import { useRef } from 'react'
import type { Group } from 'three'
import { STAGE1_LAYOUT } from './contracts'
import { PALETTE } from './materials'
import { IS_AUTOMATION } from './perf'
import { useQuestStore } from '../state/store'
import { useReducedMotion } from './useReducedMotion'
import { useSafeFrame } from './useSafeFrame'

// ---- the Cartographer's register ----
const RAVEN = '#0b0e14' // corvid silhouette black — the W2 rookery's exact tone
const BEAK = '#39445a' // the cold beak tone the W2 ravens wear
const EYE_AMBER = '#f2b64a' // the amber eye — emissive-looking, no light added
const CHART = '#ecdfc2' // parchment — the rolled chart at its feet
const SNAG = '#4a3b2e' // warm dead-wood, W1's register (not W2's ink timber)
const SNAG_DEEP = '#3a2e24' // bark shadow tone

// ---- deterministic placement: a perch beside the threshold shrine ----
// The first shrine (s1-th) is the outer island nearest spawn; the perch stands
// just off its pillar, between shrine and spawn, so the raven sits inside the
// player's opening view of the dialogue frame (spawn ~[2,1.2,18] facing −z).

const THRESHOLD: readonly [number, number, number] = STAGE1_LAYOUT.find(
  (s) => s.id === 's1-th',
)?.position ?? [0, 0, 14]

/** perch anchor — offset toward spawn, clear of the shrine pillar's footprint.
 *  Pulled ~2m spawn-ward after the first feel capture: at the shrine's side the
 *  bird read as a speck from the opening camera (E-10 is a PRESENCE upgrade). */
const ANCHOR: readonly [number, number, number] = [
  THRESHOLD[0] + 1.35,
  THRESHOLD[1],
  THRESHOLD[2] + 2.15,
]

/** the raven faces spawn — atan2 of (spawn − anchor), baked as a constant */
const FACE_SPAWN_YAW = 0.19

/** top of the snag's crook — where the bird sits and the bob centres */
const PERCH_Y = 1.64

export function RavenGuide(): JSX.Element | null {
  // First Light live = neither completed nor skipped; either stamp ends it
  const live = useQuestStore(
    (s) => s.data.openingCompletedAt === null && s.data.openingSkippedAt === null,
  )
  const reduced = useReducedMotion()
  const bird = useRef<Group>(null)
  const head = useRef<Group>(null)

  // a slow perch bob and an occasional head tilt — the gate term opens for a
  // moment roughly every 27s (sin period 2π/0.23), so the tilt reads as an
  // inquisitive glance, not a metronome. Dead still under reduced motion.
  useSafeFrame(({ clock }) => {
    const b = bird.current
    if (b !== null) {
      b.position.y = reduced ? PERCH_Y : PERCH_Y + Math.sin(clock.elapsedTime * 1.2) * 0.03
    }
    const h = head.current
    if (h !== null) {
      if (reduced) {
        h.rotation.z = 0
      } else {
        const gate = Math.max(0, Math.sin(clock.elapsedTime * 0.23) - 0.9) * 10
        h.rotation.z = gate * 0.3
      }
    }
  })

  if (!live) return null

  // the software-GL automation/CI tier gets a minimal static stand-in — the
  // perch, bird, and per-frame motion are real-tier chrome (same gating the
  // portal gate uses); induction self-play still sees an object at the anchor.
  if (IS_AUTOMATION) {
    return (
      <group position={[ANCHOR[0], ANCHOR[1], ANCHOR[2]]}>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[0.5, 1.9, 0.5]} />
          <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.85} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={[ANCHOR[0], ANCHOR[1], ANCHOR[2]]} rotation={[0, FACE_SPAWN_YAW, 0]}>
      {/* ---- the dead snag perch: root flare, leaning post, crook cap ---- */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <cylinderGeometry args={[0.17, 0.28, 0.22, 7]} />
        <meshStandardMaterial color={SNAG_DEEP} roughness={0.85} metalness={0.03} />
      </mesh>
      <mesh position={[0.02, 0.82, -0.01]} rotation={[0.03, 0, -0.07]} castShadow>
        <cylinderGeometry args={[0.07, 0.14, 1.45, 7]} />
        <meshStandardMaterial color={SNAG} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* a snapped side stub — the corvid-snag silhouette note */}
      <mesh position={[-0.08, 1.15, 0.05]} rotation={[0.5, 0, 0.7]}>
        <cylinderGeometry args={[0.02, 0.05, 0.34, 5]} />
        <meshStandardMaterial color={SNAG_DEEP} roughness={0.85} metalness={0.03} />
      </mesh>
      {/* the crook cap the bird stands on */}
      <mesh position={[0.05, 1.58, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.07, 0.12, 6]} />
        <meshStandardMaterial color={SNAG} roughness={0.85} metalness={0.03} />
      </mesh>

      {/* ---- the Cartographer — W2's raven silhouette, raven-large (2.2x;
           1.5x read as a speck from the opening camera in the feel capture) ---- */}
      <group ref={bird} position={[0.05, PERCH_Y, 0]} scale={2.2}>
        {/* body — tilted so the cone tip reads as the swept tail */}
        <mesh position={[0, 0.08, 0]} rotation={[-1.25, 0, 0]} castShadow>
          <coneGeometry args={[0.075, 0.22, 6]} />
          <meshStandardMaterial color={RAVEN} roughness={0.75} metalness={0.02} />
        </mesh>
        {/* head group — pivots at the neck for the occasional tilt */}
        <group ref={head} position={[0, 0.15, 0.09]}>
          <mesh castShadow>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={RAVEN} roughness={0.75} metalness={0.02} />
          </mesh>
          {/* beak */}
          <mesh position={[0, -0.01, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.02, 0.08, 5]} />
            <meshStandardMaterial color={BEAK} roughness={0.72} metalness={0.05} />
          </mesh>
          {/* tell 1: the tiny amber eye — emissive material, no light added */}
          <mesh position={[0.045, 0.012, 0.028]}>
            <sphereGeometry args={[0.014, 6, 6]} />
            <meshStandardMaterial
              color={EYE_AMBER}
              emissive={EYE_AMBER}
              emissiveIntensity={1.2}
              roughness={0.4}
              metalness={0}
            />
          </mesh>
        </group>
      </group>

      {/* ---- tell 2: the small rolled chart, pinned at its feet ---- */}
      <group position={[0.13, 1.675, 0.11]} rotation={[0, -0.35, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.34, 8]} />
          <meshStandardMaterial color={CHART} roughness={0.8} metalness={0.02} />
        </mesh>
      </group>
    </group>
  )
}
