// src/ui/inputs/TextAnswer.tsx — plain multiline answer: untagged prose, story,
// and falsify (the falsification framing is the 03 question text itself).
// Enter = newline (native textarea); Ctrl+Enter is handled by the TrancePanel.

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export interface TextAnswerProps {
  value: string
  onChange(next: string): void
}

export function TextAnswer({ value, onChange }: TextAnswerProps): ReactElement {
  return (
    <textarea
      aria-label={UI.trance.answerLabel}
      data-testid="input-text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={8}
      className="quest-paper resize-y text-sm"
    />
  )
}
