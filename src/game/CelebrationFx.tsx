// src/game/CelebrationFx.tsx — the world REACTS to dramatic beats (E-0).
// The feel audit's #1 systemic gap: every celebration was a parchment panel
// over an inert backdrop. This layer stages the beat IN the world, beside the
// founder: a light swell + a rising particle burst, tinted by the beat —
// shatter = ember catharsis · pillar = gold proof · funeral = pale teal rest ·
// integration = warm dawn. Ephemeral by construction (ui-store event, never
// persisted); constant node count (one light + one Points, dimmed to nothing
// when idle — no shader recompiles). Reduced motion: the light swells and the
// particles HOLD as a still constellation that fades — brightness, not motion.

import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from 'three'
import type { PointLight } from 'three'
import { useUiStore, type CelebrationKind } from '../state/ui'
import { makeSoftSprite, PALETTE } from './materials'
import { playerWorldPos } from './refs'
import { useSafeFrame } from './useSafeFrame'

const COUNT = 90
const DURATION_S = 2.6
const RISE_SPEED = 1.9 // m/s at burst edge

const TINT: Readonly<Record<CelebrationKind, string>> = {
  shatter: PALETTE.ember,
  pillar: PALETTE.amberBright,
  funeral: PALETTE.teal,
  integration: '#ffd9a0',
}

/** deterministic per-index scatter (no Math.random in the render path) */
function scatter(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function CelebrationFx({ reduced }: { reduced: boolean }): JSX.Element {
  const light = useRef<PointLight>(null)
  const points = useRef<Points>(null)
  const started = useRef<number | null>(null)
  const seenSeq = useRef(0)

  const sprite = useMemo(() => makeSoftSprite(64, 2.2), [])
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(COUNT * 3), 3))
    return g
  }, [])
  const material = useMemo(
    () =>
      new PointsMaterial({
        size: 0.22,
        map: sprite,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [sprite],
  )

  useSafeFrame(({ clock }) => {
    const ui = useUiStore.getState()
    const l = light.current
    const p = points.current
    if (l === null || p === null) return

    const beat = ui.celebration
    if (beat !== null && beat.seq !== seenSeq.current) {
      // a new beat: seed the burst around the founder, tint everything
      seenSeq.current = beat.seq
      started.current = clock.elapsedTime
      const tint = TINT[beat.kind]
      l.color.set(tint)
      material.color.set(tint)
      const positions = geometry.getAttribute('position')
      for (let i = 0; i < COUNT; i += 1) {
        const angle = scatter(i, 1) * Math.PI * 2
        const radius = 0.4 + scatter(i, 2) * 1.6
        positions.setXYZ(
          i,
          playerWorldPos.x + Math.cos(angle) * radius,
          playerWorldPos.y + 0.2 + scatter(i, 3) * (reduced ? 2.2 : 0.6),
          playerWorldPos.z + Math.sin(angle) * radius,
        )
      }
      positions.needsUpdate = true
      p.position.set(0, 0, 0)
      l.position.set(playerWorldPos.x, playerWorldPos.y + 1.6, playerWorldPos.z)
    }

    if (started.current === null) return
    const t = (clock.elapsedTime - started.current) / DURATION_S
    if (t >= 1) {
      started.current = null
      l.intensity = 0
      material.opacity = 0
      if (ui.celebration !== null) ui.clearCelebration()
      return
    }
    // light swells fast and exhales slow; particles rise (or hold, reduced)
    const swell = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75
    l.intensity = swell * 2.4
    material.opacity = swell * 0.9
    if (!reduced) {
      const positions = geometry.getAttribute('position')
      for (let i = 0; i < COUNT; i += 1) {
        const rate = 0.5 + scatter(i, 4)
        positions.setY(i, positions.getY(i) + RISE_SPEED * rate * (1 - t) * 0.016)
      }
      positions.needsUpdate = true
    }
  })

  return (
    <group>
      <pointLight ref={light} intensity={0} distance={11} decay={2} />
      <points ref={points} geometry={geometry} material={material} />
    </group>
  )
}
