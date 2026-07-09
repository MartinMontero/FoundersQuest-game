// src/ui/OnboardingHint.tsx — first-run hint, derived state only: shows while
// answers is EMPTY (no key ever written for it) and the player is roaming.
// Movement keys plus the walk-to-a-shrine line, all from src/strings.

import type { ReactElement } from 'react'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { UI } from '../strings'

export function OnboardingHint(): ReactElement | null {
  const firstRun = useQuestStore((s) => Object.keys(s.data.answers).length === 0)
  const mode = useUiStore((s) => s.mode)
  if (!firstRun || mode !== 'roam') return null

  return (
    <div
      role="note"
      data-testid="onboarding-hint"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-hud flex justify-center px-4 motion-safe:animate-quest-fade"
    >
      <div className="quest-hud px-5 py-3 text-center">
        <p className="text-xs tracking-wide text-parchment-300/85">{UI.onboarding.movement}</p>
        <p className="quest-heading mt-1 text-sm font-semibold text-amber-accent-200">
          {UI.onboarding.interact}
        </p>
      </div>
    </div>
  )
}
