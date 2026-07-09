// src/game/ShadowTwin.tsx — the dark translucent twin on the path behind the
// player. The WORLD only renders presence: visibility comes from
// ui.shadow.visible (a derived divergence check upstream); the quote and the
// one low-friction action are DOM copy owned by the UI layer. Subtle by law:
// a slow opacity fade in/out, no shake, no approach animation — the fade IS
// the reduced-motion variant, so both paths share it. Zero network.
//
// The silhouette mirrors the wanderer — a hooded cloak — but rendered in near-
// black with a cold rune glimmer, so it reads as the founder's shadow self.

import { useMemo, useRef } from 'react'
import { type Group, MeshToonMaterial } from 'three'
import { useUiStore } from '../state/ui'
import { PALETTE, TOON_RAMP } from './materials'
import { cameraYaw, playerWorldPos } from './refs'
import { useSafeFrame } from './useSafeFrame'

const SHADOW_OPACITY = 0.55
const FADE_RATE = 2.5 // 1/s
const BEHIND_DISTANCE = 3

export interface ShadowTwinProps {
  reduced: boolean
}

export function ShadowTwin({ reduced }: ShadowTwinProps): JSX.Element {
  const group = useRef<Group>(null)
  const material = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#05030c',
        emissive: PALETTE.violet,
        emissiveIntensity: 0.22,
        gradientMap: TOON_RAMP,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )

  useSafeFrame((_, delta) => {
    const g = group.current
    if (g === null) return

    const visible = useUiStore.getState().shadow.visible
    const target = visible ? SHADOW_OPACITY : 0
    // simple fade both ways; slightly quicker under reduced motion (no lingering drift)
    const rate = reduced ? FADE_RATE * 2 : FADE_RATE
    const step = Math.min(1, rate * delta)
    material.opacity += (target - material.opacity) * step
    g.visible = material.opacity > 0.02

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
      <mesh material={material} position={[0, -0.05, 0]}>
        <coneGeometry args={[0.46, 1.3, 10, 1]} />
      </mesh>
      <mesh material={material} position={[0, 0.72, -0.02]}>
        <sphereGeometry args={[0.29, 14, 14]} />
      </mesh>
      <mesh material={material} position={[0, 1.0, -0.05]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.16, 0.34, 8, 1]} />
      </mesh>
    </group>
  )
}
