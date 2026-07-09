// src/game/useFps.ts — dev/e2e-only FPS sampler. <FpsSampler/> is mounted
// ONLY behind import.meta.env.DEV (see World.tsx); production builds ship
// neither the component nor the window global. Measurement only — no
// telemetry of any kind leaves the device (CLAUDE.md).

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export interface FqFps {
  /** most recent one-second sample */
  fps: number
  /** trailing samples, oldest first (capped) */
  samples: number[]
}

declare global {
  interface Window {
    /** dev/e2e builds only — read by e2e/stage1.spec.ts for the frame-rate record */
    __fq_fps?: FqFps
  }
}

const MAX_SAMPLES = 120

export function FpsSampler(): null {
  const frames = useRef(0)
  const windowStart = useRef(0)

  useFrame(() => {
    const now = performance.now()
    if (windowStart.current === 0) windowStart.current = now
    frames.current += 1
    const elapsed = now - windowStart.current
    if (elapsed < 1000) return

    const fps = (frames.current * 1000) / elapsed
    const record: FqFps = window.__fq_fps ?? { fps: 0, samples: [] }
    record.fps = fps
    record.samples.push(fps)
    if (record.samples.length > MAX_SAMPLES) record.samples.shift()
    window.__fq_fps = record

    frames.current = 0
    windowStart.current = now
  })

  return null
}
