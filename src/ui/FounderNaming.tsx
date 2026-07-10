// src/ui/FounderNaming.tsx — the first-run naming moment. Shows once, while the
// founder is still unnamed and the quest is untouched (derived first-run: no
// answers yet), as a centred card over the dimmed world. Type a name and Begin,
// or Stay "founder" — either way the name persists (empty adopts the default),
// so the card never reappears. Keyboard-first: the field autofocuses, Enter
// begins, Escape keeps the default. Device-local only; the name is never sent.

import { useState, type ReactElement } from 'react'
import { useQuestStore } from '../state/store'
import { useFounderStore, FOUNDER_NAME_MAX } from '../state/founder'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'

export function FounderNaming(): ReactElement | null {
  const name = useFounderStore((s) => s.name)
  const setName = useFounderStore((s) => s.setName)
  const firstRun = useQuestStore((s) => Object.keys(s.data.answers).length === 0)
  const mode = useUiStore((s) => s.mode)
  const [draft, setDraft] = useState('')

  // only while unnamed, untouched, and roaming — never over a panel or trance
  if (name !== '' || !firstRun || mode !== 'roam') return null

  const begin = (): void => setName(draft)
  const keepDefault = (): void => setName('')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="founder-naming-title"
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
        <p className="mt-2 text-sm text-parchment-300/85">{UI.founder.namingPrompt}</p>
        <input
          type="text"
          autoFocus
          value={draft}
          maxLength={FOUNDER_NAME_MAX}
          placeholder={UI.founder.namingPlaceholder}
          data-testid="founder-name-input"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              begin()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              keepDefault()
            }
          }}
          className="quest-track mt-4 w-full rounded-lg border border-amber-accent-300/30 bg-slate-950/60 px-3 py-2 text-center font-display text-base text-parchment-100 outline-none focus:border-amber-accent-300/70"
        />
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            data-testid="founder-name-begin"
            onClick={begin}
            className="quest-medallion-struck rounded-lg px-4 py-2 font-display text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            {UI.founder.namingBegin}
          </button>
          <button
            type="button"
            data-testid="founder-name-skip"
            onClick={keepDefault}
            className="rounded-lg px-4 py-1.5 text-xs text-parchment-300/70 transition hover:text-parchment-200"
          >
            {UI.founder.namingSkip}
          </button>
        </div>
      </div>
    </div>
  )
}
