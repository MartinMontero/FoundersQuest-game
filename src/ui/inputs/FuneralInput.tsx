// src/ui/inputs/FuneralInput.tsx — the Graveyard (game-design §2.1 `registry`,
// s5-l5 "Which Stage-1 belief is now dead? Hold the funeral"). Pick a Stage-1
// guardian and bury it: a two-step confirm marks it invalidated in the Registry.
// A funeral with E2+ evidence behind it pays full honors (1.5× XP, derived by
// metrics); one without still stands, honestly flagged an "unproven funeral".
// This control owns its own commit; the panel hides the generic Inscribe for it.

import { useState, type ReactElement } from 'react'
import { UI } from '../../strings'

export interface FuneralCandidate {
  id: string
  statement: string
  /** derived tierOf ≥ 2 — a proven funeral pays full honors */
  proven: boolean
}

export interface FuneralInputProps {
  candidates: readonly FuneralCandidate[]
  selectedId: string | null
  onSelect(id: string): void
  /** two-step-confirmed funeral (TrancePanel wires invalidateAssumption + record + stand-up) */
  onHold(id: string): void
}

export function FuneralInput({
  candidates,
  selectedId,
  onSelect,
  onHold,
}: FuneralInputProps): ReactElement {
  const [confirming, setConfirming] = useState(false)

  if (candidates.length === 0) {
    return (
      <p data-testid="input-funeral-empty" className="text-sm italic text-ink-faint">
        {UI.funeral.empty}
      </p>
    )
  }

  return (
    <fieldset className="flex flex-col gap-2" data-testid="input-funeral">
      <legend className="quest-label mb-1 text-2xs">{UI.funeral.prompt}</legend>
      {candidates.map((candidate, index) => {
        const selected = selectedId === candidate.id
        return (
          <label
            key={candidate.id}
            className={`quest-aside flex flex-col gap-1.5 p-2.5 ${
              selected ? 'border-amber-accent-500 bg-amber-accent-400/15' : ''
            }`}
          >
            <span className="flex items-start gap-2.5">
              <input
                type="radio"
                name="funeral-pick"
                data-testid={`input-funeral-choice-${index + 1}`}
                checked={selected}
                onChange={() => {
                  onSelect(candidate.id)
                  setConfirming(false)
                }}
                className="mt-1 accent-amber-accent-500"
              />
              <span className="text-sm font-semibold text-ink">{candidate.statement}</span>
            </span>
            <span
              className={`pl-6 text-2xs italic ${
                candidate.proven ? 'text-amber-accent-600' : 'text-ink-faint'
              }`}
            >
              {candidate.proven ? UI.funeral.proven : UI.funeral.unproven}
            </span>
          </label>
        )
      })}
      {selectedId !== null ? (
        confirming ? (
          <button
            type="button"
            data-testid="input-funeral-confirm"
            onClick={() => onHold(selectedId)}
            className="quest-btn quest-btn-seal self-start text-sm"
          >
            {UI.funeral.confirm}
          </button>
        ) : (
          <button
            type="button"
            data-testid="input-funeral-hold"
            onClick={() => setConfirming(true)}
            className="quest-btn quest-btn-gold self-start px-3 py-1.5 text-sm"
          >
            {UI.funeral.hold}
          </button>
        )
      ) : null}
    </fieldset>
  )
}
