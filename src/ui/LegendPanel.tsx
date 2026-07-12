// src/ui/LegendPanel.tsx — the Cartographer's Chart, legend face (L key; Mind
// & Myth A3). The seven HUD elements named plainly, each with one gloss and a
// "more" fold for depth (the CK3 nested-tooltip idea, one honest level for v1).
// Carries the Truth-at-0%-while-evidence-banks explanation so a flat bar never
// reads as broken. Game paused while open (panel mode). Diegetic parchment —
// never a sterile pause menu.

import { useId, useState, type ReactElement } from 'react'
import { useUiStore } from '../state/ui'
import { FIRST_LIGHT, UI } from '../strings'

import { DialogShell } from './TrancePanel'

export function LegendPanel(): ReactElement {
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
      testId="legend-panel"
    >
      <div
        aria-hidden="true"
        className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-amber-accent-500/70 to-transparent"
      />
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {FIRST_LIGHT.legend.title}
      </h2>

      <ul className="mt-4 flex max-h-[62vh] flex-col gap-2 overflow-y-auto pr-1">
        {FIRST_LIGHT.legend.entries.map((entry) => {
          const open = openId === entry.id
          return (
            <li key={entry.id} data-testid={`legend-${entry.id}`} className="quest-aside p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{entry.name}</p>
                  <p className="mt-1 text-xs text-ink-soft">{entry.gloss}</p>
                  {open ? (
                    <p data-testid={`legend-more-${entry.id}`} className="quest-note mt-2 text-xs">
                      {entry.more}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  data-testid={`legend-toggle-${entry.id}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : entry.id)}
                  className="quest-btn quest-btn-quiet shrink-0 px-2 py-1 text-2xs"
                >
                  {open ? FIRST_LIGHT.legend.lessLabel : FIRST_LIGHT.legend.moreLabel}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-2xs italic text-ink-faint">{FIRST_LIGHT.chart.keyHint}</p>
        <button
          type="button"
          data-testid="legend-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}
