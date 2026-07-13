// src/ui/inputs/DecisionInput.tsx — pivot or persevere (game-design §2.1
// `decision`, s5-dec "Cite the evidence that decides it"). The decision is
// LOCKED until at least one evidence coin is cited — the panel keeps Inscribe
// disabled until then (isComplete), and this control shows why. Writes 02
// Answer.decision + Answer.citedEvidenceIds.

import type { ReactElement } from 'react'
import type { EvidenceTier } from '../../core/schema'
import { UI, tierLabel } from '../../strings'

export type Decision = '' | 'pivot' | 'persevere'

export interface DecisionEvidence {
  id: string
  tier: EvidenceTier
  text: string
  source: string
}

export interface DecisionInputProps {
  evidence: readonly DecisionEvidence[]
  decision: Decision
  citedEvidenceIds: string[]
  onChange(next: { decision: Decision; citedEvidenceIds: string[] }): void
}

export function DecisionInput({
  evidence,
  decision,
  citedEvidenceIds,
  onChange,
}: DecisionInputProps): ReactElement {
  const toggleCite = (id: string): void => {
    const cited = citedEvidenceIds.includes(id)
      ? citedEvidenceIds.filter((x) => x !== id)
      : [...citedEvidenceIds, id]
    onChange({ decision, citedEvidenceIds: cited })
  }

  const choose = (next: Decision): void => onChange({ decision: next, citedEvidenceIds })

  return (
    <div className="flex flex-col gap-3" data-testid="input-decision">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="input-decision-pivot"
          aria-pressed={decision === 'pivot'}
          onClick={() => choose('pivot')}
          className={`quest-btn px-3 py-1.5 text-sm ${
            decision === 'pivot' ? 'quest-btn-gold' : 'quest-btn-quiet'
          }`}
        >
          {UI.decision.pivot}
        </button>
        <button
          type="button"
          data-testid="input-decision-persevere"
          aria-pressed={decision === 'persevere'}
          onClick={() => choose('persevere')}
          className={`quest-btn px-3 py-1.5 text-sm ${
            decision === 'persevere' ? 'quest-btn-gold' : 'quest-btn-quiet'
          }`}
        >
          {UI.decision.persevere}
        </button>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="quest-label mb-1 text-2xs">{UI.decision.citePrompt}</legend>
        {evidence.length === 0 ? (
          <p data-testid="input-decision-noevidence" className="text-sm italic text-ink-faint">
            {UI.decision.noEvidence}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {evidence.map((coin, index) => (
              <li key={coin.id}>
                <label className="quest-aside flex items-start gap-2.5 p-2.5">
                  <input
                    type="checkbox"
                    data-testid={`input-decision-cite-${index + 1}`}
                    checked={citedEvidenceIds.includes(coin.id)}
                    onChange={() => toggleCite(coin.id)}
                    className="mt-1 accent-amber-accent-500"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm text-ink">{coin.text}</span>
                    <span className="quest-eyebrow text-2xs text-ink-faint">
                      {tierLabel(coin.tier)}
                      {coin.source.trim() !== '' ? ` ${UI.common.metaSeparator}${coin.source}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <p
        data-testid="input-decision-cited"
        className={`text-2xs ${
          citedEvidenceIds.length === 0 ? 'italic text-ink-faint' : 'text-amber-accent-600'
        }`}
      >
        {citedEvidenceIds.length === 0
          ? UI.decision.locked
          : UI.decision.cited(citedEvidenceIds.length)}
      </p>
    </div>
  )
}
