// src/ui/FounderNaming.tsx — the naming card, in two moods. FIRST RUN: shows once
// while the founder is unnamed and the quest is untouched (derived: no answers
// yet). RENAME: re-opened on demand from the HUD name (a transient store flag),
// pre-filled with the current name. Either way a centred card over the dimmed
// world. First run: Begin, or Stay "founder" (empty adopts the default so it
// never reappears). Rename: Save name, or Cancel (leaves the name unchanged).
// Keyboard-first: the field autofocuses, Enter commits, Escape dismisses.
// Device-local only; the name is never sent.

import { useEffect, useState, type ReactElement } from 'react'
import { useQuestStore } from '../state/store'
import { useFounderStore, FOUNDER_NAME_MAX } from '../state/founder'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'
import { useFocusTrap } from './TrancePanel'

export function FounderNaming(): ReactElement | null {
  const name = useFounderStore((s) => s.name)
  const renaming = useFounderStore((s) => s.renaming)
  const firstRun = useQuestStore((s) => Object.keys(s.data.answers).length === 0)
  const mode = useUiStore((s) => s.mode)
  const [draft, setDraft] = useState('')

  // seed the field with the current name each time the rename card opens
  useEffect(() => {
    if (renaming) setDraft(name)
  }, [renaming, name])

  // first-run naming = unnamed founder on an untouched quest; rename = HUD-invoked.
  // Either way, only while roaming — never over a panel or trance.
  const firstRunNaming = firstRun && name === ''
  const open = mode === 'roam' && (firstRunNaming || renaming)
  if (!open) return null
  return <NamingCard renaming={renaming} draft={draft} setDraft={setDraft} />
}

/** The card itself — split so the focus trap mounts/unmounts WITH the dialog
 *  (trap + focus restoration + document-level Esc are its a11y contract). */
function NamingCard({
  renaming,
  draft,
  setDraft,
}: {
  renaming: boolean
  draft: string
  setDraft(next: string): void
}): ReactElement {
  const setName = useFounderStore((s) => s.setName)
  const closeRename = useFounderStore((s) => s.closeRename)
  const trapRef = useFocusTrap()

  const commit = (): void => {
    setName(draft)
    if (renaming) closeRename()
  }
  const dismiss = (): void => {
    // rename → cancel (name unchanged); first run → adopt the default so it sticks
    if (renaming) closeRename()
    else setName('')
  }

  // document-level Esc — not just while the input holds focus
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return (): void => document.removeEventListener('keydown', onKeyDown)
    // dismiss is stable per open (renaming doesn't change mid-dialog)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renaming])

  // one title for both moods (operator copy); only the actions differ by mood
  const commitLabel = renaming ? UI.founder.renameSave : UI.founder.namingBegin
  const dismissLabel = renaming ? UI.founder.renameCancel : UI.founder.namingSkip

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="founder-naming-title"
      tabIndex={-1}
      data-testid="founder-naming"
      className="fixed inset-0 z-hud flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm motion-safe:animate-quest-fade"
    >
      <div className="quest-hud-cluster w-full max-w-sm p-6 text-center">
        <h2
          id="founder-naming-title"
          className="quest-heading text-lg font-semibold text-amber-accent-200"
        >
          {UI.founder.namingTitle}
        </h2>
        <p id="founder-naming-prompt" className="mt-2 text-sm text-parchment-300/85">
          {UI.founder.namingPrompt}
        </p>
        <input
          type="text"
          autoFocus
          value={draft}
          maxLength={FOUNDER_NAME_MAX}
          placeholder={UI.founder.namingPlaceholder}
          aria-labelledby="founder-naming-prompt"
          data-testid="founder-name-input"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          className="quest-track mt-4 w-full rounded-lg border border-amber-accent-300/30 bg-slate-950/60 px-3 py-2 text-center font-display text-base text-parchment-100 outline-none focus:border-amber-accent-300/70 focus-visible:ring-2 focus-visible:ring-amber-accent-300/60"
        />
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            data-testid="founder-name-begin"
            onClick={commit}
            className="quest-medallion-struck rounded-lg px-4 py-2 font-display text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            {commitLabel}
          </button>
          <button
            type="button"
            data-testid="founder-name-skip"
            onClick={dismiss}
            className="rounded-lg px-4 py-1.5 text-xs text-parchment-300/70 transition hover:text-parchment-200"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
