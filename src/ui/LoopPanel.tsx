// src/ui/LoopPanel.tsx — a named loop's toll (game-design; 03 NAMED_LOOPS).
// Taking a loop toll-portal back (Reality Check W5→W1, Re-Build W7→W3, Reset
// W8→W1) is not free: every loop demands ONE learning line, which is recorded
// to the trail before you travel. "Stay"/Esc backs out without recording or
// looping. (The Reset's extra cycle-retro + Critique the Quest are a later cycle.)

import { useId, useRef, useState, type ReactElement } from 'react'
import { useJourneyStore } from '../state/journey'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'
import { DialogShell } from './TrancePanel'

export function LoopPanel(): ReactElement | null {
  const pending = useUiStore((s) => s.pendingLoop)
  const closeLoop = useUiStore((s) => s.closeLoop)
  const recordLoop = useQuestStore((s) => s.recordLoop)
  const goToStage = useJourneyStore((s) => s.goToStage)
  const titleId = useId()
  const learningRef = useRef<HTMLTextAreaElement | null>(null)
  const [learning, setLearning] = useState('')

  if (pending === null) return null

  const loopBack = (): void => {
    const line = learning.trim()
    if (line === '') return // every loop demands one learning line (03)
    recordLoop(pending.name, pending.fromStage, pending.toStage, line)
    goToStage(pending.toStage)
    closeLoop()
  }

  return (
    <DialogShell
      titleId={titleId}
      onClose={closeLoop}
      role="alertdialog"
      layerClassName="z-trance"
      panelClassName="max-w-lg"
      testId="loop-panel"
      initialFocus={learningRef}
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-[#7b5bd6]/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-lg font-semibold leading-snug">
        {UI.loop.tollLine(pending.name)}
      </h2>

      <label className="quest-label mt-4 flex flex-col gap-1 text-2xs">
        <span>{UI.loop.learningLabel}</span>
        <textarea
          ref={learningRef}
          data-testid="loop-learning"
          value={learning}
          onChange={(event) => setLearning(event.target.value)}
          rows={3}
          className="quest-paper resize-y text-sm"
        />
      </label>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-line/25 pt-4">
        <button
          type="button"
          data-testid="loop-stay"
          onClick={closeLoop}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.loop.turnBack}
        </button>
        <button
          type="button"
          data-testid="loop-pay"
          disabled={learning.trim() === ''}
          onClick={loopBack}
          className="quest-btn quest-btn-violet px-3 py-1.5 text-sm"
        >
          {UI.loop.pay}
        </button>
      </div>
    </DialogShell>
  )
}
