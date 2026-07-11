// src/ui/inputs/VerbatimInput.tsx — five verbatim quotes (game-design §2.1
// `verbatim`, s2-th "Paste what they said, word for word"). Each quote is a
// textarea; a non-empty quote offers "Log as E2" → an inline source line →
// addEvidence (tier 2, E2 Word) via the TrancePanel callback. Quotes serialize
// to Answer.text as non-empty lines; logging a quote is a separate side effect
// (the evidence is banked in the ledger, independent of what gets inscribed).

import { useRef, useState, type ReactElement } from 'react'
import { UI } from '../../strings'
import { focusAfterCommit } from '../focus'

export interface VerbatimInputProps {
  /** the quote lines (the TrancePanel draft pads to five to start) */
  quotes: string[]
  onChange(quotes: string[]): void
  /** logs the quote as an E2 coin (TrancePanel wires addEvidence, source attributed) */
  onLogQuote(text: string, source: string): void
}

export function VerbatimInput({ quotes, onChange, onLogQuote }: VerbatimInputProps): ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [source, setSource] = useState('')
  const [logged, setLogged] = useState<readonly number[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  const setAt = (index: number, value: string): void => {
    const next = [...quotes]
    next[index] = value
    onChange(next)
  }

  const openLog = (index: number): void => {
    setOpenIndex(index)
    setSource('')
  }

  const log = (index: number): void => {
    const text = (quotes[index] ?? '').trim()
    if (text === '') return
    onLogQuote(text, source.trim())
    setLogged((prev) => (prev.includes(index) ? prev : [...prev, index]))
    setOpenIndex(null)
    // the source form (incl. the focused confirm) unmounts — keep the keyboard here
    focusAfterCommit(
      () =>
        containerRef.current?.querySelector<HTMLTextAreaElement>(
          `[data-testid="input-verbatim-${index + 1}"]`,
        ) ?? null,
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3" data-testid="input-verbatim">
      {quotes.map((quote, index) => {
        const filled = quote.trim() !== ''
        const isLogged = logged.includes(index)
        return (
          // quotes are positional; index keys are stable for this control
          <div key={index} className="flex flex-col gap-1.5">
            <label className="quest-label flex flex-col gap-1 text-2xs">
              <span>{UI.verbatim.quoteLabel(index + 1)}</span>
              <textarea
                data-testid={`input-verbatim-${index + 1}`}
                value={quote}
                onChange={(event) => setAt(index, event.target.value)}
                rows={2}
                className="quest-paper text-sm"
              />
            </label>
            {isLogged ? (
              <p
                data-testid={`input-verbatim-logged-${index + 1}`}
                className="quest-eyebrow text-2xs text-amber-accent-600"
              >
                {UI.verbatim.logged}
              </p>
            ) : openIndex === index ? (
              <div className="quest-aside flex flex-col gap-2 p-2.5 motion-safe:animate-quest-fade">
                <label className="quest-label flex flex-col gap-1 text-2xs">
                  <span>{UI.verbatim.sourceLabel}</span>
                  <input
                    data-testid={`input-verbatim-source-${index + 1}`}
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid={`input-verbatim-log-confirm-${index + 1}`}
                    onClick={() => log(index)}
                    className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                  >
                    {UI.verbatim.logConfirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(null)}
                    className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
                  >
                    {UI.common.cancel}
                  </button>
                </div>
              </div>
            ) : filled ? (
              <button
                type="button"
                data-testid={`input-verbatim-log-${index + 1}`}
                onClick={() => openLog(index)}
                className="quest-btn quest-btn-quiet self-start px-2 py-1 text-2xs text-amber-accent-600"
              >
                {UI.verbatim.logAsE2}
              </button>
            ) : null}
          </div>
        )
      })}
      <button
        type="button"
        data-testid="input-verbatim-add"
        onClick={() => onChange([...quotes, ''])}
        className="quest-btn quest-btn-quiet self-start px-3 py-1.5 text-sm"
      >
        {UI.verbatim.quoteAdd}
      </button>
    </div>
  )
}
