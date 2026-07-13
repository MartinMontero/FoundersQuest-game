// src/ui/inputs/QuickaddInput.tsx — rapid single-line entries (game-design §2.1
// `quickadd`, s1-fp "Strip it bare"). Enter in the entry field adds a line
// (it is a single-line input, not a textarea, so Enter-adds keeps it rapid).
// Each entry carries the inline "This only works if ___" affordance: blank +
// dies/wobbles/shrugs picker + kill criterion → addGuardian via the TrancePanel
// callback (originStageId comes from the shrine's stage). Entries themselves
// serialize to Answer.text as lines. The pending, un-entered line is PART OF
// THE DRAFT (owned by the TrancePanel), so Esc + re-kneel never loses it.

import { useRef, useState, type ReactElement } from 'react'
import type { Importance } from '../../core/schema'
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER, UI } from '../../strings'
import { focusAfterCommit } from '../focus'

export interface QuickaddEntry {
  text: string
  /** set once the inline affordance registered a guardian for this entry */
  guardianId?: string
}

export interface QuickaddInputProps {
  entries: QuickaddEntry[]
  /** the un-entered line in the entry field — session draft state, never lost on Esc */
  pending: string
  onChange(next: { entries: QuickaddEntry[]; pending: string }): void
  /** returns the new guardian's id (TrancePanel wires addGuardian) */
  onRegisterGuardian(statement: string, importance: Importance, killCriterion: string): string
}

function isImportance(value: string): value is Importance {
  return value === 'dies' || value === 'wobbles' || value === 'shrugs'
}

export function QuickaddInput({
  entries,
  pending,
  onChange,
  onRegisterGuardian,
}: QuickaddInputProps): ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [blank, setBlank] = useState('')
  const [importance, setImportance] = useState<Importance>('wobbles')
  const [killCriterion, setKillCriterion] = useState('')
  const entryRef = useRef<HTMLInputElement | null>(null)

  const addEntry = (): void => {
    const text = pending.trim()
    if (text === '') return
    onChange({ entries: [...entries, { text }], pending: '' })
  }

  const openAffordance = (index: number): void => {
    setOpenIndex(index)
    setBlank('')
    setImportance('wobbles')
    setKillCriterion('')
  }

  const removeEntry = (index: number): void => {
    onChange({ entries: entries.filter((_, i) => i !== index), pending })
    if (openIndex === index) setOpenIndex(null)
    // the pressed remove button unmounts — keep the keyboard in the control
    focusAfterCommit(() => entryRef.current)
  }

  const register = (index: number): void => {
    const trimmed = blank.trim()
    if (trimmed === '') return
    const id = onRegisterGuardian(
      `${UI.trance.quickaddStatementPrefix}${trimmed}`,
      importance,
      killCriterion.trim(),
    )
    onChange({
      entries: entries.map((entry, i) => (i === index ? { ...entry, guardianId: id } : entry)),
      pending,
    })
    setOpenIndex(null)
    // the affordance form (incl. the focused register button) unmounts on commit
    focusAfterCommit(() => entryRef.current)
  }

  return (
    <div className="flex flex-col gap-2" data-testid="input-quickadd">
      <div className="flex gap-2">
        <input
          ref={entryRef}
          aria-label={UI.trance.quickaddEntryLabel}
          data-testid="quickadd-entry"
          value={pending}
          onChange={(event) => onChange({ entries, pending: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addEntry()
            }
          }}
          className="quest-input px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          data-testid="quickadd-add"
          disabled={pending.trim() === ''}
          onClick={addEntry}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
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
            className="quest-aside p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink">{entry.text}</p>
              <button
                type="button"
                aria-label={UI.trance.quickaddRemoveLabel(index + 1)}
                data-testid={`quickadd-remove-${index + 1}`}
                onClick={() => removeEntry(index)}
                className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
              >
                {UI.trance.quickaddRemoveLabel(index + 1)}
              </button>
            </div>

            {entry.guardianId !== undefined ? (
              <p
                data-testid={`quickadd-registered-${index + 1}`}
                className="quest-eyebrow mt-1.5 text-2xs text-amber-accent-600"
              >
                {UI.trance.guardianRegistered}
              </p>
            ) : openIndex === index ? (
              <div className="quest-aside mt-2 flex flex-col gap-2 p-2.5 motion-safe:animate-quest-fade">
                <label className="quest-label flex flex-col gap-1 text-2xs">
                  <span>{UI.trance.quickaddAffordance}</span>
                  <input
                    aria-label={UI.trance.quickaddBlankLabel}
                    data-testid="quickadd-blank"
                    value={blank}
                    onChange={(event) => setBlank(event.target.value)}
                    className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                  />
                </label>
                <label className="quest-label flex flex-col gap-1 text-2xs">
                  <span>{UI.trance.importanceLabel}</span>
                  <select
                    data-testid="quickadd-importance"
                    value={importance}
                    onChange={(event) => {
                      if (isImportance(event.target.value)) setImportance(event.target.value)
                    }}
                    className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                  >
                    {IMPORTANCE_ORDER.map((option) => (
                      <option key={option} value={option}>
                        {IMPORTANCE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="quest-label flex flex-col gap-1 text-2xs">
                  <span>{UI.trance.killCriterionLabel}</span>
                  <input
                    data-testid="quickadd-kill"
                    value={killCriterion}
                    onChange={(event) => setKillCriterion(event.target.value)}
                    className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid="quickadd-register"
                    disabled={blank.trim() === ''}
                    onClick={() => register(index)}
                    className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                  >
                    {UI.trance.registerGuardian}
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
            ) : (
              <button
                type="button"
                data-testid={`quickadd-affordance-${index + 1}`}
                onClick={() => openAffordance(index)}
                className="quest-btn quest-btn-quiet mt-1.5 px-2 py-1 text-2xs text-amber-accent-600"
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
