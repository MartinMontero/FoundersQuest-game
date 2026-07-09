// src/ui/inputs/NamesInput.tsx — repeatable name rows (game-design §2.1 `names`):
// three rows to start (s1-l1 asks for three), add more. Serialized by the
// TrancePanel to Answer.text as newline-joined non-empty rows.

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface NamesInputProps {
  names: string[]
  onChange(names: string[]): void
}

export function NamesInput({ names, onChange }: NamesInputProps): ReactElement {
  const setAt = (index: number, value: string): void => {
    const next = [...names]
    next[index] = value
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2" data-testid="input-names">
      {names.map((name, index) => (
        <input
          // rows are positional; index keys are stable for this control
          key={index}
          aria-label={UI.trance.nameLabel(index + 1)}
          data-testid={`input-name-${index + 1}`}
          value={name}
          onChange={(event) => setAt(index, event.target.value)}
          className="quest-input px-2 py-1.5 text-sm"
        />
      ))}
      <button
        type="button"
        data-testid="input-names-add"
        onClick={() => onChange([...names, ''])}
        className="quest-btn quest-btn-quiet self-start px-3 py-1.5 text-sm"
      >
        {UI.trance.namesAdd}
      </button>
    </div>
  )
}
