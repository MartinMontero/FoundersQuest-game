// src/game/setpieces — each world's bespoke landmark (E-2..E-8), one module
// per world in the shared cel idiom, mounted at the SETPIECE_ANCHOR by the
// world assembly. W1's hand-authored spiral keeps its own composition (E-1
// elevated it in place); worlds 2-8 each get their game-design §1 centrepiece.
// Pure scenery: no store writes, no interactions, constant light counts.

import type { JSX } from 'react'
import { SetPieceW2 } from './W2'
import { SetPieceW3 } from './W3'
import { SetPieceW4 } from './W4'
import { SetPieceW5 } from './W5'
import { SetPieceW6 } from './W6'
import { SetPieceW7 } from './W7'
import { SetPieceW8 } from './W8'

/** where every world's landmark stands (kept clear by the scatter KEEPOUT).
 *  QA 2026-07-14: was [-16,-12] (r=20) — pressed against the rim, reading as
 *  off-world and unreachable. Now r=16, the clearest in-field spot vs the
 *  generated spiral (min 7.5u from every W2-8 interactable). */
export const SETPIECE_ANCHOR: readonly [number, number, number] = [-8, 0, -14]

export type SetPieceComponent = (props: { reduced: boolean }) => JSX.Element

const SETPIECES: Readonly<Record<number, SetPieceComponent>> = {
  2: SetPieceW2,
  3: SetPieceW3,
  4: SetPieceW4,
  5: SetPieceW5,
  6: SetPieceW6,
  7: SetPieceW7,
  8: SetPieceW8,
}

/** the landmark for a stage, if it has one (W1 composes its own world) */
export function setPieceForStage(stage: number): SetPieceComponent | null {
  return SETPIECES[stage] ?? null
}
