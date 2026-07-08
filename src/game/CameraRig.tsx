// src/game/CameraRig.tsx — third-person follow camera (game-design §3: ~6 m
// behind, ~2 m up, 50° FOV) with Q / Alt+arrows yaw orbit. On trance the
// camera pushes toward the shrine (§2 F2); under prefers-reduced-motion every
// move is an INSTANT CUT — no dolly, no easing (the DOM layer owns the
// 150 ms opacity crossfade). Camera state is mutated in useFrame only.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useUiStore } from '../state/ui'
import { STAGE1_LAYOUT } from './contracts'
import { getMoveInput } from './controls'
import { cameraYaw, playerWorldPos } from './refs'

const FOLLOW_DISTANCE = 6
const FOLLOW_HEIGHT = 2.2
const LOOK_HEIGHT = 1.4
const YAW_SPEED = 1.6 // rad/s
const FOLLOW_DAMP = 4 // 1/s — exponential smoothing rates
const TRANCE_DAMP = 6 // ≈600 ms push-in (§2 F2)
/** camera distance from the shrine, over-shoulder (exported for the e2e framing math) */
export const TRANCE_BACKOFF = 3
export const TRANCE_HEIGHT = 1.7

declare global {
  interface Window {
    /** dev/e2e builds only — the camera's live position (reduced-motion cut assertions) */
    __fq_cam?: { x: number; y: number; z: number }
  }
}

/** shrine world positions by qid, for the trance framing */
const SHRINE_POSITION: ReadonlyMap<string, readonly [number, number, number]> = new Map(
  STAGE1_LAYOUT.filter((spec) => spec.kind === 'shrine' && spec.qid !== undefined).map(
    (spec) => [spec.qid as string, spec.position],
  ),
)

export interface CameraRigProps {
  reduced: boolean
}

export function CameraRig({ reduced }: CameraRigProps): null {
  const targetPos = useRef(new Vector3())
  const targetLook = useRef(new Vector3())
  const smoothedLook = useRef(new Vector3().copy(playerWorldPos))

  useFrame(({ camera }, delta) => {
    const ui = useUiStore.getState()

    // yaw orbit only while roaming — the trance framing owns the camera
    if (ui.mode === 'roam') {
      const move = getMoveInput()
      const yawInput = (move.yawLeft ? 1 : 0) - (move.yawRight ? 1 : 0)
      if (yawInput !== 0) cameraYaw.value += yawInput * YAW_SPEED * delta
    }

    const shrine = ui.mode === 'trance' && ui.activeQid !== null
      ? SHRINE_POSITION.get(ui.activeQid)
      : undefined

    let damp = FOLLOW_DAMP
    if (shrine !== undefined) {
      damp = TRANCE_DAMP
      // over-shoulder: stand off from the shrine toward the player
      let dx = playerWorldPos.x - shrine[0]
      let dz = playerWorldPos.z - shrine[2]
      const length = Math.hypot(dx, dz)
      if (length < 0.001) {
        dx = 0
        dz = 1
      } else {
        dx /= length
        dz /= length
      }
      targetPos.current.set(
        shrine[0] + dx * TRANCE_BACKOFF,
        shrine[1] + TRANCE_HEIGHT,
        shrine[2] + dz * TRANCE_BACKOFF,
      )
      targetLook.current.set(shrine[0], shrine[1] + 1.0, shrine[2])
    } else {
      const yaw = cameraYaw.value
      targetPos.current.set(
        playerWorldPos.x + Math.sin(yaw) * FOLLOW_DISTANCE,
        playerWorldPos.y + FOLLOW_HEIGHT,
        playerWorldPos.z + Math.cos(yaw) * FOLLOW_DISTANCE,
      )
      targetLook.current.set(
        playerWorldPos.x,
        playerWorldPos.y + LOOK_HEIGHT,
        playerWorldPos.z,
      )
    }

    // reduced motion: instant cut — alpha 1, no dolly, no easing
    const alpha = reduced ? 1 : 1 - Math.exp(-damp * delta)
    camera.position.lerp(targetPos.current, alpha)
    smoothedLook.current.lerp(targetLook.current, alpha)
    camera.lookAt(smoothedLook.current)

    if (import.meta.env.DEV) {
      // dev/e2e hook, __fq_fps pattern: expose the live camera position so the
      // reduced-motion spec can assert the CUT (not just panel timing) — 8f
      const record = window.__fq_cam ?? { x: 0, y: 0, z: 0 }
      record.x = camera.position.x
      record.y = camera.position.y
      record.z = camera.position.z
      window.__fq_cam = record
    }
  })

  return null
}
