// src/ui/inputs/NumberInput.tsx — numeric field + unit + context line
// (game-design §2.1 `number`). The TrancePanel serializes all three to
// Answer.text: "<number> <unit>" on the first line, context beneath.
// An unparseable number WARNS, never blocks (canon 01: gates warn) — the
// caution line appears inline while Inscribe stays enabled (review 8d).

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface NumberInputProps {
  value: string
  unit: string
  context: string
  onChange(next: { value: string; unit: string; context: string }): void
}

/** true when the field holds ink that does not parse as a finite number */
function unparseable(value: string): boolean {
  const trimmed = value.trim()
  return trimmed !== '' && !Number.isFinite(Number(trimmed))
}

export function NumberInput({ value, unit, context, onChange }: NumberInputProps): ReactElement {
  return (
    <div className="flex flex-col gap-2" data-testid="input-number">
      <div className="flex gap-2">
        <label className="quest-label flex w-40 flex-col gap-1 text-2xs">
          <span>{UI.trance.numberValueLabel}</span>
          <input
            inputMode="decimal"
            data-testid="input-number-value"
            value={value}
            onChange={(event) => onChange({ value: event.target.value, unit, context })}
            className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
          />
        </label>
        <label className="quest-label flex flex-1 flex-col gap-1 text-2xs">
          <span>{UI.trance.numberUnitLabel}</span>
          <input
            data-testid="input-number-unit"
            value={unit}
            onChange={(event) => onChange({ value, unit: event.target.value, context })}
            className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
          />
        </label>
      </div>
      {unparseable(value) ? (
        <p
          role="status"
          data-testid="input-number-caution"
          className="text-2xs italic text-amber-accent-600"
        >
          {UI.trance.numberCaution}
        </p>
      ) : null}
      <label className="quest-label flex flex-col gap-1 text-2xs">
        <span>{UI.trance.numberContextLabel}</span>
        <input
          data-testid="input-number-context"
          value={context}
          onChange={(event) => onChange({ value, unit, context: event.target.value })}
          className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
        />
      </label>
    </div>
  )
}
