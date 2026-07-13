// src/game/Grass.tsx — instanced wind-swept grass across the plateau, the
// benchmark's savanna signature. One InstancedMesh (a single draw call) of a
// tapered curved blade; per-instance position/rotation/scale/colour. Wind is a
// vertex-shader sway injected via onBeforeCompile (GPU-side, no per-instance CPU
// work) and driven by one shared uTime uniform — frozen under prefers-reduced
// motion. Blade count scales by tier; the software-GL automation path skips it
// so CI stays fast and deterministic. Grass neither casts nor receives shadows
// (thousands of shadow casters would swamp the map for no visible gain).

import { useCallback, useMemo, useRef } from 'react'
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  type InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { STAGE1_LAYOUT } from './contracts'
import { IS_AUTOMATION, RENDER_TIER } from './perf'
import { useSafeFrame } from './useSafeFrame'

const PLATEAU_RADIUS = 24
const BLADE_COUNT = RENDER_TIER === 'full' ? 9000 : IS_AUTOMATION ? 0 : 3500

/** A tapered, gently forward-curved blade; UV.y (0 base → 1 tip) drives the wind. */
function makeBlade(): BufferGeometry {
  const height = 0.55
  const width = 0.05
  const segments = 4
  const curve = 0.16
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const y = t * height
    const bend = t * t * curve
    const halfW = width * (1 - t) * 0.5
    pos.push(-halfW, y, bend, halfW, y, bend)
    uv.push(0, t, 1, t)
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2
    const b = i * 2 + 1
    const c = i * 2 + 2
    const d = i * 2 + 3
    idx.push(a, c, b, b, c, d)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Deterministic LCG so the field is identical every boot / screenshot. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const KEEPOUT: readonly [number, number][] = STAGE1_LAYOUT.map((s) => [s.position[0], s.position[2]])
function clearOf(x: number, z: number): boolean {
  for (const [kx, kz] of KEEPOUT) if (Math.hypot(x - kx, z - kz) < 2.2) return false
  return true
}

export interface GrassProps {
  reduced: boolean
}

export function Grass({ reduced }: GrassProps): JSX.Element | null {
  const wind = useRef({ value: 0 })

  const geometry = useMemo(makeBlade, [])
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({
      color: '#6f7c3d',
      roughness: 0.9,
      metalness: 0,
      side: DoubleSide,
    })
    const w = wind.current
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = w
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float ph = instanceMatrix[3][0] * 0.6 + instanceMatrix[3][2] * 0.6;
           float t = uv.y * uv.y;
           transformed.x += sin(uTime * 1.6 + ph) * 0.16 * t;
           transformed.z += cos(uTime * 1.25 + ph * 1.3) * 0.11 * t;`,
        )
    }
    return m
  }, [])

  // fill instance matrices + colours once (stable callback ref — never re-fills
  // on a re-render, which would rebuild 9000 instances)
  const fill = useCallback((m: InstancedMesh | null): void => {
    if (m === null) return
    const rng = makeRng(0x6a55)
    const dummy = new Object3D()
    const base = new Color('#5f6d33')
    const tip = new Color('#8fa24e')
    const dry = new Color('#a7a05a')
    const col = new Color()
    let placed = 0
    let guard = 0
    while (placed < BLADE_COUNT && guard < BLADE_COUNT * 20) {
      guard += 1
      // sqrt radius for even areal density; cluster with a little noise
      const r = Math.sqrt(rng()) * (PLATEAU_RADIUS - 1)
      const a = rng() * Math.PI * 2
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (!clearOf(x, z)) continue
      dummy.position.set(x, 0.02, z)
      dummy.rotation.set((rng() - 0.5) * 0.2, rng() * Math.PI * 2, (rng() - 0.5) * 0.2)
      const s = 0.7 + rng() * 0.9
      dummy.scale.set(s, 0.8 + rng() * 0.9, s)
      dummy.updateMatrix()
      m.setMatrixAt(placed, dummy.matrix)
      col.copy(base).lerp(rng() > 0.8 ? dry : tip, rng() * 0.7)
      m.setColorAt(placed, col)
      placed += 1
    }
    m.count = placed
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor !== null) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [])

  useSafeFrame(({ clock }) => {
    // freeze the sway under reduced motion; otherwise a slow, steady breeze
    wind.current.value = reduced ? 0 : clock.elapsedTime
  })

  if (BLADE_COUNT === 0) return null
  return (
    <instancedMesh ref={fill} args={[geometry, material, BLADE_COUNT]} frustumCulled={false} />
  )
}
