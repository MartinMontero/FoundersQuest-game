// src/ui/inputs/NumberInput.tsx — numeric field + unit + context line
// (game-design §2.1 `number`). The TrancePanel serializes all three to
// Answer.text: "<number> <unit>" on the first line, context beneath.

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface NumberInputProps {
  value: string
  unit: string
  context: string
  onChange(next: { value: string; unit: string; context: string }): void
}

export function NumberInput({ value, unit, context, onChange }: NumberInputProps): ReactElement {
  return (
    <div className="flex flex-col gap-2" data-testid="input-number">
      <div className="flex gap-2">
        <label className="flex w-40 flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
          <span>{UI.trance.numberValueLabel}</span>
          <input
            inputMode="decimal"
            data-testid="input-number-value"
            value={value}
            onChange={(event) => onChange({ value: event.target.value, unit, context })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
          <span>{UI.trance.numberUnitLabel}</span>
          <input
            data-testid="input-number-unit"
            value={unit}
            onChange={(event) => onChange({ value, unit: event.target.value, context })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
        <span>{UI.trance.numberContextLabel}</span>
        <input
          data-testid="input-number-context"
          value={context}
          onChange={(event) => onChange({ value, unit, context: event.target.value })}
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
        />
      </label>
    </div>
  )
}
