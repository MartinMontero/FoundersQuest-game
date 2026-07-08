// src/game/ShadowTwin.tsx — the dark translucent twin on the path behind the
// player. The WORLD only renders presence: visibility comes from
// ui.shadow.visible (a derived divergence check upstream); the quote and the
// one low-friction action are DOM copy owned by the UI layer. Subtle by law:
// a slow opacity fade in/out, no shake, no approach animation — the fade IS
// the reduced-motion variant, so both paths share it. Zero network.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, MeshStandardMaterial } from 'three'
import { useUiStore } from '../state/ui'
import { cameraYaw, playerWorldPos } from './refs'

const SHADOW_OPACITY = 0.55
const FADE_RATE = 2.5 // 1/s
const BEHIND_DISTANCE = 3

export interface ShadowTwinProps {
  reduced: boolean
}

export function ShadowTwin({ reduced }: ShadowTwinProps): JSX.Element {
  const group = useRef<Group>(null)
  const material = useRef<MeshStandardMaterial>(null)

  useFrame((_, delta) => {
    const g = group.current
    const m = material.current
    if (g === null || m === null) return

    const visible = useUiStore.getState().shadow.visible
    const target = visible ? SHADOW_OPACITY : 0
    // simple fade both ways; slightly quicker under reduced motion (no lingering drift)
    const rate = reduced ? FADE_RATE * 2 : FADE_RATE
    const step = Math.min(1, rate * delta)
    m.opacity += (target - m.opacity) * step
    g.visible = m.opacity > 0.02

    if (visible) {
      // stands on the path behind the player (between player and camera)
      const yaw = cameraYaw.value
      g.position.set(
        playerWorldPos.x + Math.sin(yaw) * BEHIND_DISTANCE,
        1.05,
        playerWorldPos.z + Math.cos(yaw) * BEHIND_DISTANCE,
      )
      g.lookAt(playerWorldPos.x, 1.05, playerWorldPos.z)
    }
  })

  return (
    <group ref={group} visible={false}>
      <mesh>
        <capsuleGeometry args={[0.4, 1.1, 6, 16]} />
        <meshStandardMaterial
          ref={material}
          color="#05030c"
          emissive="#1b1140"
          emissiveIntensity={0.25}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
