// src/game/RavenGuide.tsx — the Cartographer: First Light's raven, PHYSICALLY
// present in the world for the induction's duration (backlog E-10). The QA pass
// called the hand-built cone/sphere bird a toy, so this is the asset-driven
// replacement: the vendored CC0 Quaternius bird (public/models/bird/Pigeon.gltf,
// CREDITS.md) recolored crow-black in code — real feathered geometry where the
// D36 audit once found no rigged raven to use. It perches on a dead snag beside
// the threshold shrine (s1-th), visible from spawn looking toward the dialogue
// frame. Two distinguishing tells survive the recolor: the amber eye (the model's
// Eye_White material, turned ember) and the small rolled chart at its feet. It
// perches until the induction is COMPLETED — for a skipper it stays (Z-3: the
// standing re-entry invitation made flesh; the ReentryPrompt copy offers the
// return). On completion it renders null — the dialogue already says it flies
// ahead, and the W2 rookery carries the corvid continuity.
// Pure scenery: no store writes, no interaction, no text, ZERO new lights.
// All eight baked clips are flight/emote cycles posed wings-spread — there is no
// perch idle — so the bird ships STATIC in a one-time wings-folded pose (baked
// quaternions below) and the motion stays procedural at the GROUP: idle bob
// (≤0.05u) + occasional body-cock derive from clock.elapsedTime only
// (deterministic — no Math.random, no Date.now) and go dead still under reduced
// motion. The software-GL automation tier gets a static box stand-in, the same
// gating the gate/portal chrome uses (CI fps budget).

import { Suspense, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { Quaternion, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { AssetBoundary } from './AssetBoundary'
import { asset } from './assets'
import { STAGE1_LAYOUT } from './contracts'
import { PALETTE } from './materials'
import { IS_AUTOMATION } from './perf'
import { useQuestStore } from '../state/store'
import { useReducedMotion } from './useReducedMotion'
import { useSafeFrame } from './useSafeFrame'

const MODEL_URL = asset('models/bird/Pigeon.gltf')
useGLTF.preload(MODEL_URL)

// ---- the Cartographer's register ----
const RAVEN = '#141821' // corvid feather black with a cool blue cast (sheen below)
const RAVEN_LIT = '#1c2333' // the pigeon's light accent panels, gone raven — one
// shade cooler than the body so the wing/tail layering still reads in silhouette
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

// ---- the real bird: scale, seat, and the wings-folded pose ----
// The glTF's node scales are 1 (verified in the JSON — no FBX×100 carry-over),
// so mesh units ARE world metres: the body runs ~2.17u nose-to-tail and the
// bind pose floats at belly-line y≈1.53 (a flying rig — feet tucked, nothing
// below the belly). The model already faces +z, the way the old beak pointed.

/** world scale — body reads ~0.65u long perched (brief: 0.55–0.7u) */
const BIRD_SCALE = 0.3

/** the rig flies level; a perched corvid sits chest-up, so the whole model
 *  pitches nose-high (radians about x). The tail sweeps down past the crook —
 *  the classic perched-raven line */
const BIRD_PITCH = -0.38

/** where the pitched pose's belly patch lands in rotated model units (solved
 *  offline, same pass as the fold): sunk/slid so that patch SITS on the crook
 *  cap instead of hovering at the rig's flight height */
const SEAT_Y = 1.356
const SEAT_Z = -0.738

/** every baked clip (Flying_Idle, Fast_Flying, the emotes…) holds the wings
 *  spread ~4.1u for flight — frozen on a perch that reads as a landing strobe,
 *  not a resting bird. This one-time pose folds them: extra LOCAL rotations
 *  [x,y,z,w] multiplied onto the bind quaternions of the shoulder/forearm
 *  bones, solved offline against the skinned mesh (wingspan 4.13u → 1.79u,
 *  tips swept back over the tail). Static pose only — NO per-frame bone work;
 *  the living motion stays on the group, per the E-10 contract. (GLTFLoader
 *  strips the '.' from bone names: `Wing1.L` → `Wing1L`.) */
const WING_FOLD: ReadonlyArray<readonly [string, number, number, number, number]> = [
  ['Wing1L', -0.4105, 0, -0.0814, 0.9082],
  ['Wing1R', -0.4105, 0, 0.0814, 0.9082],
  ['Wing2L', 0.0934, 0, 0.1597, 0.9827],
  ['Wing2R', 0.0934, 0, -0.1597, 0.9827],
]

/** recolor the shared-cache clone to corvid, in place. Materials are cloned
 *  before mutation so the drei cache (and any future consumer of the pigeon)
 *  never sees the raven's paint. */
function paintCorvid(root: ReturnType<typeof cloneSkinned>): void {
  const scratch = new Quaternion()
  for (const [bone, x, y, z, w] of WING_FOLD) {
    root.getObjectByName(bone)?.quaternion.multiply(scratch.set(x, y, z, w))
  }
  root.traverse((o) => {
    const mesh = o as Mesh
    if (mesh.isMesh !== true) return
    mesh.castShadow = true
    const source = mesh.material as MeshStandardMaterial
    const mat = source.clone()
    switch (source.name) {
      case 'Pigeon_Main':
      case 'Pigeon_Secondary':
        // near-black with a subtle cool sheen — feathers, not soot
        mat.color.set(RAVEN)
        mat.roughness = 0.55
        mat.metalness = 0.15
        break
      case 'Eye_White':
        // NOT just the eye-whites: this shared material also paints the wing
        // trailing edges, tail band, and collar (verified against the mesh —
        // 996 verts, wingtip to wingtip). Amber here would light the whole
        // wing, so these panels go raven too; the amber tell is delivered by
        // the dedicated eye meshes in <CartographerBird/> instead.
        mat.color.set(RAVEN_LIT)
        mat.roughness = 0.55
        mat.metalness = 0.15
        break
      default:
        // Eye_Black keeps its pupil ink
        break
    }
    mesh.material = mat
  })
}

interface CartographerBirdProps {
  reduced: boolean
}

/** the loaded, folded, corvid-painted bird on its group-level idle. Split out
 *  so useGLTF suspends HERE (inside the local boundary below), never at the
 *  world's own Suspense — the perch and chart hold the spot while it streams. */
function CartographerBird({ reduced }: CartographerBirdProps): JSX.Element {
  const bird = useRef<Group>(null)
  const { scene } = useGLTF(MODEL_URL)

  // SkeletonUtils.clone, NOT .clone(): the mesh is SKINNED, and a plain clone
  // leaves the copy's bones wired to the cached original's skeleton.
  const model = useMemo(() => {
    const root = cloneSkinned(scene)
    paintCorvid(root)
    return root
  }, [scene])

  // a slow perch bob and an occasional body-cock — the gate term opens for a
  // moment roughly every 27s (sin period 2π/0.23), so the cock reads as an
  // inquisitive glance, not a metronome. (The old build tilted a head subgroup;
  // the rigged model keeps ALL motion at the group — bones stay static.)
  // Dead still under reduced motion.
  useSafeFrame(({ clock }) => {
    const b = bird.current
    if (b === null) return
    if (reduced) {
      b.position.y = PERCH_Y
      b.rotation.z = 0
      return
    }
    b.position.y = PERCH_Y + Math.sin(clock.elapsedTime * 1.2) * 0.03
    const gate = Math.max(0, Math.sin(clock.elapsedTime * 0.23) - 0.9) * 10
    b.rotation.z = gate * 0.16
  })

  return (
    <group ref={bird} position={[0.05, PERCH_Y, 0]}>
      {/* dispose=null — geometry/skeleton stay shared with the drei cache */}
      <primitive
        object={model}
        position={[0, -SEAT_Y * BIRD_SCALE, -SEAT_Z * BIRD_SCALE]}
        rotation={[BIRD_PITCH, 0, 0]}
        scale={BIRD_SCALE}
        dispose={null}
      >
        {/* tell 1: the amber eyes — emissive spheres seated in the model's
            Eye_Black almond patches (model-space; children inherit the
            primitive's transform), no light added */}
        {[1, -1].map((side) => (
          <mesh key={side} position={[side * 0.42, 2.18, 0.62]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color={EYE_AMBER}
              emissive={EYE_AMBER}
              emissiveIntensity={1.2}
              roughness={0.4}
              metalness={0}
            />
          </mesh>
        ))}
      </primitive>
    </group>
  )
}

export function RavenGuide(): JSX.Element | null {
  // The raven stays until the induction is COMPLETED (Z-3: for a skipper it
  // keeps the perch — the standing re-entry invitation made flesh; the
  // ReentryPrompt copy already offers the return). Completion alone ends it.
  const live = useQuestStore((s) => s.data.openingCompletedAt === null)
  const reduced = useReducedMotion()

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

      {/* ---- the Cartographer — the real bird; if the glTF stalls or fails on
           a weak link, the perch + chart still hold the spot (world holds) ---- */}
      <AssetBoundary fallback={null} label="cartographer-raven">
        <Suspense fallback={null}>
          <CartographerBird reduced={reduced} />
        </Suspense>
      </AssetBoundary>

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
