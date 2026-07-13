// src/game/rocks.tsx — the vendored Quaternius boulders (CC0, CREDITS.md), as
// drop-in components. These replace primitive dodecahedron "blob rocks"
// everywhere a rock is close enough to be judged (art-elevation run). The
// gltf ships one flat 'Gray'/'Green' material; we re-tint it to the world's
// stone register per call site so boulders sit in each world's palette.
// Self-contained gltf (embedded buffers) — no .bin, no textures, tiny files.

import { useMemo } from 'react'
import { Clone, useGLTF } from '@react-three/drei'
import { Color, Mesh, MeshStandardMaterial } from 'three'
import type { Group } from 'three'
import { asset } from './assets'

export const ROCK_COUNT = 7
export const ROCK_MOSS_COUNT = 3

const rockUrl = (i: number): string => asset(`models/rocks/Rock_${i}.gltf`)
const mossUrl = (i: number): string => asset(`models/rocks/Rock_Moss_${i}.gltf`)

for (let i = 1; i <= ROCK_COUNT; i += 1) useGLTF.preload(rockUrl(i))

/** One sculpted boulder. `index` 1..7 picks the sculpt; `tint` re-colors the
 *  flat pack material into the world's stone register (moss keeps its green). */
export function Rock({
  index,
  position,
  rotationY = 0,
  scale = 1,
  tint = '#8d8378',
  moss = false,
}: {
  index: number
  position: readonly [number, number, number]
  rotationY?: number
  scale?: number
  tint?: string
  moss?: boolean
}): JSX.Element {
  const n = moss
    ? ((index - 1) % ROCK_MOSS_COUNT) + 1
    : ((index - 1) % ROCK_COUNT) + 1
  const { scene } = useGLTF(moss ? mossUrl(n) : rockUrl(n))

  // one re-tinted material per (tint) per component instance — the pack's flat
  // Gray becomes the world's stone; Green (moss) is only darkened toward it
  const tinted = useMemo(() => {
    const stone = new MeshStandardMaterial({
      color: new Color(tint),
      roughness: 0.93,
      metalness: 0.02,
    })
    const clone = scene.clone(true)
    clone.traverse((node) => {
      if (node instanceof Mesh) {
        const name = (node.material as MeshStandardMaterial)?.name ?? ''
        if (!(moss && name === 'Green')) node.material = stone
        node.castShadow = true
        node.receiveShadow = true
      }
    })
    return clone
  }, [scene, tint, moss])

  return (
    <Clone
      object={tinted as unknown as Group}
      position={[position[0], position[1], position[2]]}
      rotation={[0, rotationY, 0]}
      scale={scale}
    />
  )
}
