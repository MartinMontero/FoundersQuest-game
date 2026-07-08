// src/game/refs.ts — mutable per-frame scratch shared between the player,
// camera rig, and shadow twin. NOT state of record: nothing here persists,
// serializes, or feeds a metric — it is render plumbing mutated in useFrame
// (setState-per-frame is banned by the §8 performance notes).

import { Vector3 } from 'three'

/** The player capsule's world position, updated every frame by <Player/>. */
export const playerWorldPos = new Vector3(2, 1.2, 18)

/** Camera yaw orbit (radians) — Q / Alt+arrows steer it via the controls. */
export const cameraYaw = { value: 0 }
