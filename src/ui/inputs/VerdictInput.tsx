// src/ui/inputs/VerdictInput.tsx — open the seal (game-design §2.1 `verdict`,
// s5-th "Did Ariadne's Thread trigger — yes or no?"). The thread sealed at the
// Labyrinth (s4-th) is shown read-only above the ruling; the founder answers
// yes/no BEFORE interpreting anything else. The verdict invites the Council
// (Phase 4) — here it only records the answer (02 Answer.verdict).

import type { ReactElement } from 'react'
import { UI } from '../../strings'

export type Verdict = '' | 'yes' | 'no'

export interface VerdictInputProps {
  /** the text sealed at s4-th, shown read-only; undefined when nothing was sealed */
  sealedText: string | undefined
  verdict: Verdict
  onChange(verdict: 'yes' | 'no'): void
}

export function VerdictInput({ sealedText, verdict, onChange }: VerdictInputProps): ReactElement {
  return (
    <div className="flex flex-col gap-3" data-testid="input-verdict">
      {sealedText !== undefined && sealedText.trim() !== '' ? (
        <div className="quest-aside-violet flex flex-col gap-1.5 p-3.5" data-testid="input-verdict-sealed">
          <p className="quest-eyebrow text-2xs text-[#5f43aa]">{UI.verdict.sealedCaption}</p>
          <p className="whitespace-pre-wrap text-sm text-ink">{sealedText}</p>
        </div>
      ) : (
        <p data-testid="input-verdict-noseal" className="text-sm italic text-ink-faint">
          {UI.verdict.noSeal}
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="quest-label mb-1 text-2xs">{UI.verdict.question}</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="input-verdict-yes"
            aria-pressed={verdict === 'yes'}
            onClick={() => onChange('yes')}
            className={`quest-btn px-3 py-1.5 text-sm ${
              verdict === 'yes' ? 'quest-btn-gold' : 'quest-btn-quiet'
            }`}
          >
            {UI.verdict.yes}
          </button>
          <button
            type="button"
            data-testid="input-verdict-no"
            aria-pressed={verdict === 'no'}
            onClick={() => onChange('no')}
            className={`quest-btn px-3 py-1.5 text-sm ${
              verdict === 'no' ? 'quest-btn-gold' : 'quest-btn-quiet'
            }`}
          >
            {UI.verdict.no}
          </button>
        </div>
      </fieldset>
    </div>
  )
}
