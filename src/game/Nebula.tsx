// src/game/Nebula.tsx — the deep-space backdrop: a large gradient sky dome
// (violet zenith → indigo horizon, a warm golden-hour band banked low, and a
// soft drifting aurora), a field of star particles, and toon-shaded floating
// rock islands at the plateau's edge. One <points> draw call for all stars;
// deterministic seeded layout so frames and screenshots are reproducible.
// Reduced motion: the star swirl is STATIC and the aurora stops drifting.
// During a trance the world holds its breath — the swirl slows (§2 F1).

import { useMemo, useRef } from 'react'
import { useSafeFrame } from './useSafeFrame'
import { BackSide, Color, type Points } from 'three'
import { useUiStore } from '../state/ui'
import { PALETTE, TOON_RAMP } from './materials'
import { LOW_POWER } from './perf'

// fewer stars under automation / software-GL (overdraw is costly there)
const PARTICLE_COUNT = LOW_POWER ? 400 : 1400
const SWIRL_SPEED = 0.02 // rad/s — a slow drift, never a shake
const TRANCE_BREATH = 0.15 // the world holds its breath in trance

/** Tiny deterministic LCG so the nebula is identical every boot. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

interface StarField {
  positions: Float32Array
  colors: Float32Array
}

/** Star particles swept into a slow galactic spiral, tinted warm↔cool with a
 * few brighter embers that Bloom will catch. */
function buildStars(): StarField {
  const rng = makeRng(0x51ab1e)
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const warm = new Color(PALETTE.amberBright)
  const cool = new Color(PALETTE.teal)
  const pale = new Color('#cdd0ff')
  const tint = new Color()
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const t = i / PARTICLE_COUNT
    const angle = t * Math.PI * 10 + rng() * 0.8
    const radius = 18 + t * 42 + rng() * 6
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (rng() - 0.5) * 16 + 4 - t * 6
    positions[i * 3 + 2] = Math.sin(angle) * radius
    const pick = rng()
    tint.copy(pale)
    if (pick > 0.82) tint.copy(warm)
    else if (pick > 0.62) tint.copy(cool)
    const bright = 0.55 + rng() * 0.6
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
    float glow = smoothstep(0.22, -0.12, h);
    col = mix(col, uGlow, glow * 0.55);
    // a soft aurora band drifting across the mid sky
    float band = exp(-pow((h - 0.16) * 5.5, 2.0));
    float ripple = 0.55 + 0.45 * sin(vDir.x * 2.6 + uTime * 0.18) * sin(vDir.z * 2.1 - uTime * 0.12);
    col += uAurora * band * ripple * 0.32;
    gl_FragColor = vec4(col, 1.0);
  }
`

// low power: a plain two-stop gradient, no pow/exp/smoothstep/sin per pixel
const SKY_FRAG_CHEAP = /* glsl */ `
  precision mediump float;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    float t = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(mix(uHorizon, uZenith, t), 1.0);
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

// ---- floating rock islands ----

interface Island {
  position: [number, number, number]
  size: [number, number, number]
  yaw: number
}

/** Grey-box floating islands, now toon-shaded rock chunks, drifting past the
 * plateau edge — static meshes with a little rotational irregularity. */
const ISLANDS: readonly Island[] = [
  { position: [-30, 2, -12], size: [7, 2.5, 6], yaw: 0.4 },
  { position: [31, -3, 4], size: [9, 3, 7], yaw: -0.7 },
  { position: [-26, -5, 18], size: [6, 2, 5], yaw: 1.1 },
  { position: [18, 6, -30], size: [5, 2, 5], yaw: -0.3 },
  { position: [-8, 9, -34], size: [8, 2.5, 6], yaw: 0.8 },
  { position: [26, 1, 26], size: [5, 2, 4], yaw: -1.2 },
]

function RockIsland({ island }: { island: Island }): JSX.Element {
  const [w, h, d] = island.size
  return (
    <group position={island.position} rotation={[0, island.yaw, 0]}>
      {/* main mass — a chunky faceted boulder */}
      <mesh rotation={[0.12, 0.5, -0.08]}>
        <dodecahedronGeometry args={[Math.max(w, d) * 0.55, 0]} />
        <meshToonMaterial color={PALETTE.stone} gradientMap={TOON_RAMP} />
      </mesh>
      {/* a tapered underside so it reads as a torn floating shard */}
      <mesh position={[0, -h * 0.7, 0]} rotation={[Math.PI, island.yaw, 0]}>
        <coneGeometry args={[Math.max(w, d) * 0.42, h * 1.6, 6, 1]} />
        <meshToonMaterial color={PALETTE.violetDeep} gradientMap={TOON_RAMP} />
      </mesh>
      {/* a smaller companion chunk for silhouette irregularity */}
      <mesh position={[w * 0.45, h * 0.25, d * 0.2]}>
        <dodecahedronGeometry args={[Math.max(w, d) * 0.22, 0]} />
        <meshToonMaterial
          color={PALETTE.stoneWarm}
          emissive={PALETTE.violet}
          emissiveIntensity={0.12}
          gradientMap={TOON_RAMP}
        />
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
          size={0.6}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </points>
      {ISLANDS.map((island, index) => (
        <RockIsland key={index} island={island} />
      ))}
    </group>
  )
}
