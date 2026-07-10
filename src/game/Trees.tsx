// src/game/Trees.tsx — scattered CC0 trees (Quaternius "Ultimate Nature",
// external .gltf + .bin + PBR bark/leaf textures — all same-origin, so the CSP
// holds and no blob: fetch is involved). Two variants are loaded once and
// <Clone>d across a deterministic scatter that avoids the interactable
// footprints. Static (no wind) and shadow-casting; mounted only off the CI
// software-GL tier (the parent gates it) so automation never loads the ~4 MB of
// bark textures. Pushes World 1 toward the benchmark's savanna.

import { useEffect, useMemo } from 'react'
import { Clone, useGLTF } from '@react-three/drei'
import type { Object3D } from 'three'
import { STAGE1_LAYOUT } from './contracts'
import { RENDER_TIER } from './perf'

const TREE_A = '/models/trees/CommonTree_1.gltf'
const TREE_B = '/models/trees/CommonTree_5.gltf'
useGLTF.preload(TREE_A)
useGLTF.preload(TREE_B)

const TREE_COUNT = RENDER_TIER === 'full' ? 16 : 10
const PLATEAU_RADIUS = 24

function enableShadows(root: Object3D): void {
  root.traverse((o) => {
    const m = o as { isMesh?: boolean; castShadow?: boolean }
    if (m.isMesh === true) m.castShadow = true
  })
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const KEEPOUT: readonly [number, number][] = STAGE1_LAYOUT.map((s) => [s.position[0], s.position[2]])
function clearOf(x: number, z: number): boolean {
  for (const [kx, kz] of KEEPOUT) if (Math.hypot(x - kx, z - kz) < 4) return false
  return true
}

interface TreePlacement {
  pos: [number, number, number]
  yaw: number
  scale: number
  variant: 0 | 1
}

function buildPlacements(count: number): TreePlacement[] {
  const rng = makeRng(0x77ee)
  const out: TreePlacement[] = []
  let guard = 0
  while (out.length < count && guard < count * 30) {
    guard += 1
    const r = 6 + rng() * (PLATEAU_RADIUS - 8)
    const a = rng() * Math.PI * 2
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!clearOf(x, z)) continue
    out.push({
      pos: [x, 0, z],
      yaw: rng() * Math.PI * 2,
      scale: 0.9 + rng() * 0.7,
      variant: rng() > 0.5 ? 1 : 0,
    })
  }
  return out
}

export function Trees(): JSX.Element {
  const a = useGLTF(TREE_A)
  const b = useGLTF(TREE_B)
  useEffect(() => {
    enableShadows(a.scene)
    enableShadows(b.scene)
  }, [a.scene, b.scene])
  const placements = useMemo(() => buildPlacements(TREE_COUNT), [])
  return (
    <group>
      {placements.map((p, i) => (
        <Clone
          key={i}
          object={(p.variant === 1 ? b : a).scene}
          position={p.pos}
          rotation={[0, p.yaw, 0]}
          scale={p.scale}
        />
      ))}
    </group>
  )
}
