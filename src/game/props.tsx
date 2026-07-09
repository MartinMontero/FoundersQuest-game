// src/game/props.tsx — the ground field and its scattered set dressing. The
// plateau top is a vertex-coloured toon disk (warm-stone base drifting toward
// amber and cool violet in soft patches — painterly, not a flat plane). Rocks,
// glowing crystals, and grass tufts are scattered deterministically and drawn
// as instanced meshes: three extra draw calls total, cheap on integrated GPUs.
// Everything here is static — no per-frame work, nothing to gate on reduced
// motion. Placement is seeded so every boot and screenshot is identical, and
// nothing lands on top of an interactable.

import { useMemo } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  DodecahedronGeometry,
  type Material,
  MeshToonMaterial,
  Object3D,
  OctahedronGeometry,
} from 'three'
import { STAGE1_LAYOUT } from './contracts'
import { PALETTE, TOON_RAMP, TOON_RAMP_SOFT } from './materials'

const PLATEAU_RADIUS = 24

/** Tiny deterministic LCG — the whole field is identical every boot. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

// ---- vertex-coloured ground disk ----

/** Two-octave value noise in [-1, 1] — drives the ground's colour patches. */
function groundNoise(x: number, z: number): number {
  const a = Math.sin(x * 0.24) * Math.cos(z * 0.21)
  const b = Math.sin(x * 0.61 + 1.3) * Math.cos(z * 0.53 - 0.7)
  return (a + 0.5 * b) / 1.5
}

/** A triangulated disk with per-vertex colour variation and a faint sculpted
 * bump — the visible plateau surface. Normals point straight up so the toon
 * ramp lights it evenly from the warm key. */
function makeGroundGeometry(radius: number, rings: number, segments: number): BufferGeometry {
  const rng = makeRng(0x6d0d)
  const base = new Color(PALETTE.stone)
  const warm = new Color(PALETTE.stoneWarm)
  const cool = new Color(PALETTE.stoneCool)
  const scratch = new Color()

  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  const pushVertex = (x: number, z: number, edge: number): void => {
    // gentle sculpted bump, flattened toward the centre where the player walks
    const bump = (rng() - 0.5) * 0.06 * edge
    positions.push(x, bump, z)
    normals.push(0, 1, 0)
    const n = 0.5 + 0.5 * groundNoise(x, z)
    scratch.copy(base)
    if (n > 0.5) scratch.lerp(warm, (n - 0.5) * 0.6)
    else scratch.lerp(cool, (0.5 - n) * 0.5)
    colors.push(scratch.r, scratch.g, scratch.b)
  }

  pushVertex(0, 0, 0)
  for (let r = 1; r <= rings; r += 1) {
    const rad = (r / rings) * radius
    const edge = r / rings
    for (let s = 0; s < segments; s += 1) {
      const a = (s / segments) * Math.PI * 2
      pushVertex(Math.cos(a) * rad, Math.sin(a) * rad, edge)
    }
  }

  const idx = (r: number, s: number): number => 1 + (r - 1) * segments + (s % segments)
  // centre fan
  for (let s = 0; s < segments; s += 1) {
    indices.push(0, idx(1, s + 1), idx(1, s))
  }
  // ring strips
  for (let r = 1; r < rings; r += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = idx(r, s)
      const b = idx(r, s + 1)
      const c = idx(r + 1, s + 1)
      const d = idx(r + 1, s)
      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geometry.setIndex(indices)
  return geometry
}

function GroundDisk(): JSX.Element {
  const geometry = useMemo(() => makeGroundGeometry(PLATEAU_RADIUS + 0.5, 14, 56), [])
  const material = useMemo(
    () =>
      new MeshToonMaterial({
        vertexColors: true,
        gradientMap: TOON_RAMP_SOFT,
      }),
    [],
  )
  return <mesh geometry={geometry} material={material} position={[0, 0.02, 0]} receiveShadow={false} />
}

// ---- scattered instanced dressing ----

interface Placement {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

/** Interactable footprints to keep clear, so nothing scatters over a monument. */
const KEEPOUT: readonly [number, number, number][] = STAGE1_LAYOUT.map((s) => [
  s.position[0],
  1.7,
  s.position[2],
])

function clearOf(x: number, z: number, pad: number): boolean {
  for (const [kx, kr, kz] of KEEPOUT) {
    if (Math.hypot(x - kx, z - kz) < kr + pad) return false
  }
  return true
}

/** Scatter `count` placements in an annulus, skipping interactable footprints. */
function scatter(
  seed: number,
  count: number,
  opts: {
    minR: number
    maxR: number
    pad: number
    yBase: number
    scaleMin: number
    scaleMax: number
    scaleY?: [number, number]
    tilt: number
  },
): Placement[] {
  const rng = makeRng(seed)
  const out: Placement[] = []
  let guard = 0
  while (out.length < count && guard < count * 40) {
    guard += 1
    const a = rng() * Math.PI * 2
    const r = opts.minR + rng() * (opts.maxR - opts.minR)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!clearOf(x, z, opts.pad)) continue
    const s = opts.scaleMin + rng() * (opts.scaleMax - opts.scaleMin)
    const sy = opts.scaleY ? opts.scaleY[0] + rng() * (opts.scaleY[1] - opts.scaleY[0]) : s
    out.push({
      position: [x, opts.yBase, z],
      rotation: [(rng() - 0.5) * opts.tilt, rng() * Math.PI * 2, (rng() - 0.5) * opts.tilt],
      scale: [s, sy, s],
    })
  }
  return out
}

function ScatterField({
  placements,
  geometry,
  material,
}: {
  placements: readonly Placement[]
  geometry: BufferGeometry
  material: Material
}): JSX.Element {
  const ref = (mesh: import('three').InstancedMesh | null): void => {
    if (mesh === null) return
    const dummy = new Object3D()
    placements.forEach((p, i) => {
      dummy.position.set(p.position[0], p.position[1], p.position[2])
      dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2])
      dummy.scale.set(p.scale[0], p.scale[1], p.scale[2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }
  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} frustumCulled={false} />
}

/** The dressed plateau: vertex-coloured ground + instanced rock, crystal, grass.
 * Everything is static — no motion to gate on reduced-motion. */
export function GroundField(): JSX.Element {
  const rocks = useMemo(
    () => ({
      placements: scatter(0x0a17, 44, {
        minR: 3.5,
        maxR: 22,
        pad: 0.8,
        yBase: 0.06,
        scaleMin: 0.22,
        scaleMax: 0.7,
        tilt: 0.5,
      }),
      geometry: new DodecahedronGeometry(1, 0),
      material: new MeshToonMaterial({ color: PALETTE.stone, gradientMap: TOON_RAMP }),
    }),
    [],
  )
  const boulders = useMemo(
    () => ({
      placements: scatter(0x0b29, 9, {
        minR: 8,
        maxR: 21,
        pad: 1.4,
        yBase: 0.05,
        scaleMin: 0.9,
        scaleMax: 1.6,
        tilt: 0.35,
      }),
      geometry: new DodecahedronGeometry(1, 0),
      material: new MeshToonMaterial({ color: PALETTE.stoneWarm, gradientMap: TOON_RAMP }),
    }),
    [],
  )
  const crystals = useMemo(
    () => ({
      placements: scatter(0x0c53, 16, {
        minR: 5,
        maxR: 21,
        pad: 1.1,
        yBase: 0.18,
        scaleMin: 0.3,
        scaleMax: 0.85,
        scaleY: [0.9, 1.9],
        tilt: 0.18,
      }),
      geometry: new OctahedronGeometry(0.5, 0),
      material: new MeshToonMaterial({
        color: PALETTE.tealDeep,
        emissive: PALETTE.teal,
        emissiveIntensity: 0.9,
        gradientMap: TOON_RAMP,
      }),
    }),
    [],
  )
  const grass = useMemo(
    () => ({
      placements: scatter(0x0d71, 74, {
        minR: 3,
        maxR: 22,
        pad: 0.7,
        yBase: 0.2,
        scaleMin: 0.5,
        scaleMax: 1.1,
        scaleY: [0.8, 1.6],
        tilt: 0.22,
      }),
      geometry: new ConeGeometry(0.11, 0.5, 4, 1),
      material: new MeshToonMaterial({ color: PALETTE.grass, gradientMap: TOON_RAMP }),
    }),
    [],
  )

  return (
    <group>
      <GroundDisk />
      <ScatterField {...rocks} />
      <ScatterField {...boulders} />
      <ScatterField {...crystals} />
      <ScatterField {...grass} />
    </group>
  )
}
