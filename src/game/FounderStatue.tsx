// src/game/FounderStatue.tsx — a cast of the FOUNDER's own rigged model,
// frozen mid-idle, every surface swapped for one caller-supplied material.
// QA round 4: every humanoid NPC must meet the founder's quality bar — no
// more capsule ghosts or cone silhouettes. The Registry's guardians become
// petrified founders (tier-tinted stone); the Shadow becomes the founder's
// own dark twin — the SAME silhouette, cast near-black. One model, one
// vocabulary, zero new assets.
//
// SkeletonUtils.clone, NOT .clone(): the mesh is SKINNED and a plain clone
// shares bones with the live player model. The pose is baked by playing the
// Idle clip's first frame through a throwaway mixer — bones keep their last
// written transforms, so the statue stands naturally forever at zero per-
// frame cost.

import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { AnimationMixer, Mesh, type Group, type Material } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { asset } from './assets'

const MODEL_URL = asset('models/rogue.glb')
useGLTF.preload(MODEL_URL)

/** statues carry no weapons — every KayKit hand prop hidden, both hands */
const HIDDEN_EQUIPMENT = new Set([
  'Knife',
  'Knife_Offhand',
  '1H_Crossbow',
  '2H_Crossbow',
  'Throwable',
])

/**
 * The founder's silhouette in the given material, feet at the local origin,
 * ~1.75 u tall at scale 1, facing +Z (rotate the parent to aim it).
 */
export function useFounderStatue(material: Material): Group {
  const { scene, animations } = useGLTF(MODEL_URL)
  return useMemo(() => {
    const statue = cloneSkinned(scene) as Group
    const idle = animations.find((clip) => clip.name === 'Idle')
    if (idle !== undefined) {
      // one tick bakes the natural standing pose; the mixer is then dropped
      const mixer = new AnimationMixer(statue)
      mixer.clipAction(idle).play()
      mixer.update(0.001)
    }
    statue.traverse((node) => {
      if (HIDDEN_EQUIPMENT.has(node.name)) node.visible = false
      if (node instanceof Mesh) {
        node.material = material
        node.castShadow = true
      }
    })
    return statue
  }, [scene, animations, material])
}

export function FounderStatue({
  material,
  scale = 1,
}: {
  material: Material
  scale?: number
}): JSX.Element {
  const statue = useFounderStatue(material)
  return <primitive object={statue} scale={scale} />
}
