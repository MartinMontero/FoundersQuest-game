// src/game/props.tsx — the ground field and its scattered set dressing. The
// plateau top is a vertex-coloured toon disk (warm-stone base drifting toward
// amber and cool violet in soft patches — painterly, not a flat plane). Rocks,
// glowing crystals, and grass tufts are scattered deterministically and drawn
// as instanced meshes: three extra draw calls total, cheap on integrated GPUs.
// Everything here is static — no per-frame work, nothing to gate on reduced
// motion. Placement is seeded so every boot and screenshot is identical, and
// nothing lands on top of an interactable.

import { Suspense, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  type Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { asset } from './assets'
import { AssetBoundary } from './AssetBoundary'
import {
  BACK_POSITION,
  CAMPFIRE_POSITION,
  LOOP_POSITION,
  ONWARD_POSITION,
  STAGE1_LAYOUT,
} from './contracts'
import { PALETTE } from './materials'
import { useWorldSky } from './useWorldSky'
import { IS_AUTOMATION } from './perf'

const PLATEAU_RADIUS = 24
/** ground UV tiling: how many texture repeats per world unit (planar x/z) */
const GROUND_UV_SCALE = 0.09

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

/** A second decorrelated field in [0, 1] — where mossy grass takes the ground. */
function mossNoise(x: number, z: number): number {
  const a = Math.sin(x * 0.33 - 2.1) * Math.cos(z * 0.29 + 1.7)
  const b = Math.sin(x * 0.72 + 0.4) * Math.cos(z * 0.44 - 2.3)
  return Math.max(0, (a + 0.4 * b) / 1.4)
}

/** A triangulated disk with per-vertex colour variation and a faint sculpted
 * bump — the visible plateau surface. Normals point straight up so the toon
 * ramp lights it evenly from the warm key. */
function makeGroundGeometry(radius: number, rings: number, segments: number): BufferGeometry {
  const rng = makeRng(0x6d0d)
  const base = new Color(PALETTE.stone)
  const warm = new Color(PALETTE.stoneWarm)
  const cool = new Color(PALETTE.stoneCool)
  const gold = new Color(PALETTE.goldAccent)
  const moss = new Color(PALETTE.moss)
  const scratch = new Color()

  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const pushVertex = (x: number, z: number, edge: number): void => {
    // gentle sculpted bump, flattened toward the centre where the player walks
    const bump = (rng() - 0.5) * 0.06 * edge
    positions.push(x, bump, z)
    normals.push(0, 1, 0)
    // planar UV for the tiled PBR ground texture
    uvs.push(x * GROUND_UV_SCALE, z * GROUND_UV_SCALE)
    const n = 0.5 + 0.5 * groundNoise(x, z)
    scratch.copy(base)
    if (n > 0.5) {
      // warm earth patches, tipping into sun-warmed gold at the brightest
      scratch.lerp(warm, (n - 0.5) * 1.1)
      if (n > 0.76) scratch.lerp(gold, (n - 0.76) * 0.95)
    } else {
      scratch.lerp(cool, (0.5 - n) * 0.6)
    }
    // mossy grass takes the sheltered low patches — living ground, not mud
    const m = mossNoise(x, z)
    if (m > 0.35) scratch.lerp(moss, Math.min(0.55, (m - 0.35) * 1.1))
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
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  geometry.setIndex(indices)
  return geometry
}

function useGroundGeometry(): BufferGeometry {
  return useMemo(() => makeGroundGeometry(PLATEAU_RADIUS + 0.5, 14, 56), [])
}

/** Real CC0 PBR ground (Poly Haven "aerial_grass_rock"): albedo + normal + an
 * ARM map (AO/roughness/metalness packed). Tiled via the planar UVs and RECEIVES
 * shadows, so the plateau reads as real textured earth, not a plane. */
function GroundDiskTextured(): JSX.Element {
  const geometry = useGroundGeometry()
  const sky = useWorldSky() // each world's earth: multiply tint over the shared rock (E-1..E-8)
  const [map, normalMap, armMap] = useTexture([
    asset('textures/ground/grassrock_diff.jpg'),
    asset('textures/ground/grassrock_nor.jpg'),
    asset('textures/ground/grassrock_arm.jpg'),
  ]) as [Texture, Texture, Texture]
  useMemo(() => {
    for (const t of [map, normalMap, armMap]) {
      t.wrapS = RepeatWrapping
      t.wrapT = RepeatWrapping
    }
    map.colorSpace = SRGBColorSpace
  }, [map, normalMap, armMap])
  return (
    <mesh geometry={geometry} position={[0, 0.02, 0]} receiveShadow>
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        roughnessMap={armMap}
        metalnessMap={armMap}
        roughness={1.0}
        metalness={0.0}
        color={sky.ground}
      />
    </mesh>
  )
}

/** The cheap software-GL / automation ground: the vertex-coloured disk, no
 * texture sampling. Keeps the CI renderer fast and deterministic (skipping the
 * PBR texture is one of the cuts that lets the movement journey run at speed). */
function GroundDiskPlain(): JSX.Element {
  const geometry = useGroundGeometry()
  const sky = useWorldSky()
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        metalness: 0,
        color: sky.ground, // multiplies the vertex colours — the world's earth
      }),
    [sky.ground],
  )
  return <mesh geometry={geometry} material={material} position={[0, 0.02, 0]} receiveShadow />
}

// ---- scattered instanced dressing ----

interface Placement {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

/** Interactable footprints to keep clear, so nothing scatters over a monument or
 * blocks the path gates (the two portals are fixed across every world). */
const KEEPOUT: readonly [number, number, number][] = [
  ...STAGE1_LAYOUT.map((s): [number, number, number] => [s.position[0], 1.7, s.position[2]]),
  [ONWARD_POSITION[0], 1.7, ONWARD_POSITION[2]],
  [BACK_POSITION[0], 1.7, BACK_POSITION[2]],
  [LOOP_POSITION[0], 1.7, LOOP_POSITION[2]],
  [CAMPFIRE_POSITION[0], 1.7, CAMPFIRE_POSITION[2]],
  // the per-world set-piece stage (E-2..E-8) — a generous clear footprint
  [-8, 6.0, -14],
]

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

// Rock / boulder scatter params, named so the physics colliders (World.tsx) can
// rebuild the EXACT same placements the visuals use — same seed, same options,
// identical deterministic output. Solid mass the founder must walk around.
const ROCK_SCATTER = {
  seed: 0x0a17,
  count: 44,
  opts: { minR: 3.5, maxR: 22, pad: 0.8, yBase: 0.06, scaleMin: 0.22, scaleMax: 0.7, tilt: 0.5 },
} as const
const BOULDER_SCATTER = {
  seed: 0x0b29,
  count: 9,
  opts: { minR: 8, maxR: 21, pad: 1.4, yBase: 0.05, scaleMin: 0.9, scaleMax: 1.6, tilt: 0.35 },
} as const

/** The rock placements — shared by the visual instances and their colliders. */
export function rockPlacements(): Placement[] {
  return scatter(ROCK_SCATTER.seed, ROCK_SCATTER.count, ROCK_SCATTER.opts)
}
/** The boulder placements — shared by the visual instances and their colliders. */
export function boulderPlacements(): Placement[] {
  return scatter(BOULDER_SCATTER.seed, BOULDER_SCATTER.count, BOULDER_SCATTER.opts)
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
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, placements.length]}
      frustumCulled={false}
      castShadow
      receiveShadow
    />
  )
}

/** Pull the sculpted-rock geometry out of a vendored glTF, baking the pack's
 *  x100 node transform in, centered so it drops into the same placements the
 *  primitive dodecahedron used (art-elevation: real boulders, same scatter).
 *  Exported: the floating islands (Nebula) build their keels from the same
 *  sculpts — one shared normalized-rock vocabulary across the whole sky. */
export function sculptedGeometry(scene: import('three').Group): BufferGeometry {
  scene.updateMatrixWorld(true)
  let found: BufferGeometry | null = null
  let scale = 1
  scene.traverse((node) => {
    if (found === null && node instanceof Mesh) {
      found = node.geometry as BufferGeometry
      scale = node.getWorldScale(new Vector3()).x
    }
  })
  const geometry = (found ?? new DodecahedronGeometry(1, 0)).clone()
  geometry.scale(scale, scale, scale)
  geometry.center()
  // normalize to the primitive baseline (dodecahedron radius 1) so the same
  // placement scales produce the same visual mass — sculpts, not shrinkage
  geometry.computeBoundingSphere()
  const r = geometry.boundingSphere?.radius ?? 1
  if (r > 0) geometry.scale(1 / r, 1 / r, 1 / r)
  return geometry
}

/** The rock scatter on REAL sculpts — two boulder variants split the same
 *  deterministic placements. Suspends while the (tiny, embedded) glTFs load;
 *  the primitive path stands in and remains the automation tier's whole story. */
function SculptedRockScatter(): JSX.Element {
  const a = useGLTF(asset('models/rocks/Rock_2.glb'))
  const b = useGLTF(asset('models/rocks/Rock_5.glb'))
  const geoms = useMemo(
    () => [sculptedGeometry(a.scene), sculptedGeometry(b.scene)],
    [a.scene, b.scene],
  )
  const materials = useMemo(
    () => [
      new MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.9, metalness: 0.03 }),
      new MeshStandardMaterial({ color: PALETTE.stoneWarm, roughness: 0.9, metalness: 0.03 }),
    ],
    [],
  )
  const split = useMemo(() => {
    const all = [...rockPlacements(), ...boulderPlacements()]
    return [all.filter((_, i) => i % 2 === 0), all.filter((_, i) => i % 2 === 1)]
  }, [])
  return (
    <>
      <ScatterField placements={split[0]!} geometry={geoms[0]!} material={materials[0]!} />
      <ScatterField placements={split[1]!} geometry={geoms[1]!} material={materials[1]!} />
    </>
  )
}

/** the primitive rock path — automation tier + suspense/failure fallback */
function PrimitiveRockScatter(): JSX.Element {
  const rocks = useMemo(
    () => ({
      placements: rockPlacements(),
      geometry: new DodecahedronGeometry(1, 0),
      material: new MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.82, metalness: 0.04 }),
    }),
    [],
  )
  const boulders = useMemo(
    () => ({
      placements: boulderPlacements(),
      geometry: new DodecahedronGeometry(1, 0),
      material: new MeshStandardMaterial({ color: PALETTE.stoneWarm, roughness: 0.82, metalness: 0.04 }),
    }),
    [],
  )
  return (
    <>
      <ScatterField {...rocks} />
      <ScatterField {...boulders} />
    </>
  )
}

/** A crystal CLUSTER: 4-6 faceted hexagonal shards of varied height and lean
 *  growing from a shared heart, merged into ONE geometry so the whole cluster
 *  instances as cheaply as the old lone cone did. Photoreal Pass II — the
 *  operator's verdict on the singles was "horrible triangles": a real gem
 *  node is a FAMILY of columns, not a spike. Deterministic per seed. */
function makeCrystalCluster(seed: number): BufferGeometry {
  const rng = makeRng(seed)
  const shards: BufferGeometry[] = []
  // survey verdict (Photoreal Pass II): the first cut still read as a lone
  // cone from across the field — the heart shard towered over near-invisible
  // satellites and the needle crown made a spike. Now: 5-7 shards, satellites
  // thick and tall enough to read at distance, crowns cut to a flat-ish table
  // (r*0.22) so every column reads as a PRISM even in silhouette.
  const count = 5 + Math.floor(rng() * 3)
  for (let i = 0; i < count; i += 1) {
    const big = i === 0 // the first shard is the tall heart of the node
    const r = big ? 0.17 + rng() * 0.05 : 0.09 + rng() * 0.06
    const h = big ? 0.72 + rng() * 0.3 : 0.34 + rng() * 0.4
    const body = new CylinderGeometry(r * 0.62, r, h, 6, 1)
    const crown = new CylinderGeometry(r * 0.22, r * 0.62, h * 0.28, 6, 1)
    crown.translate(0, h * 0.64, 0)
    const shard = mergeGeometries([body, crown])
    if (shard === null) continue
    const angle = rng() * Math.PI * 2
    const spread = big ? 0 : 0.2 + rng() * 0.22
    shard.rotateZ((rng() - 0.5) * (big ? 0.14 : 0.7))
    shard.rotateY(angle)
    shard.translate(Math.cos(angle) * spread, h * 0.32, Math.sin(angle) * spread)
    shards.push(shard)
  }
  const cluster = mergeGeometries(shards) ?? new OctahedronGeometry(0.5, 0)
  // flat facets: unshared vertices so every face catches its own light
  const flat = cluster.toNonIndexed()
  flat.computeVertexNormals()
  return flat
}

// Crystal placements are shared by the shard fields, their rock sockets, AND
// the physics colliders (WorldColliders — QA 2026-07-14: crystals are solid,
// the founder walks around a gem node, never through it). Module scope — same
// seeds as ever, deterministic per world load.
export const CRYSTAL_TEAL_PLACEMENTS: readonly Placement[] = scatter(0x0c53, 5, {
  minR: 8,
  maxR: 20,
  pad: 1.4,
  yBase: 0.02,
  scaleMin: 0.75,
  scaleMax: 1.15,
  scaleY: [0.9, 1.25],
  tilt: 0.06,
})
export const CRYSTAL_VIOLET_PLACEMENTS: readonly Placement[] = scatter(0x0c9f, 3, {
  minR: 9,
  maxR: 19,
  pad: 1.4,
  yBase: 0.02,
  scaleMin: 0.7,
  scaleMax: 1.05,
  scaleY: [0.85, 1.2],
  tilt: 0.06,
})

/** every crystal node grows from a low stone mound — the "rock socket" that
 *  grounds the cluster in the terrain instead of leaving shards stuck in dirt */
const CRYSTAL_SOCKET_PLACEMENTS: readonly Placement[] = [
  ...CRYSTAL_TEAL_PLACEMENTS,
  ...CRYSTAL_VIOLET_PLACEMENTS,
].map((p) => ({
  // low and snug: the mound hugs the shard footprint (cluster spread ≈ 0.42r)
  // and stays ankle-height so the satellites CLEAR it — gate 1 buried them
  position: [p.position[0], 0, p.position[2]],
  rotation: [0, p.rotation[1] * 2.3, 0],
  scale: [p.scale[0] * 0.85, p.scale[1] * 0.2, p.scale[2] * 0.85],
}))

/** the sockets on a REAL sculpt (Rock_5 is already streamed for the boulder
 *  scatter — zero extra network); flattened wide so each reads as a mound */
function SculptedCrystalSockets(): JSX.Element {
  const { scene } = useGLTF(asset('models/rocks/Rock_5.glb'))
  const geometry = useMemo(() => sculptedGeometry(scene), [scene])
  const material = useMemo(
    () => new MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.92, metalness: 0.03 }),
    [],
  )
  return (
    <ScatterField
      placements={CRYSTAL_SOCKET_PLACEMENTS}
      geometry={geometry}
      material={material}
    />
  )
}

/** primitive socket mounds — automation tier + suspense/failure fallback */
function PrimitiveCrystalSockets(): JSX.Element {
  const geometry = useMemo(() => new DodecahedronGeometry(1, 0), [])
  const material = useMemo(
    () => new MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.85, metalness: 0.04 }),
    [],
  )
  return (
    <ScatterField
      placements={CRYSTAL_SOCKET_PLACEMENTS}
      geometry={geometry}
      material={material}
    />
  )
}

/** Fresnel injection for the instanced crystal materials: edges run hotter
 *  than faces, so a gem reads as lit glass instead of a painted cone. Patches
 *  the standard shader (instancing keeps working); cheap — one dot product. */
function gemBoost(material: MeshStandardMaterial): MeshStandardMaterial {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      [
        '#include <emissivemap_fragment>',
        'float fqFresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.0);',
        'totalEmissiveRadiance *= (0.5 + fqFresnel * 2.1);',
      ].join('\n'),
    )
  }
  return material
}

/** The dressed plateau: vertex-coloured ground + instanced rock, crystal, grass.
 * Everything is static — no motion to gate on reduced-motion. */
export function GroundField(): JSX.Element {
  // crystals come in two registers — teal runes and violet shards — each a deep
  // faceted body under a bright emissive glow that Bloom catches so they read as
  // lit gems, not flat plastic cones. Slender and tall, a little sparkle field.
  const crystalsTeal = useMemo(
    () => ({
      // Photoreal Pass II: a THIRD of the old count, each now a full cluster
      // on a rock socket — fewer, bigger, intentional; the cone litter is gone
      placements: CRYSTAL_TEAL_PLACEMENTS,
      geometry: makeCrystalCluster(0x9e31),
      material: gemBoost(
        new MeshStandardMaterial({
          color: '#0f5f5b',
          emissive: PALETTE.teal,
          emissiveIntensity: 1.6,
          roughness: 0.12,
          metalness: 0.0,
        }),
      ),
    }),
    [],
  )
  const crystalsViolet = useMemo(
    () => ({
      placements: CRYSTAL_VIOLET_PLACEMENTS,
      geometry: makeCrystalCluster(0x51c7),
      material: gemBoost(
        new MeshStandardMaterial({
          color: PALETTE.violetDeep,
          emissive: PALETTE.violet,
          emissiveIntensity: 1.35,
          roughness: 0.12,
          metalness: 0.0,
        }),
      ),
    }),
    [],
  )
  // warm gold-dust motes — tiny emissive sparks hovering low over the plateau,
  // little points of warm light that draw the eye (pillar 4). One instanced draw
  // call; emissive so they still read on the constrained tier (no bloom there).
  const motes = useMemo(
    () => ({
      placements: scatter(0x0e90, 24, {
        minR: 4,
        maxR: 21,
        pad: 1.0,
        yBase: 0.55,
        scaleMin: 0.06,
        scaleMax: 0.13,
        scaleY: [0.06, 0.13],
        tilt: 0.4,
      }),
      geometry: new OctahedronGeometry(0.5, 0),
      material: new MeshStandardMaterial({
        color: PALETTE.dust,
        emissive: PALETTE.dust,
        emissiveIntensity: 1.1,
        roughness: 0.82, metalness: 0.04,
      }),
    }),
    [],
  )

  return (
    <group>
      {IS_AUTOMATION ? (
        <GroundDiskPlain />
      ) : (
        // if the PBR ground textures abort on a slow link, fall back to the
        // vertex-coloured disk — the ground always renders, the world holds.
        <AssetBoundary fallback={<GroundDiskPlain />} label="ground-textures">
          <Suspense fallback={<GroundDiskPlain />}>
            <GroundDiskTextured />
          </Suspense>
        </AssetBoundary>
      )}
      {IS_AUTOMATION ? (
        <PrimitiveRockScatter />
      ) : (
        // real sculpted boulders; the primitive path stands in while the tiny
        // embedded glTFs stream, and stays if they somehow fail (world holds)
        <AssetBoundary fallback={<PrimitiveRockScatter />} label="rock-sculpts">
          <Suspense fallback={<PrimitiveRockScatter />}>
            <SculptedRockScatter />
          </Suspense>
        </AssetBoundary>
      )}
      {IS_AUTOMATION ? (
        <PrimitiveCrystalSockets />
      ) : (
        // each crystal node's stone mound — sculpted when the rock streams in,
        // primitive if it can't (the cluster never floats on bare dirt)
        <AssetBoundary fallback={<PrimitiveCrystalSockets />} label="crystal-sockets">
          <Suspense fallback={<PrimitiveCrystalSockets />}>
            <SculptedCrystalSockets />
          </Suspense>
        </AssetBoundary>
      )}
      <ScatterField {...crystalsTeal} />
      <ScatterField {...crystalsViolet} />
      <ScatterField {...motes} />
    </group>
  )
}
