// src/game/Nebula.tsx — the Swirling Nebula backdrop (game-design §1 World 1
// grey-box: floating box platforms, fog, point-sprite swirl). One <points>
// draw call for all particles; deterministic seeded layout so frames and
// screenshots are reproducible. Reduced motion: the swirl is STATIC.
// During a trance the world holds its breath — the swirl slows (§2 F1).

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Points } from 'three'
import { useUiStore } from '../state/ui'

const PARTICLE_COUNT = 1400
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

function buildSwirl(): Float32Array {
  const rng = makeRng(0x51ab1e)
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const t = i / PARTICLE_COUNT
    const angle = t * Math.PI * 10 + rng() * 0.8
    const radius = 18 + t * 42 + rng() * 6
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (rng() - 0.5) * 16 + 4 - t * 6
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }
  return positions
}

interface Island {
  position: [number, number, number]
  size: [number, number, number]
}

/** Grey-box floating islands drifting past the plateau edge — static meshes. */
const ISLANDS: readonly Island[] = [
  { position: [-30, 2, -12], size: [7, 2.5, 6] },
  { position: [31, -3, 4], size: [9, 3, 7] },
  { position: [-26, -5, 18], size: [6, 2, 5] },
  { position: [18, 6, -30], size: [5, 2, 5] },
  { position: [-8, 9, -34], size: [8, 2.5, 6] },
  { position: [26, 1, 26], size: [5, 2, 4] },
]

export interface NebulaProps {
  reduced: boolean
}

export function Nebula({ reduced }: NebulaProps): JSX.Element {
  const swirl = useRef<Points>(null)
  const positions = useMemo(buildSwirl, [])

  useFrame((_, delta) => {
    if (reduced) return // static particles under prefers-reduced-motion
    const points = swirl.current
    if (points === null) return
    const breath = useUiStore.getState().mode === 'roam' ? 1 : TRANCE_BREATH
    points.rotation.y += delta * SWIRL_SPEED * breath
  })

  return (
    <group>
      <points ref={swirl} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.35}
          sizeAttenuation
          color="#8b7ff0"
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </points>
      {ISLANDS.map((island, index) => (
        <mesh key={index} position={island.position}>
          <boxGeometry args={island.size} />
          <meshStandardMaterial color="#241d42" emissive="#2c2260" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  )
}
