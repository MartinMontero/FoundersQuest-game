// src/ui/DegradedBanner.tsx — the honest banner (canon 02 storage ladder):
// when the ladder fell back to memory, say so plainly. Always on top
// (z-banner), never dismissible — honesty is the point.

import type { ReactElement } from 'react'
import { useDegraded } from '../state/store'
import { UI } from '../strings'

export function DegradedBanner(): ReactElement | null {
  const degraded = useDegraded()
  if (!degraded) return null

  return (
    <div
      role="alert"
      data-testid="degraded-banner"
      className="fixed inset-x-0 top-0 z-banner border-b border-[#8a5a10] bg-gradient-to-b from-amber-accent-300 to-amber-accent-500 px-4 py-2.5 text-center text-sm font-semibold text-ink [box-shadow:0_6px_18px_-6px_rgba(0,0,0,0.55)]"
    >
      {UI.banner.degraded}
    </div>
  )
}
