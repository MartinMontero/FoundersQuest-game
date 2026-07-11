// src/ui/ReentryPrompt.tsx — the skipper's one-time First-Light offer (Mind &
// Myth A3, audit F11 cheap v1). Intercepts the FIRST shrine kneel after a skip:
// "Want it now, or carry on?" — offered once, never nagged. Declining proceeds
// straight into the trance the founder asked for; accepting starts the
// induction at beat 2. Either way the offer never returns (device-local flag).

import { useId, type ReactElement } from 'react'
import { useFirstLightUiStore } from '../state/firstlight'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { FIRST_LIGHT } from '../strings'
import { DialogShell } from './TrancePanel'

export function ReentryPrompt(): ReactElement | null {
  const qid = useUiStore((s) => s.pendingReentryQid)
  const closeReentry = useUiStore((s) => s.closeReentry)
  const enterTrance = useUiStore((s) => s.enterTrance)
  const setOpeningBeat = useQuestStore((s) => s.setOpeningBeat)
  const markSeen = useFirstLightUiStore((s) => s.markReentryPromptSeen)
  const titleId = useId()

  if (qid === null) return null

  const decline = (): void => {
    markSeen()
    closeReentry()
    enterTrance(qid) // straight into the kneel they asked for
  }

  const accept = (): void => {
    markSeen()
    closeReentry()
    setOpeningBeat(2) // the induction begins; the overlay takes over
  }

  return (
    <DialogShell
      titleId={titleId}
      onClose={decline}
      role="alertdialog"
      layerClassName="z-trance"
      panelClassName="max-w-md"
      testId="reentry-prompt"
    >
      <h2 id={titleId} className="quest-heading text-lg font-semibold">
        {FIRST_LIGHT.reentry.promptTitle}
      </h2>
      <p className="mt-2 text-sm text-ink-soft">{FIRST_LIGHT.reentry.promptBody}</p>
      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          type="button"
          data-testid="reentry-accept"
          onClick={accept}
          className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
        >
          {FIRST_LIGHT.reentry.accept}
        </button>
        <button
          type="button"
          data-testid="reentry-decline"
          onClick={decline}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {FIRST_LIGHT.reentry.decline}
        </button>
      </div>
    </DialogShell>
  )
}
