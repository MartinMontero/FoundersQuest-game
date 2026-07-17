// src/game/ShadowTwin.tsx — the dark translucent twin on the path behind the
// player. The WORLD only renders presence: visibility comes from
// ui.shadow.visible (a derived divergence check upstream); the quote and the
// one low-friction action are DOM copy owned by the UI layer. Subtle by law:
// a slow opacity fade in/out, no shake, no approach animation — the fade IS
// the reduced-motion variant, so both paths share it. Zero network.
//
// The silhouette IS the wanderer — the founder's own rigged model cast in
// near-black with a cold rune glimmer (QA round 4: no more cone-and-spheres;
// the shadow self is literally your own shape standing behind you).

import { Suspense, useMemo, useRef } from 'react'
import { type Group, MeshToonMaterial } from 'three'
import { useUiStore } from '../state/ui'
import { FounderStatue } from './FounderStatue'
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
      // stands on the path behind the player (between player and camera);
      // feet on the ground — the statue's origin is at its feet
      const yaw = cameraYaw.value
      g.position.set(
        playerWorldPos.x + Math.sin(yaw) * BEHIND_DISTANCE,
        0.06,
        playerWorldPos.z + Math.cos(yaw) * BEHIND_DISTANCE,
      )
      g.lookAt(playerWorldPos.x, 0.06, playerWorldPos.z)
    }
  })

  return (
    <group ref={group} visible={false}>
      {/* the founder's OWN silhouette, cast near-black — the dark twin */}
      <Suspense fallback={null}>
        <FounderStatue material={material} />
      </Suspense>
    </group>
  )
}
