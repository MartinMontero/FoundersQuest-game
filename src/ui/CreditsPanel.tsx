// src/ui/CreditsPanel.tsx — the attribution page (backlog E-11), a panel like
// the Legend: DialogShell, game paused while open, diegetic parchment. Copy
// lives in src/strings/credits.ts (which mirrors CREDITS.md + VENDORED.md) —
// no visible string is authored here. The parent wires the panel mode and the
// button that opens it; this file only renders.

import { useId, type ReactElement } from 'react'
import { useUiStore } from '../state/ui'
import { CREDIT_SECTIONS, CREDITS, creditProvenance } from '../strings/credits'

import { DialogShell } from './TrancePanel'

export function CreditsPanel(): ReactElement {
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()
  const introId = useId()

  return (
    <DialogShell
      titleId={titleId}
      describedById={introId}
      onClose={closePanel}
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
      testId="credits-panel"
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-amber-accent-500/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {CREDITS.title}
      </h2>
      <p id={introId} className="mt-2 text-xs text-ink-soft">
        {CREDITS.intro}
      </p>

      <div className="mt-4 flex max-h-[62vh] flex-col gap-2 overflow-y-auto pr-1">
        {CREDIT_SECTIONS.map((key) => (
          <section key={key} data-testid={`credits-${key}`} className="quest-aside p-3">
            <h3 className="text-sm font-semibold text-ink">{CREDITS.headings[key]}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {CREDITS.sections[key].map((entry) => (
                <li key={entry.name} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-ink">{entry.name}</p>
                    <p className="mt-0.5 text-2xs text-ink-soft">{creditProvenance(entry)}</p>
                    <p className="mt-0.5 text-2xs text-ink-faint">{entry.role}</p>
                  </div>
                  <span className="shrink-0 rounded border border-ink-faint/40 px-1.5 py-0.5 font-mono text-2xs font-bold text-ink">
                    {entry.license}
                  </span>
                </li>
              ))}
            </ul>
            {key === 'code' ? (
              <div data-testid="credits-code-notes">
                <p className="quest-note mt-2 text-xs">{CREDITS.codeNote}</p>
                <p className="mt-2 text-2xs italic text-ink-faint">{CREDITS.trademarkNote}</p>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          data-testid="credits-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {CREDITS.close}
        </button>
      </div>
    </DialogShell>
  )
}
