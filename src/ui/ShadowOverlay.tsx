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
      panelClassName="max-w-lg border-violet-700"
      testId="shadow-overlay"
    >
      <h2 id={titleId} className="text-sm font-semibold uppercase tracking-widest text-violet-300">
        {UI.shadow.title}
      </h2>
      {/* the founder's own words, quoted back — nothing invented */}
      <blockquote
        id={quoteId}
        data-testid="shadow-quote"
        className="mt-3 whitespace-pre-line border-l-2 border-violet-500 pl-3 text-base italic text-slate-100"
      >
        {shadow.quote}
      </blockquote>
      <div className="mt-4 flex items-center gap-3">
        {/* exactly one low-friction action */}
        <button
          type="button"
          data-testid="shadow-action"
          onClick={onAction}
          className="rounded bg-violet-400 px-3 py-1.5 text-sm font-semibold text-slate-950"
        >
          {shadow.action}
        </button>
        <button
          type="button"
          data-testid="shadow-dismiss"
          onClick={onDismiss}
          className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
        >
          {UI.shadow.dismiss}
        </button>
      </div>
    </DialogShell>
  )
}
