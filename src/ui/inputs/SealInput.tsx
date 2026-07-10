// src/ui/inputs/SealInput.tsx — Ariadne's Thread (game-design §2.1 `seal`,
// s4-th "write the result that makes you stop or pivot. Seal it."). Sealing is
// deliberate and irreversible in-world: a two-step confirm (Seal it → Confirm)
// commits the text with a store-stamped timestamp, and once sealed the control
// is READ-ONLY — the thread opens only at the Mirror (s5-th verdict). This
// control owns its own commit; the panel hides the generic Inscribe for it.

import { useState, type ReactElement } from 'react'
import { UI } from '../../strings'

export interface SealInputProps {
  text: string
  /** set once the thread is sealed — its presence flips the control to read-only */
  sealedAt: string | undefined
  onChange(text: string): void
  /** two-step-confirmed seal (TrancePanel wires sealThread + stand-up) */
  onSeal(text: string): void
}

export function SealInput({ text, sealedAt, onChange, onSeal }: SealInputProps): ReactElement {
  const [confirming, setConfirming] = useState(false)

  if (sealedAt !== undefined) {
    return (
      <div className="quest-aside-violet flex flex-col gap-2 p-3.5" data-testid="input-seal-sealed">
        <p className="quest-eyebrow text-2xs text-[#5f43aa]">{UI.seal.sealedCaption}</p>
        <p className="whitespace-pre-wrap text-sm text-ink">{text}</p>
        <p className="text-2xs italic text-ink-faint">
          {UI.seal.sealedAt(sealedAt)}
          {UI.common.metaSeparator}
          {UI.seal.locked}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2" data-testid="input-seal">
      <label className="quest-label flex flex-col gap-1 text-2xs">
        <span>{UI.seal.label}</span>
        <textarea
          data-testid="input-seal-text"
          value={text}
          onChange={(event) => {
            onChange(event.target.value)
            setConfirming(false)
          }}
          rows={5}
          className="quest-paper resize-y text-sm"
        />
      </label>
      {confirming ? (
        <button
          type="button"
          data-testid="input-seal-confirm"
          onClick={() => onSeal(text.trim())}
          className="quest-btn quest-btn-seal self-start text-sm"
        >
          {UI.seal.confirm}
        </button>
      ) : (
        <button
          type="button"
          data-testid="input-seal-arm"
          disabled={text.trim() === ''}
          onClick={() => setConfirming(true)}
          className="quest-btn quest-btn-gold self-start px-3 py-1.5 text-sm"
        >
          {UI.seal.seal}
        </button>
      )}
    </div>
  )
}
