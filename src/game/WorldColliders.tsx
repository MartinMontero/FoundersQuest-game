// src/game/WorldColliders.tsx — the physical boundaries of World 1. The visuals
// (props.tsx rocks/boulders, Trees.tsx, Interactables.tsx monuments) render
// OUTSIDE <Physics> as pure meshes; this component lives INSIDE it and stands a
// matching static collider at every solid mass, so the founder walks AROUND
// them instead of through them. Positions are rebuilt from the SAME deterministic
// placement builders the visuals use, so a collider stands exactly where — and
// only where — an object stands.
//
// One fixed RigidBody holds every collider (one static body, many shapes: the
// cheap way). Gated OFF the software-GL automation tier by the caller, matching
// the trees/props it mirrors — so the CI movement journey is unchanged and this
// is a full/constrained-tier feature, verified on the live deploy.
//
// Interaction still works: the interact radius (2.75 u) is larger than every
// monument collider, so the walk-up chip lights before the capsule meets the
// stone; the player can always get close enough to press E.

import { useMemo } from 'react'
import { BallCollider, CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { REGISTRY_POSITION, VAULT_POSITION, layoutForStage } from './contracts'
import { useJourneyStore } from '../state/journey'
import {
  boulderPlacements,
  CRYSTAL_TEAL_PLACEMENTS,
  CRYSTAL_VIOLET_PLACEMENTS,
  rockPlacements,
} from './props'
import { treePlacements } from './Trees'

/** every rock is solid — the founder walks around them, not through them (operator
 * ruling 2026-07-10). Colliders are sized snug to each instance's scale. */
const ROCK_COLLIDER_MIN_SCALE = 0

/** the Registry's 8 outer standing stones (same ring as Interactables.tsx) — the
 * founder passes BETWEEN them to reach the altar, but can't walk through one. */
const REGISTRY_RING_RADIUS = 3.05
const REGISTRY_STONES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 + 0.2
  return { x: Math.cos(angle) * REGISTRY_RING_RADIUS, z: Math.sin(angle) * REGISTRY_RING_RADIUS }
})

export function WorldColliders(): JSX.Element {
  const stage = useJourneyStore((s) => s.currentStage)
  const boulders = useMemo(boulderPlacements, [])
  const rocks = useMemo(rockPlacements, [])
  const trees = useMemo(() => treePlacements(), [])

  const layout = layoutForStage(stage)
  const shrines = layout.filter((s) => s.kind === 'shrine')
  const flagpoles = layout.filter((s) => s.kind === 'flagpole')
  const portals = layout.filter((s) => s.kind === 'portal')
  const hasVault = layout.some((s) => s.kind === 'vault')
  const hasRegistry = layout.some((s) => s.kind === 'registry')

  return (
    <RigidBody type="fixed" colliders={false}>
      {/* boulders — a solid ball sized to each instance's scale */}
      {boulders.map((p, i) => (
        <BallCollider
          key={`boulder-${i}`}
          args={[0.82 * p.scale[0]]}
          position={[p.position[0], 0.4, p.position[2]]}
        />
      ))}
      {/* every rock is solid, collider snug to its size (operator ruling) */}
      {rocks
        .filter((p) => p.scale[0] >= ROCK_COLLIDER_MIN_SCALE)
        .map((p, i) => (
          <BallCollider
            key={`rock-${i}`}
            args={[0.66 * p.scale[0]]}
            position={[p.position[0], 0.2, p.position[2]]}
          />
        ))}
      {/* crystal nodes — cluster + socket are one solid mass (QA 2026-07-14:
          "the founder can not walk through them"); snug ball per placement */}
      {[...CRYSTAL_TEAL_PLACEMENTS, ...CRYSTAL_VIOLET_PLACEMENTS].map((p, i) => (
        <BallCollider
          key={`crystal-${i}`}
          args={[0.72 * p.scale[0]]}
          position={[p.position[0], 0.3, p.position[2]]}
        />
      ))}
      {/* tree trunks — a tall thin cylinder; the founder walks around the trunk
          (brushing the canopy is fine, the trunk is the solid mass) */}
      {trees.map((p, i) => (
        <CylinderCollider
          key={`tree-${i}`}
          args={[1.6 * p.scale, 0.42 * p.scale]}
          position={[p.pos[0], 1.6 * p.scale, p.pos[2]]}
        />
      ))}
      {/* shrine pillars — a stone column the founder stops against (still inside
          the 2.75 u interact radius, so the kneel prompt lights) */}
      {shrines.map((s) => (
        <CylinderCollider
          key={`shrine-${s.id}`}
          args={[1.3, 0.6]}
          position={[s.position[0], 1.3, s.position[2]]}
        />
      ))}
      {/* flagpoles — a thin pole you can't clip through */}
      {flagpoles.map((s) => (
        <CylinderCollider
          key={`pole-${s.id}`}
          args={[1.6, 0.15]}
          position={[s.position[0], 1.6, s.position[2]]}
        />
      ))}
      {/* portal gates — the two stone columns and the low base are solid (the
          founder walks around the columns and stops at / steps onto the base,
          staying inside the 2.75 u interact radius so the travel prompt lights).
          The shimmering veil in the opening stays walkable. Columns sit at x±1.15,
          matching PortalArch. */}
      {portals.flatMap((p) => [
        <CylinderCollider
          key={`gate-col-l-${p.id}`}
          args={[1.75, 0.32]}
          position={[p.position[0] - 1.15, 1.75, p.position[2]]}
        />,
        <CylinderCollider
          key={`gate-col-r-${p.id}`}
          args={[1.75, 0.32]}
          position={[p.position[0] + 1.15, 1.75, p.position[2]]}
        />,
        <CuboidCollider
          key={`gate-base-${p.id}`}
          args={[1.8, 0.16, 0.85]}
          position={[p.position[0], 0.16, p.position[2]]}
        />,
      ])}
      {/* the campfire — a small solid hearth the founder stops at (well within
          the 2.75 u interact radius, so the "rest" prompt lights) */}
      {layout
        .filter((s) => s.kind === 'campfire')
        .map((s) => (
          <CylinderCollider
            key={`campfire-${s.id}`}
            args={[0.6, 0.9]}
            position={[s.position[0], 0.6, s.position[2]]}
          />
        ))}
      {/* the Vault — its floating sanctum is solid; the founder stops at its edge */}
      {hasVault ? <CuboidCollider args={[0.7, 0.5, 0.55]} position={VAULT_POSITION} /> : null}
      {/* the Registry's outer standing stones */}
      {hasRegistry
        ? REGISTRY_STONES.map((stone, i) => (
            <CylinderCollider
              key={`registry-stone-${i}`}
              args={[0.7, 0.3]}
              position={[REGISTRY_POSITION[0] + stone.x, 0.7, REGISTRY_POSITION[2] + stone.z]}
            />
          ))
        : null}
    </RigidBody>
  )
}
