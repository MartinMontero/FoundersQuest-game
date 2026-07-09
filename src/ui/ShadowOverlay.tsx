// src/ui/ShadowOverlay.tsx — the stubbed Shadow's DOM surface. The Shadow
// speaks ONLY the founder's own stored words (the quote is chosen locally by
// UiRoot from the riskiest guardian's origin stage — zero network), paired
// with exactly ONE low-friction action (deep-link to the riskiest guardian in
// the Registry) and a dismiss. Never blocks; Esc dismisses like every surface.

import { useId, type ReactElement } from 'react'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'
import { DialogShell } from './TrancePanel'

export interface ShadowOverlayProps {
  onAction(): void
  onDismiss(): void
}

export function ShadowOverlay({ onAction, onDismiss }: ShadowOverlayProps): ReactElement | null {
  const shadow = useUiStore((s) => s.shadow)
  const titleId = useId()
  const quoteId = useId()
  if (!shadow.visible) return null

  return (
    <DialogShell
      titleId={titleId}
      describedById={quoteId}
      onClose={onDismiss}
      role="alertdialog"
      layerClassName="z-shadow"
      panelClassName="quest-panel--shadow max-w-lg"
      testId="shadow-overlay"
    >
      <h2
        id={titleId}
        className="quest-eyebrow text-sm font-semibold text-[#c4b0ef] [text-shadow:0_0_14px_rgba(122,92,220,0.55)]"
      >
        {UI.shadow.title}
      </h2>
      {/* the founder's own words, quoted back — nothing invented */}
      <blockquote
        id={quoteId}
        data-testid="shadow-quote"
        className="mt-4 whitespace-pre-line border-l-2 border-[#7a5cdc] pl-4 font-display text-base italic text-[#ece7fa]"
      >
        {shadow.quote}
      </blockquote>
      <div className="mt-5 flex items-center gap-3">
        {/* exactly one low-friction action */}
        <button
          type="button"
          data-testid="shadow-action"
          onClick={onAction}
          className="quest-btn quest-btn-gold px-4 py-1.5 text-sm"
        >
          {shadow.action}
        </button>
        <button
          type="button"
          data-testid="shadow-dismiss"
          onClick={onDismiss}
          className="quest-btn px-3 py-1.5 text-sm text-[#cfc4ef] [border:1px_solid_rgba(168,140,226,0.4)] hover:[background-color:rgba(168,140,226,0.14)]"
        >
          {UI.shadow.dismiss}
        </button>
      </div>
    </DialogShell>
  )
}
