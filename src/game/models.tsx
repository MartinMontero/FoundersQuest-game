// src/game/models.tsx — reusable loaders for the vendored CC0 KayKit glTF props
// (Dungeon Remastered, CC0). Each pack model is loaded once via drei useGLTF
// (cached) and instanced with <Clone> so the eight shrines etc. share one
// download. Shadows are switched on at the source so every clone casts/receives.
// This is the authored-geometry half of the premium pivot: real stone props,
// not primitives, cohesive with the KayKit rogue the player embodies.

import { useEffect } from 'react'
import { Clone, useGLTF } from '@react-three/drei'
import type { Group, Object3D } from 'three'

const PILLAR_URL = '/models/pillar.glb'
useGLTF.preload(PILLAR_URL)

/** flip on shadow casting/receiving for every mesh under a loaded scene (once) */
function enableShadows(root: Object3D): void {
  root.traverse((o) => {
    const m = o as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean }
    if (m.isMesh === true) {
      m.castShadow = true
      m.receiveShadow = true
    }
  })
}

type PropProps = JSX.IntrinsicElements['group']

/** A KayKit stone pillar (~4 u tall, base at y=0). Used as the shrine monument. */
export function Pillar(props: PropProps): JSX.Element {
  const { scene } = useGLTF(PILLAR_URL)
  useEffect(() => enableShadows(scene), [scene])
  return <Clone object={scene} {...props} />
}

export type { Group }
