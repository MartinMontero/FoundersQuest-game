// src/ui/inputs/FiveWhysInput.tsx — five chained inputs (game-design §2.1
// `fivewhys`): each rung unlocks after the previous holds text; the fifth is
// marked as the root, and the root echoes visibly at the end (the well's glow).
// Writes Answer.whys[] (length 5) via the TrancePanel.

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface FiveWhysInputProps {
  /** always length 5 (the TrancePanel draft guarantees it) */
  whys: string[]
  onChange(whys: string[]): void
}

export function FiveWhysInput({ whys, onChange }: FiveWhysInputProps): ReactElement {
  const setAt = (index: number, value: string): void => {
    const next = [...whys]
    next[index] = value
    onChange(next)
  }

  const root = (whys[4] ?? '').trim()

  return (
    <div className="flex flex-col gap-2" data-testid="input-fivewhys">
      {whys.map((why, index) => {
        const locked = index > 0 && (whys[index - 1] ?? '').trim() === ''
        const label = index === 4 ? UI.trance.whyRootLabel(index + 1) : UI.trance.whyLabel(index + 1)
        return (
          // rungs are positional; index keys are stable for this control
          <label key={index} className="quest-label flex flex-col gap-1 text-2xs">
            <span>{label}</span>
            <input
              data-testid={`input-why-${index + 1}`}
              value={why}
              disabled={locked}
              onChange={(event) => setAt(index, event.target.value)}
              className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
            />
          </label>
        )
      })}
      {root !== '' ? (
        <p
          data-testid="fivewhys-root"
          className="mt-1 rounded-md border border-amber-accent-500/50 bg-amber-accent-400/15 p-2.5 text-sm text-ink"
        >
          <span className="quest-eyebrow mr-1 text-2xs text-amber-accent-600">
            {UI.trance.rootCaption}
          </span>
          {root}
        </p>
      ) : null}
    </div>
  )
}
