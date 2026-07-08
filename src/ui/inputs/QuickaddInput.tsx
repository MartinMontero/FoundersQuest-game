// src/ui/inputs/QuickaddInput.tsx — rapid single-line entries (game-design §2.1
// `quickadd`, s1-fp "Strip it bare"). Enter in the entry field adds a line
// (it is a single-line input, not a textarea, so Enter-adds keeps it rapid).
// Each entry carries the inline "This only works if ___" affordance: blank +
// dies/wobbles/shrugs picker + kill criterion → addGuardian via the TrancePanel
// callback (originStageId comes from the shrine's stage). Entries themselves
// serialize to Answer.text as lines.

import { useState, type ReactElement } from 'react'
import type { Importance } from '../../core/schema'
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER, UI } from '../../strings'

export interface QuickaddEntry {
  text: string
  /** set once the inline affordance registered a guardian for this entry */
  guardianId?: string
}

export interface QuickaddInputProps {
  entries: QuickaddEntry[]
  onChange(entries: QuickaddEntry[]): void
  /** returns the new guardian's id (TrancePanel wires addGuardian) */
  onRegisterGuardian(statement: string, importance: Importance, killCriterion: string): string
}

function isImportance(value: string): value is Importance {
  return value === 'dies' || value === 'wobbles' || value === 'shrugs'
}

export function QuickaddInput({
  entries,
  onChange,
  onRegisterGuardian,
}: QuickaddInputProps): ReactElement {
  const [pending, setPending] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [blank, setBlank] = useState('')
  const [importance, setImportance] = useState<Importance>('wobbles')
  const [killCriterion, setKillCriterion] = useState('')

  const addEntry = (): void => {
    const text = pending.trim()
    if (text === '') return
    onChange([...entries, { text }])
    setPending('')
  }

  const openAffordance = (index: number): void => {
    setOpenIndex(index)
    setBlank('')
    setImportance('wobbles')
    setKillCriterion('')
  }

  const removeEntry = (index: number): void => {
    onChange(entries.filter((_, i) => i !== index))
    if (openIndex === index) setOpenIndex(null)
  }

  const register = (index: number): void => {
    const trimmed = blank.trim()
    if (trimmed === '') return
    const id = onRegisterGuardian(
      `${UI.trance.quickaddStatementPrefix}${trimmed}`,
      importance,
      killCriterion.trim(),
    )
    onChange(entries.map((entry, i) => (i === index ? { ...entry, guardianId: id } : entry)))
    setOpenIndex(null)
  }

  return (
    <div className="flex flex-col gap-2" data-testid="input-quickadd">
      <div className="flex gap-2">
        <input
          aria-label={UI.trance.quickaddEntryLabel}
          data-testid="quickadd-entry"
          value={pending}
          onChange={(event) => setPending(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addEntry()
            }
          }}
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <button
          type="button"
          data-testid="quickadd-add"
          disabled={pending.trim() === ''}
          onClick={addEntry}
          className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {UI.trance.quickaddAdd}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          // entries are positional; index keys are stable for this control
          <li
            key={index}
            data-testid={`quickadd-item-${index + 1}`}
            className="rounded border border-slate-700 bg-slate-950/60 p-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-100">{entry.text}</p>
              <button
                type="button"
                aria-label={UI.trance.quickaddRemoveLabel(index + 1)}
                data-testid={`quickadd-remove-${index + 1}`}
                onClick={() => removeEntry(index)}
                className="rounded border border-slate-600 px-2 py-0.5 text-2xs text-slate-300"
              >
                {UI.trance.quickaddRemoveLabel(index + 1)}
              </button>
            </div>

            {entry.guardianId !== undefined ? (
              <p
                data-testid={`quickadd-registered-${index + 1}`}
                className="mt-1 text-2xs uppercase tracking-wide text-amber-400"
              >
                {UI.trance.guardianRegistered}
              </p>
            ) : openIndex === index ? (
              <div className="mt-2 flex flex-col gap-2 rounded border border-slate-700 p-2">
                <label className="flex flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
                  <span>{UI.trance.quickaddAffordance}</span>
                  <input
                    aria-label={UI.trance.quickaddBlankLabel}
                    data-testid="quickadd-blank"
                    value={blank}
                    onChange={(event) => setBlank(event.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
                  <span>{UI.trance.importanceLabel}</span>
                  <select
                    data-testid="quickadd-importance"
                    value={importance}
                    onChange={(event) => {
                      if (isImportance(event.target.value)) setImportance(event.target.value)
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
                  >
                    {IMPORTANCE_ORDER.map((option) => (
                      <option key={option} value={option}>
                        {IMPORTANCE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-2xs uppercase tracking-wide text-slate-400">
                  <span>{UI.trance.killCriterionLabel}</span>
                  <input
                    data-testid="quickadd-kill"
                    value={killCriterion}
                    onChange={(event) => setKillCriterion(event.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid="quickadd-register"
                    disabled={blank.trim() === ''}
                    onClick={() => register(index)}
                    className="rounded bg-amber-400 px-3 py-1.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {UI.trance.registerGuardian}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(null)}
                    className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
                  >
                    {UI.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-testid={`quickadd-affordance-${index + 1}`}
                onClick={() => openAffordance(index)}
                className="mt-1 rounded border border-slate-600 px-2 py-1 text-2xs text-amber-200"
              >
                {UI.trance.quickaddAffordance}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
