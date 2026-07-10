// src/ui/inputs/VaultPickInput.tsx — open the Vault and choose (game-design
// §2.1 `vault`, s3-l1). The Vault unseals at Stage 3; its captured ideas become
// selectable here, and the chosen idea's text is what gets inscribed. If the
// Vault is empty (nothing was captured in Stage 1), a plain answer field stands
// in so the shrine is never a dead end (warn, never block — canon 01).

import type { ReactElement } from 'react'
import { UI } from '../../strings'

/** the minimal vault shape this control reads (id + captured text). */
export interface VaultChoice {
  id: string
  text: string
}

export interface VaultPickInputProps {
  vault: readonly VaultChoice[]
  selectedId: string | null
  fallback: string
  onChange(next: { selectedId: string | null; fallback: string }): void
}

export function VaultPickInput({
  vault,
  selectedId,
  fallback,
  onChange,
}: VaultPickInputProps): ReactElement {
  if (vault.length === 0) {
    return (
      <div className="flex flex-col gap-2" data-testid="input-vault">
        <p data-testid="input-vault-empty" className="text-sm italic text-ink-faint">
          {UI.vaultPick.empty}
        </p>
        <label className="quest-label flex flex-col gap-1 text-2xs">
          <span>{UI.vaultPick.fallbackLabel}</span>
          <textarea
            data-testid="input-vault-fallback"
            value={fallback}
            onChange={(event) => onChange({ selectedId: null, fallback: event.target.value })}
            rows={5}
            className="quest-paper resize-y text-sm"
          />
        </label>
      </div>
    )
  }

  return (
    <fieldset className="flex flex-col gap-2" data-testid="input-vault">
      <legend className="quest-label mb-1 text-2xs">{UI.vaultPick.prompt}</legend>
      {vault.map((choice, index) => (
        <label
          key={choice.id}
          className={`quest-aside flex cursor-pointer items-start gap-2.5 p-2.5 ${
            selectedId === choice.id ? 'border-amber-accent-500 bg-amber-accent-400/15' : ''
          }`}
        >
          <input
            type="radio"
            name="vault-pick"
            aria-label={UI.vaultPick.chooseLabel(index + 1)}
            data-testid={`input-vault-choice-${index + 1}`}
            checked={selectedId === choice.id}
            onChange={() => onChange({ selectedId: choice.id, fallback })}
            className="mt-1 accent-amber-accent-500"
          />
          <span className="text-sm text-ink">{choice.text}</span>
        </label>
      ))}
    </fieldset>
  )
}
