// src/ui/Toast.tsx — the transient HUD toast (Photoreal Pass II): a quiet
// amber chip above the move hint that names what just happened (first use:
// milestone flag raises — the operator's QA said the raise felt like nothing).
// Ephemeral by construction: rides the ui store, expires itself, never stored.

import { useEffect, type ReactElement } from 'react'
import { useUiStore } from '../state/ui'

const TOAST_MS = 3200

export function Toast(): ReactElement | null {
  const toast = useUiStore((s) => s.toast)
  const clearToast = useUiStore((s) => s.clearToast)

  useEffect(() => {
    if (toast === null) return
    const timer = window.setTimeout(clearToast, TOAST_MS)
    return (): void => window.clearTimeout(timer)
  }, [toast, clearToast])

  if (toast === null) return null

  return (
    <div
      key={toast.id}
      role="status"
      data-testid="hud-toast"
      className="pointer-events-none fixed bottom-24 left-1/2 z-toast -translate-x-1/2 motion-safe:animate-quest-toast"
    >
      <p className="rounded-lg border border-amber-accent-300/40 bg-slate-deep-900/90 px-4 py-2 text-sm text-amber-accent-100 shadow-amber-glow">
        {toast.text}
      </p>
    </div>
  )
}
