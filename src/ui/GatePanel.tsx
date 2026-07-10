// src/ui/GatePanel.tsx — the Act Gate threshold (game-design; 03 ACT_GATES).
// Crossing an act boundary onward (W2→W3, W5→W6, W7→W8) opens this once: it
// shows the canon criteria and whether the bar is met (derived, never stored).
// Gates WARN, never block (canon 01) — a met bar crosses cleanly; an unmet bar
// still crosses, but only with a written reason that is logged to the trail and
// exported. Esc/"Not yet" backs out without recording or travelling.

import { useId, useRef, useState, type ReactElement } from 'react'
import { gateMet } from '../core/metrics'
import { useJourneyStore } from '../state/journey'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { ACT_GATES, UI } from '../strings'
import { DialogShell } from './TrancePanel'

export function GatePanel(): ReactElement | null {
  const pending = useUiStore((s) => s.pendingGate)
  const closeGate = useUiStore((s) => s.closeGate)
  const passGate = useQuestStore((s) => s.passGate)
  const overrideGate = useQuestStore((s) => s.overrideGate)
  const goToStage = useJourneyStore((s) => s.goToStage)
  const met = useQuestStore((s) => (pending === null ? false : gateMet(s.data, pending.gateId)))
  const titleId = useId()
  const reasonRef = useRef<HTMLTextAreaElement | null>(null)
  const [reason, setReason] = useState('')

  if (pending === null) return null
  const gate = ACT_GATES.find((g) => g.id === pending.gateId)
  if (gate === undefined) return null

  const cross = (): void => {
    if (met) {
      passGate(gate.id, gate.name)
    } else {
      const written = reason.trim()
      if (written === '') return // the override needs a reason (warn, never block)
      overrideGate(gate.id, gate.name, written)
    }
    goToStage(pending.targetStage)
    closeGate()
  }

  return (
    <DialogShell
      titleId={titleId}
      onClose={closeGate}
      role="alertdialog"
      layerClassName="z-trance"
      panelClassName="max-w-lg"
      testId="gate-panel"
      initialFocus={met ? undefined : reasonRef}
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-amber-accent-500/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold leading-snug">
        {gate.name}
      </h2>

      <p className="quest-label mt-4 text-2xs">{UI.gate.criteriaLabel}</p>
      {/* the criteria, verbatim from 03 (ACT_GATES) */}
      <p className="mt-1 text-sm text-ink-soft">{gate.criteria}</p>

      <p
        data-testid="gate-status"
        className={`mt-4 text-sm ${met ? 'text-teal-rune-600' : 'text-amber-accent-600'}`}
      >
        {met ? UI.gate.met : UI.gate.unmet}
      </p>

      {met ? null : (
        <label className="quest-label mt-4 flex flex-col gap-1 text-2xs">
          <span>{UI.gate.reasonLabel}</span>
          <textarea
            ref={reasonRef}
            data-testid="gate-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="quest-paper resize-y text-sm"
          />
        </label>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-line/25 pt-4">
        <button
          type="button"
          data-testid="gate-back"
          onClick={closeGate}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.gate.turnBack}
        </button>
        <button
          type="button"
          data-testid="gate-cross"
          disabled={!met && reason.trim() === ''}
          onClick={cross}
          className="quest-btn quest-btn-seal text-sm"
        >
          {met ? UI.gate.pass : UI.gate.override}
        </button>
      </div>
    </DialogShell>
  )
}
