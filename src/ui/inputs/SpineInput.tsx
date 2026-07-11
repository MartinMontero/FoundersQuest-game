// src/ui/inputs/SpineInput.tsx — the elixir spine (game-design §2.1 `spine`,
// s8-th). Five StoryBrand beats (customer → struggle → work → outcome →
// transformation) each carry the connective as a label. "Every beat cites
// evidence, or it does not cast": until at least one evidence coin is cited,
// every inked beat renders an [unproven] warning. This is the flat interim within
// the flat 02 citedEvidenceIds[] — there is no per-beat citation map in the
// schema, so the warning is spine-wide, not beat-by-beat (OQ3 RULED R-S,
// 2026-07-10: keep the flat interim; a per-beat map is a later 02 diff). Warn,
// never block (canon 01): an uncited spine still inscribes.

import type { ReactElement } from 'react'
import type { EvidenceTier } from '../../core/schema'
import { UI, tierLabel } from '../../strings'

export interface SpineEvidence {
  id: string
  tier: EvidenceTier
  text: string
  source: string
}

export interface SpineInputProps {
  /** the five beats (the TrancePanel draft pads to five) */
  beats: string[]
  citedEvidenceIds: string[]
  evidence: readonly SpineEvidence[]
  onChange(next: { beats: string[]; citedEvidenceIds: string[] }): void
}

export function SpineInput({
  beats,
  citedEvidenceIds,
  evidence,
  onChange,
}: SpineInputProps): ReactElement {
  const uncited = citedEvidenceIds.length === 0

  const setBeat = (index: number, value: string): void => {
    const next = [...beats]
    next[index] = value
    onChange({ beats: next, citedEvidenceIds })
  }

  const toggleCite = (id: string): void => {
    const cited = citedEvidenceIds.includes(id)
      ? citedEvidenceIds.filter((x) => x !== id)
      : [...citedEvidenceIds, id]
    onChange({ beats, citedEvidenceIds: cited })
  }

  return (
    <div className="flex flex-col gap-3" data-testid="input-spine">
      {beats.map((beat, index) => {
        const inked = beat.trim() !== ''
        return (
          // beats are positional; index keys are stable for this control
          <label key={index} className="quest-label flex flex-col gap-1 text-2xs">
            <span className="flex items-center gap-2">
              {UI.spine.beatLabels[index] ?? ''}
              {inked && uncited ? (
                <span
                  data-testid={`input-spine-unproven-${index + 1}`}
                  className="rounded border border-amber-accent-500/60 bg-amber-accent-400/15 px-1.5 py-0.5 text-2xs font-semibold not-italic normal-case tracking-normal text-amber-accent-600"
                >
                  {UI.spine.unproven}
                </span>
              ) : null}
            </span>
            <textarea
              data-testid={`input-spine-beat-${index + 1}`}
              value={beat}
              placeholder={UI.spine.beatPlaceholders[index] ?? ''}
              onChange={(event) => setBeat(index, event.target.value)}
              rows={2}
              className="quest-paper text-sm"
            />
          </label>
        )
      })}

      <fieldset className="flex flex-col gap-2">
        <legend className="quest-label mb-1 text-2xs">{UI.spine.citePrompt}</legend>
        {evidence.length === 0 ? (
          <p data-testid="input-spine-noevidence" className="text-sm italic text-ink-faint">
            {UI.spine.noEvidence}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {evidence.map((coin, index) => (
              <li key={coin.id}>
                <label className="quest-aside flex items-start gap-2.5 p-2.5">
                  <input
                    type="checkbox"
                    data-testid={`input-spine-cite-${index + 1}`}
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
    </div>
  )
}
