// src/game/Nebula.tsx — the deep-space backdrop: a large gradient sky dome
// (violet zenith → indigo horizon, a warm golden-hour band banked low, and a
// soft drifting aurora), a field of star particles, and toon-shaded floating
// rock islands at the plateau's edge. One <points> draw call for all stars;
// deterministic seeded layout so frames and screenshots are reproducible.
// Reduced motion: the star swirl is STATIC and the aurora stops drifting.
// During a trance the world holds its breath — the swirl slows (§2 F1).

import { useCallback, useMemo, useRef } from 'react'
import { useSafeFrame } from './useSafeFrame'
import { AdditiveBlending, BackSide, Color, type Mesh, type Points, Vector3 } from 'three'
import { useUiStore } from '../state/ui'
import { makeSoftSprite, PALETTE } from './materials'
import { LOW_POWER } from './perf'

// fewer stars under automation / software-GL (overdraw is costly there)
const PARTICLE_COUNT = LOW_POWER ? 520 : 1600
const SWIRL_SPEED = 0.012 // rad/s — a slow drift, never a shake
const TRANCE_BREATH = 0.15 // the world holds its breath in trance

/** Tiny deterministic LCG so the nebula is identical every boot. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

/** One shared soft-round sprite for every star (built once). */
const STAR_SPRITE = makeSoftSprite(64, 2.6)
/** A larger, softer sprite for the sun's warm halo (gentler falloff). */
const SUN_SPRITE = makeSoftSprite(128, 1.5)

interface StarField {
  positions: Float32Array
  colors: Float32Array
}

/** Stars scattered across the upper sky dome (NOT a tight spiral — the old
 * spiral packed a hot inner arm that bloomed into a pale smear). Density thins
 * toward the horizon; a warm gold / teal / pale-blue mix with a handful of
 * brighter beacons for Bloom to catch. Each point is drawn as a soft round
 * sprite, never a hard square. */
function buildStars(): StarField {
  const rng = makeRng(0x51ab1e)
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const warm = new Color(PALETTE.amberBright)
  const cool = new Color(PALETTE.teal)
  const pale = new Color('#c9ccff')
  const tint = new Color()
  const dir = new Vector3()
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    // scatter over a hemisphere shell, biased upward so few sit at the horizon
    const y = Math.pow(rng(), 0.7) // thin near the horizon, dense overhead
    dir
      .set(rng() * 2 - 1, y * 1.15 + 0.04, rng() * 2 - 1)
      .normalize()
    const dist = 150 + rng() * 130
    positions[i * 3] = dir.x * dist
    positions[i * 3 + 1] = dir.y * dist
    positions[i * 3 + 2] = dir.z * dist
    // gold dust + teal runes accented over a cool pale field (pillars 1 + 4)
    const pick = rng()
    tint.copy(pale)
    if (pick > 0.82) tint.copy(warm)
    else if (pick > 0.68) tint.copy(cool)
    // most stars are modest; ~10% are bright beacons that bloom
    const beacon = rng() > 0.9
    const bright = beacon ? 1.5 + rng() * 0.8 : 0.4 + rng() * 0.45
    colors[i * 3] = tint.r * bright
    colors[i * 3 + 1] = tint.g * bright
    colors[i * 3 + 2] = tint.b * bright
  }
  return { positions, colors }
}

// ---- the gradient sky dome ----

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uAurora;
  uniform float uTime;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(t, 1.25));
    // warm golden-hour glow banked low in the sky
    float glow = smoothstep(0.26, -0.14, h);
    col = mix(col, uGlow, glow * 0.6);
    // a soft aurora band drifting across the mid sky
    float band = exp(-pow((h - 0.16) * 5.5, 2.0));
    float ripple = 0.55 + 0.45 * sin(vDir.x * 2.6 + uTime * 0.18) * sin(vDir.z * 2.1 - uTime * 0.12);
    col += uAurora * band * ripple * 0.32;
    gl_FragColor = vec4(col, 1.0);
  }
`

// low power: a two-stop gradient plus a single cheap golden-hour glow band —
// one smoothstep, no pow/exp/sin per pixel, so phones still get the warm OoT
// "air" instead of a flat, cold console gradient.
const SKY_FRAG_CHEAP = /* glsl */ `
  precision mediump float;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  varying vec3 vDir;
  void main() {
    float t = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uHorizon, uZenith, t);
    float glow = smoothstep(0.30, -0.12, vDir.y);
    col = mix(col, uGlow, glow * 0.5);
    gl_FragColor = vec4(col, 1.0);
  }
`

function SkyDome({ reduced }: { reduced: boolean }): JSX.Element {
  // the same object the material holds by reference — mutating uTime.value here
  // drives the aurora without a per-frame setState
  const uniforms = useMemo(
    () => ({
      uZenith: { value: new Color(PALETTE.skyZenith) },
      uHorizon: { value: new Color(PALETTE.skyHorizon) },
      uGlow: { value: new Color(PALETTE.skyGlow) },
      uAurora: { value: new Color(PALETTE.aurora) },
      uTime: { value: 0 },
    }),
    [],
  )

  useSafeFrame((_, delta) => {
    if (reduced || LOW_POWER) return // aurora holds still under reduced motion / low power
    uniforms.uTime.value += delta
  })

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[300, 32, 24]} />
      <shaderMaterial
        vertexShader={SKY_VERT}
        fragmentShader={LOW_POWER ? SKY_FRAG_CHEAP : SKY_FRAG}
        uniforms={uniforms}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ---- the distant sun: a warm disc banked low in the nebula ----

/** World direction of the sun, up-left over the far horizon. It anchors the
 * god-ray shafts (full tier) and reads as the warm light source the whole
 * plateau is lit by — the OoT golden-hour key made literal. */
export const SUN_POSITION: [number, number, number] = [-58, 30, -140]

export interface SunDiscProps {
  /** hands the sun mesh up so <PostFx/> can key God Rays off it */
  onReady?: (mesh: Mesh | null) => void
}

export function SunDisc({ onReady }: SunDiscProps): JSX.Element {
  // a STABLE ref callback (onReady is a useState setter, stable across renders):
  // attaches the sun mesh once on mount, detaches once on unmount. An inline
  // arrow would change identity every render, thrashing the ref and rebuilding
  // God Rays each frame.
  const setSunRef = useCallback((m: Mesh | null) => onReady?.(m), [onReady])
  return (
    <group position={SUN_POSITION}>
      {/* the incandescent core — the God-Rays occlusion source */}
      <mesh ref={setSunRef} frustumCulled={false}>
        <sphereGeometry args={[7, 28, 28]} />
        <meshBasicMaterial color={PALETTE.sunCore} toneMapped={false} fog={false} />
      </mesh>
      {/* a soft warm halo as a billboarded additive sprite — a smooth glow that
          reads on EVERY tier (the old translucent sphere only looked right once
          full-tier Bloom blew it out; on a phone it was a hard fried-egg ring) */}
      <sprite scale={[62, 62, 1]}>
        <spriteMaterial
          map={SUN_SPRITE}
          color={PALETTE.sun}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </sprite>
      {/* a tighter warm inner bloom to seat the core in the glow */}
      <sprite scale={[26, 26, 1]}>
        <spriteMaterial
          map={SUN_SPRITE}
          color={PALETTE.sunCore}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </sprite>
    </group>
  )
}

// ---- floating rock islands ----

interface Island {
  position: [number, number, number]
  radius: number
  depth: number
  yaw: number
  tilt: number
}

/** Floating islets ringing the plateau: a grassy top cap over a torn rocky
 * keel, lit warm and underlit faint violet so they read as land adrift in the
 * nebula — not the dark dodecahedron blobs of the grey-box pass. Pushed out and
 * up so they sit as background, never crowding the play space. */
const ISLANDS: readonly Island[] = [
  { position: [-42, 7, -26], radius: 5.5, depth: 6, yaw: 0.4, tilt: 0.12 },
  { position: [46, 3, -14], radius: 6.5, depth: 7, yaw: -0.7, tilt: -0.1 },
  { position: [-38, -2, 30], radius: 4.8, depth: 5, yaw: 1.1, tilt: 0.14 },
  { position: [30, 11, -44], radius: 4.2, depth: 5, yaw: -0.3, tilt: -0.08 },
  { position: [-14, 15, -50], radius: 5.8, depth: 6.5, yaw: 0.8, tilt: 0.1 },
  { position: [40, 8, 34], radius: 4.4, depth: 5, yaw: -1.2, tilt: -0.12 },
]

function RockIsland({ island }: { island: Island }): JSX.Element {
  const { radius, depth } = island
  return (
    <group position={island.position} rotation={[island.tilt, island.yaw, 0]}>
      {/* the grassy top cap — a low mossy disc, warm at its lit rim */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[radius, radius * 0.92, 0.5, 12]} />
        <meshStandardMaterial color={PALETTE.moss} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* a soft grassy dome so the cap isn't a flat lid */}
      <mesh position={[0, 0.36, 0]} scale={[1, 0.42, 1]}>
        <sphereGeometry args={[radius * 0.86, 16, 12]} />
        <meshStandardMaterial color={PALETTE.mossWarm} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* the torn rocky keel — a faceted taper falling into the void */}
      <mesh position={[0, -depth * 0.42, 0]} rotation={[Math.PI, island.yaw * 0.5, 0]}>
        <coneGeometry args={[radius * 0.82, depth, 7, 2]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* a broken lower shard for silhouette irregularity */}
      <mesh position={[radius * 0.28, -depth * 0.82, radius * 0.1]} rotation={[Math.PI, 0.6, 0.2]}>
        <coneGeometry args={[radius * 0.36, depth * 0.55, 5, 1]} />
        <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* a faint violet underglow — the magic keeping it aloft */}
      <mesh position={[0, -depth * 0.5, 0]}>
        <sphereGeometry args={[radius * 0.5, 12, 12]} />
        <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}

export interface NebulaProps {
  reduced: boolean
}

export function Nebula({ reduced }: NebulaProps): JSX.Element {
  const swirl = useRef<Points>(null)
  const stars = useMemo(buildStars, [])

  useSafeFrame((_, delta) => {
    if (reduced) return // static particles under prefers-reduced-motion
    const points = swirl.current
    if (points === null) return
    const breath = useUiStore.getState().mode === 'roam' ? 1 : TRANCE_BREATH
    points.rotation.y += delta * SWIRL_SPEED * breath
  })

  return (
    <group>
      <SkyDome reduced={reduced} />
      <points ref={swirl} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={stars.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={stars.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={LOW_POWER ? 2.2 : 2.8}
          map={STAR_SPRITE}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
        />
      </points>
      {ISLANDS.map((island, index) => (
        <RockIsland key={index} island={island} />
      ))}
    </group>
  )
}
