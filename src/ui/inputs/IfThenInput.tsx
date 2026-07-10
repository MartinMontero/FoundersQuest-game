// src/ui/inputs/IfThenInput.tsx — the falsifiable hypothesis (game-design §2.1
// `ifthen`, s3-l2 "State the logic before you build"). Three fields map to the
// 02 Answer keys ifPart / thenPart / withinDays. The IF can be registered as a
// guardian in one tap: its statement is the IF, its kill criterion is the THEN
// (the behavior that, unseen, kills it), and its weight is the founder's pick
// (default `dies` — the load-bearing hypothesis of the whole test).

import { useRef, useState, type ReactElement } from 'react'
import type { Importance } from '../../core/schema'
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER, UI } from '../../strings'
import { focusAfterCommit } from '../focus'

export interface IfThenInputProps {
  ifPart: string
  thenPart: string
  withinDays: string
  /** true once the IF has been registered as a guardian (draft-remembered) */
  registered: boolean
  onChange(next: { ifPart: string; thenPart: string; withinDays: string }): void
  /** registers the IF as a guardian at the chosen weight (TrancePanel wires addGuardian) */
  onRegister(importance: Importance): void
}

function isImportance(value: string): value is Importance {
  return value === 'dies' || value === 'wobbles' || value === 'shrugs'
}

export function IfThenInput({
  ifPart,
  thenPart,
  withinDays,
  registered,
  onChange,
  onRegister,
}: IfThenInputProps): ReactElement {
  const [importance, setImportance] = useState<Importance>('dies')
  const withinRef = useRef<HTMLInputElement | null>(null)
  const canRegister = ifPart.trim() !== '' && !registered

  const register = (): void => {
    onRegister(importance)
    // the register button (the focused control) unmounts as `registered` flips —
    // keep the keyboard in the panel so Ctrl+Enter inscribe still fires (review 2)
    focusAfterCommit(() => withinRef.current)
  }

  return (
    <div className="flex flex-col gap-3" data-testid="input-ifthen">
      <label className="quest-label flex flex-col gap-1 text-2xs">
        <span>{UI.ifthen.ifLabel}</span>
        <textarea
          data-testid="input-ifthen-if"
          value={ifPart}
          onChange={(event) => onChange({ ifPart: event.target.value, thenPart, withinDays })}
          rows={2}
          className="quest-paper resize-y text-sm"
        />
      </label>
      <label className="quest-label flex flex-col gap-1 text-2xs">
        <span>{UI.ifthen.thenLabel}</span>
        <textarea
          data-testid="input-ifthen-then"
          value={thenPart}
          onChange={(event) => onChange({ ifPart, thenPart: event.target.value, withinDays })}
          rows={2}
          className="quest-paper resize-y text-sm"
        />
      </label>
      <label className="quest-label flex w-40 flex-col gap-1 text-2xs">
        <span>{UI.ifthen.withinLabel}</span>
        <input
          ref={withinRef}
          inputMode="numeric"
          data-testid="input-ifthen-within"
          value={withinDays}
          onChange={(event) => onChange({ ifPart, thenPart, withinDays: event.target.value })}
          className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
        />
      </label>

      {registered ? (
        <p
          data-testid="input-ifthen-registered"
          className="quest-eyebrow text-2xs text-amber-accent-600"
        >
          {UI.ifthen.registered}
        </p>
      ) : (
        <div className="quest-aside flex flex-wrap items-end gap-2 p-2.5">
          <label className="quest-label flex flex-col gap-1 text-2xs">
            <span>{UI.ifthen.importanceLabel}</span>
            <select
              data-testid="input-ifthen-importance"
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
          <button
            type="button"
            data-testid="input-ifthen-register"
            disabled={!canRegister}
            onClick={register}
            className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
          >
            {UI.ifthen.registerIf}
          </button>
        </div>
      )}
    </div>
  )
}
