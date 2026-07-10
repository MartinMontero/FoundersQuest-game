// src/ui/inputs/JoyInput.tsx — the Spark of Joy (game-design §2.1 `joy`,
// s3-joy / s8-l3). Beyond killing the pain: name the one moment that makes them
// smile and tell a friend, then design it on purpose. A single focused field
// (warm-framed) so the beat stands apart from the analytical shrines; serializes
// to 02 Answer.text.

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface JoyInputProps {
  value: string
  onChange(value: string): void
}

export function JoyInput({ value, onChange }: JoyInputProps): ReactElement {
  return (
    <div className="flex flex-col gap-2" data-testid="input-joy">
      <label className="quest-label flex flex-col gap-1 text-2xs">
        <span>{UI.joy.label}</span>
        <textarea
          data-testid="input-joy-text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="quest-paper resize-y text-sm"
        />
      </label>
      <p className="quest-eyebrow text-2xs text-amber-accent-600">{UI.joy.prompt}</p>
    </div>
  )
}
