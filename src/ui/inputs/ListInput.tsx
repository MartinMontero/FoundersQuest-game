// src/ui/inputs/ListInput.tsx — add/remove row builder (game-design §2.1 `list`).
// The TrancePanel serializes non-empty rows to Answer.text as lines.

import { useRef, type ReactElement } from 'react'
import { UI } from '../../strings'
import { focusAfterCommit } from '../focus'

export interface ListInputProps {
  items: string[]
  onChange(items: string[]): void
}

export function ListInput({ items, onChange }: ListInputProps): ReactElement {
  const container = useRef<HTMLDivElement | null>(null)

  const setAt = (index: number, value: string): void => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  const removeAt = (index: number): void => {
    const next = items.filter((_, i) => i !== index)
    // always keep one row on screen so the control never disappears
    onChange(next.length === 0 ? [''] : next)
    // the pressed remove button unmounts — focus the row that takes its place
    const survivor = Math.min(index, Math.max(next.length - 1, 0))
    focusAfterCommit(
      () =>
        container.current?.querySelector<HTMLInputElement>(
          `[data-testid="input-list-${survivor + 1}"]`,
        ) ?? null,
    )
  }

  return (
    <div ref={container} className="flex flex-col gap-2" data-testid="input-list">
      {items.map((item, index) => (
        // rows are positional; index keys are stable for this control
        <div key={index} className="flex gap-2">
          <input
            aria-label={UI.trance.listItemLabel(index + 1)}
            data-testid={`input-list-${index + 1}`}
            value={item}
            onChange={(event) => setAt(index, event.target.value)}
            className="quest-input px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            aria-label={UI.trance.listRemoveLabel(index + 1)}
            data-testid={`input-list-remove-${index + 1}`}
            onClick={() => removeAt(index)}
            className="quest-btn quest-btn-quiet px-2 py-1 text-2xs"
          >
            {UI.trance.listRemoveLabel(index + 1)}
          </button>
        </div>
      ))}
      <button
        type="button"
        data-testid="input-list-add"
        onClick={() => onChange([...items, ''])}
        className="quest-btn quest-btn-quiet self-start px-3 py-1.5 text-sm"
      >
        {UI.trance.listAdd}
      </button>
    </div>
  )
}
