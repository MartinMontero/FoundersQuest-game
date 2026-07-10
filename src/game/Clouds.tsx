// src/game/Clouds.tsx — soft cloud banks ringing the plateau at the islands'
// distance, the benchmark's "sky islands adrift in cloud" register. Each bank is
// a cluster of billboarded soft sprites (the code-built radial sprite — no
// texture file, CSP-safe), warm-tinted to sit under the sunset HDR + nebula
// glow. The whole ring drifts slowly around Y (frozen under reduced motion). Far
// sky, so fog-independent and depth-write off. Skipped on the automation tier.

import { useMemo, useRef } from 'react'
import { AdditiveBlending, type Group, NormalBlending } from 'three'
import { makeSoftSprite, PALETTE } from './materials'
import { useSafeFrame } from './useSafeFrame'

const CLOUD_SPRITE = makeSoftSprite(128, 1.35)
const BANK_COUNT = 14
const PUFFS_PER_BANK = 6
const DRIFT = 0.006 // rad/s — a slow procession along the horizon

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

interface Puff {
  pos: [number, number, number]
  scale: number
  opacity: number
  warm: boolean
}

function buildPuffs(): Puff[] {
  const rng = makeRng(0xc10d)
  const out: Puff[] = []
  for (let b = 0; b < BANK_COUNT; b += 1) {
    const angle = (b / BANK_COUNT) * Math.PI * 2 + rng() * 0.3
    const dist = 96 + rng() * 42
    const baseY = 6 + rng() * 26
    const cx = Math.cos(angle) * dist
    const cz = Math.sin(angle) * dist
    for (let p = 0; p < PUFFS_PER_BANK; p += 1) {
      out.push({
        pos: [
          cx + (rng() - 0.5) * 34,
          baseY + (rng() - 0.5) * 10,
          cz + (rng() - 0.5) * 34,
        ],
        scale: 22 + rng() * 30,
        opacity: 0.28 + rng() * 0.3,
        warm: rng() > 0.45,
      })
    }
  }
  return out
}

export interface CloudsProps {
  reduced: boolean
}

export function Clouds({ reduced }: CloudsProps): JSX.Element {
  const group = useRef<Group>(null)
  const puffs = useMemo(buildPuffs, [])

  useSafeFrame((_, delta) => {
    const g = group.current
    if (g === null || reduced) return
    g.rotation.y += delta * DRIFT
  })

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} position={p.pos} scale={[p.scale, p.scale * 0.62, 1]}>
          <spriteMaterial
            map={CLOUD_SPRITE}
            color={p.warm ? PALETTE.skyGlow : '#c9b7c9'}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            blending={p.warm ? NormalBlending : AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  )
}
