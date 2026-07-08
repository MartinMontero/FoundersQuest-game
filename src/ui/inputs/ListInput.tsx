// src/ui/inputs/ListInput.tsx — add/remove row builder (game-design §2.1 `list`).
// The TrancePanel serializes non-empty rows to Answer.text as lines.

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface ListInputProps {
  items: string[]
  onChange(items: string[]): void
}

export function ListInput({ items, onChange }: ListInputProps): ReactElement {
  const setAt = (index: number, value: string): void => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  const removeAt = (index: number): void => {
    const next = items.filter((_, i) => i !== index)
    // always keep one row on screen so the control never disappears
    onChange(next.length === 0 ? [''] : next)
  }

  return (
    <div className="flex flex-col gap-2" data-testid="input-list">
      {items.map((item, index) => (
        // rows are positional; index keys are stable for this control
        <div key={index} className="flex gap-2">
          <input
            aria-label={UI.trance.listItemLabel(index + 1)}
            data-testid={`input-list-${index + 1}`}
            value={item}
            onChange={(event) => setAt(index, event.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
          />
          <button
            type="button"
            aria-label={UI.trance.listRemoveLabel(index + 1)}
            data-testid={`input-list-remove-${index + 1}`}
            onClick={() => removeAt(index)}
            className="rounded border border-slate-600 px-2 py-1 text-2xs text-slate-300"
          >
            {UI.trance.listRemoveLabel(index + 1)}
          </button>
        </div>
      ))}
      <button
        type="button"
        data-testid="input-list-add"
        onClick={() => onChange([...items, ''])}
        className="self-start rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
      >
        {UI.trance.listAdd}
      </button>
    </div>
  )
}
