// src/game/fx.tsx — the shared FX foundation (art-elevation run, 2026-07-13).
// Operator QA verdict on seven exhibits: flat-color primitives with painted-on
// markers read as "MS Paint". The shared root causes get shared cures, all
// code-generated (zero deps, zero binary blobs):
//   GlowSprite      a soft additive halo where a flat emissive dot used to be
//   GlowRing        a soft-edged luminous ground ring — replaces every flat
//                   "sticker" interaction ring
//   ContactShadow   a radial dark blob that seats a prop ON the ground
//                   instead of letting it intersect the dirt
//   FlameMaterial   a real animated flame (vertex sway + gradient + fresnel
//                   falloff) — replaces the smooth yellow cone
//   RimGlow         fresnel-driven rim material patch for crystals/gems
// Tier discipline matches the codebase: textures are tiny canvases (cached,
// module-level); animation runs through useSafeFrame and settles static under
// reduced motion; the automation tier keeps its cheap deterministic path —
// callers gate mounting exactly as they do for other real-tier chrome.

import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Sprite,
} from 'three'
import { useReducedMotion } from './useReducedMotion'
import { useSafeFrame } from './useSafeFrame'

// ---- tiny canvas textures, drawn once and cached per module ----

function radialCanvas(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 128,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx !== null) draw(ctx, size)
  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 1
  return texture
}

let glowTex: CanvasTexture | null = null
/** soft radial falloff — the halo texture behind every glow */
function glowTexture(): CanvasTexture {
  if (glowTex === null) {
    glowTex = radialCanvas((ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
      g.addColorStop(0.6, 'rgba(255,255,255,0.12)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    })
  }
  return glowTex
}

let ringTex: CanvasTexture | null = null
/** a luminous ring with soft inner and outer edges — no hard sticker line */
function ringTexture(): CanvasTexture {
  if (ringTex === null) {
    ringTex = radialCanvas((ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      g.addColorStop(0.62, 'rgba(255,255,255,0)')
      g.addColorStop(0.78, 'rgba(255,255,255,0.85)')
      g.addColorStop(0.88, 'rgba(255,255,255,0.35)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    }, 256)
  }
  return ringTex
}

let veilTex: CanvasTexture | null = null
/** the portal veil's energy-field falloff — full centre, feathered rim, so the
 *  gate reads as a standing field of light instead of a painted rectangle */
export function veilTexture(): CanvasTexture {
  if (veilTex === null) {
    veilTex = radialCanvas((ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      g.addColorStop(0, 'rgba(255,255,255,0.92)')
      g.addColorStop(0.45, 'rgba(255,255,255,0.6)')
      g.addColorStop(0.8, 'rgba(255,255,255,0.16)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    })
  }
  return veilTex
}

let shadowTex: CanvasTexture | null = null
/** the contact-shadow blob — dark centre, feathered edge */
function shadowTexture(): CanvasTexture {
  if (shadowTex === null) {
    shadowTex = radialCanvas((ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      g.addColorStop(0, 'rgba(0,0,0,0.42)')
      g.addColorStop(0.55, 'rgba(0,0,0,0.28)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    })
  }
  return shadowTex
}

// ---- the components ----

/** A soft additive halo. Put it where light is supposed to bloom — lantern
 *  heads, crystal cores, the campfire — instead of a flat emissive dot. */
export function GlowSprite({
  position,
  color,
  scale = 1,
  opacity = 0.8,
  pulse = false,
}: {
  position: readonly [number, number, number]
  color: string
  scale?: number
  opacity?: number
  /** gentle breathing; static under reduced motion */
  pulse?: boolean
}): JSX.Element {
  const sprite = useRef<Sprite>(null)
  const reduced = useReducedMotion()
  useSafeFrame(({ clock }) => {
    const s = sprite.current
    if (s === null || !pulse || reduced) return
    const b = 1 + Math.sin(clock.elapsedTime * 2.1) * 0.08
    s.scale.setScalar(scale * b)
  })
  return (
    <sprite ref={sprite} position={[position[0], position[1], position[2]]} scale={scale}>
      <spriteMaterial
        map={glowTexture()}
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  )
}

/** The luminous ground ring — soft edges, additive, breathes gently. Replaces
 *  every flat painted circle (interaction radius, highlight ring). */
export function GlowRing({
  position,
  color,
  radius,
  opacity = 0.55,
  pulse = true,
}: {
  position: readonly [number, number, number]
  color: string
  radius: number
  opacity?: number
  pulse?: boolean
}): JSX.Element {
  const mesh = useRef<Mesh>(null)
  const reduced = useReducedMotion()
  useSafeFrame(({ clock }) => {
    const m = mesh.current
    if (m === null || !pulse || reduced) return
    const b = 1 + Math.sin(clock.elapsedTime * 1.7) * 0.05
    m.scale.setScalar(b)
  })
  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[position[0], position[1], position[2]]}
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={ringTexture()}
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  )
}

/** Seats a prop on the ground: a feathered dark blob under its footprint. */
export function ContactShadow({
  position,
  radius,
  opacity = 1,
}: {
  position: readonly [number, number, number]
  radius: number
  opacity?: number
}): JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], position[1], position[2]]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={shadowTexture()}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

// ---- the flame ----

const FLAME_VERT = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // the higher up the flame, the more it sways and licks — two incommensurate
  // sine bands so the motion never visibly loops
  float lick = uv.y * uv.y;
  p.x += sin(uTime * 7.0 + p.y * 9.0) * 0.06 * lick;
  p.z += sin(uTime * 5.3 + p.y * 7.0 + 1.7) * 0.06 * lick;
  p.y += sin(uTime * 9.1 + p.x * 5.0) * 0.03 * lick;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const FLAME_FRAG = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uMid;
uniform vec3 uCore;
uniform float uTime;
varying vec2 vUv;
void main() {
  // vertical temperature ramp: base -> mid -> white-hot core near the bottom
  float h = vUv.y;
  vec3 color = mix(uCore, uMid, smoothstep(0.05, 0.45, h));
  color = mix(color, uBase, smoothstep(0.45, 0.95, h));
  // flicker rides the ramp; edges thin out toward the tip
  float flicker = 0.92 + 0.08 * sin(uTime * 13.0 + h * 20.0);
  float alpha = (1.0 - smoothstep(0.55, 1.0, h)) * flicker;
  gl_FragColor = vec4(color * flicker, alpha);
}`

/** A living flame: gradient-ramped cone with vertex sway. Mount it as
 *  <mesh><coneGeometry/><primitive object={material}/></mesh> via useFlame(). */
export function useFlame(colors?: { base?: string; mid?: string; core?: string }): ShaderMaterial {
  const reduced = useReducedMotion()
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FLAME_VERT,
        fragmentShader: FLAME_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uBase: { value: new Color(colors?.base ?? '#c2410c') },
          uMid: { value: new Color(colors?.mid ?? '#f2b64a') },
          uCore: { value: new Color(colors?.core ?? '#fff7e0') },
        },
      }),
    // colors are stable per call site — the material is built once
    [],
  )
  useSafeFrame(({ clock }) => {
    if (!reduced) material.uniforms['uTime']!.value = clock.elapsedTime
  })
  return material
}

// ---- the crystal rim ----

const RIM_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`

const RIM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRim;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float fres = pow(1.0 - abs(dot(vNormal, vView)), 2.0);
  vec3 color = mix(uColor, uRim, clamp(fres * uIntensity, 0.0, 1.0));
  gl_FragColor = vec4(color, 0.92);
}`

/** Fresnel-rimmed gem material: deep body color, luminous edges — the
 *  difference between a sticker teardrop and a crystal. Built once per site. */
export function useCrystalMaterial(body: string, rim: string, intensity = 1.6): ShaderMaterial {
  return useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: RIM_VERT,
        fragmentShader: RIM_FRAG,
        transparent: true,
        uniforms: {
          uColor: { value: new Color(body) },
          uRim: { value: new Color(rim) },
          uIntensity: { value: intensity },
        },
      }),
    [body, rim, intensity],
  )
}
