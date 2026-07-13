// src/game/models.tsx — reusable loaders for the vendored CC0 KayKit glTF props
// (Dungeon Remastered, CC0). Each pack model is loaded once via drei useGLTF
// (cached) and instanced with <Clone> so the eight shrines etc. share one
// download. Shadows are switched on at the source so every clone casts/receives.
// This is the authored-geometry half of the premium pivot: real stone props,
// not primitives, cohesive with the KayKit rogue the player embodies.

import { Suspense, useEffect } from 'react'
import { Clone, useGLTF } from '@react-three/drei'
import type { Group, Object3D } from 'three'
import { AssetBoundary } from './AssetBoundary'
import { asset } from './assets'
import { PALETTE } from './materials'

const PILLAR_URL = asset('models/pillar.glb')
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

function GltfPillar(props: PropProps): JSX.Element {
  const { scene } = useGLTF(PILLAR_URL)
  useEffect(() => enableShadows(scene), [scene])
  return <Clone object={scene} {...props} />
}

/** A primitive stone stand-in (same footprint) — the shrine still reads while the
 *  model streams in, and stays if that download aborts on a slow link. */
function PrimitivePillar(props: PropProps): JSX.Element {
  return (
    <group {...props}>
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.58, 2.7, 8]} />
        <meshStandardMaterial color={PALETTE.stoneCool} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  )
}

/** A KayKit stone pillar (~2.7 u tall, base at y=0). Used as the shrine monument.
 *  Boundary-wrapped so a failed pillar.glb degrades to the primitive, never the world. */
export function Pillar(props: PropProps): JSX.Element {
  return (
    <AssetBoundary fallback={<PrimitivePillar {...props} />} label="pillar.glb">
      <Suspense fallback={<PrimitivePillar {...props} />}>
        <GltfPillar {...props} />
      </Suspense>
    </AssetBoundary>
  )
}

export type { Group }
