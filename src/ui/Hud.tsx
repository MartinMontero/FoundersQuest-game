// src/ui/Hud.tsx — persistent meters over the canvas (game-design §4).
// Truth LEADS: first in the DOM and visually larger; Action follows. Tier coin
// tallies show the literal codes E0–E4 (never translate, canon 01) with their
// mythic metal names beside them. Data arrives via selectors only — this
// component never computes a metric itself.

import type { ReactElement } from 'react'
import type { EvidenceTier } from '../core/schema'
import { STAGE1_MILESTONE_IDS } from '../game/contracts'
import { useAction, useEvidenceBanked, useTierCounts, useTruth } from '../state/store'
import { STAGES, TIER_CODES, TIER_METALS, UI, coinCount, formatPercent, stageBanner } from '../strings'

const TIERS: readonly EvidenceTier[] = [0, 1, 2, 3, 4]

export function Hud(): ReactElement | null {
  const truthValue = useTruth()
  const actionValue = useAction(STAGE1_MILESTONE_IDS)
  const banked = useEvidenceBanked()
  const coins = useTierCounts()
  const stage = STAGES.find((s) => s.stage === 1)
  if (stage === undefined) return null

  const truthText = truthValue === null ? UI.hud.truthUnlit : formatPercent(truthValue)
  const actionText = formatPercent(actionValue)

  return (
    <div
      data-testid="hud"
      className="pointer-events-none fixed left-4 top-4 z-hud flex w-80 select-none flex-col gap-2"
    >
      <p
        data-testid="stage-banner"
        className="text-2xs uppercase tracking-widest text-slate-400"
      >
        {stageBanner(stage)}
      </p>

      {/* Truth leads — larger, first (game-design §4) */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-amber-200">{UI.hud.truthLabel}</span>
          <span data-testid="hud-truth-value" className="text-sm text-amber-200">
            {truthText}
          </span>
        </div>
        <div
          role="meter"
          aria-label={UI.hud.truthLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={truthValue === null ? 0 : Math.round(truthValue * 100)}
          aria-valuetext={truthText}
          data-testid="hud-truth"
          className={`mt-1 h-3 w-full overflow-hidden rounded bg-slate-800 ${
            banked ? 'ring-1 ring-amber-300/70 shadow-[0_0_10px_rgba(251,191,36,0.45)]' : ''
          }`}
        >
          <div
            className="h-full bg-amber-400"
            style={{ width: `${truthValue === null ? 0 : Math.round(truthValue * 100)}%` }}
          />
        </div>
        {banked ? (
          // evidence stands against an unresolved guardian: the meter is
          // waiting on the Mirror's verdict, not broken (review 5). The pulse
          // stands down under prefers-reduced-motion.
          <p
            role="status"
            data-testid="hud-truth-banked"
            className="mt-1 animate-pulse text-2xs italic text-amber-300 motion-reduce:animate-none"
          >
            {UI.hud.truthBanked}
          </p>
        ) : null}
      </div>

      {/* Action follows — smaller, second */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-sky-200">{UI.hud.actionLabel}</span>
          <span data-testid="hud-action-value" className="text-xs text-sky-200">
            {actionText}
          </span>
        </div>
        <div
          role="meter"
          aria-label={UI.hud.actionLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(actionValue * 100)}
          aria-valuetext={actionText}
          data-testid="hud-action"
          className="mt-1 h-1.5 w-full overflow-hidden rounded bg-slate-800"
        >
          <div className="h-full bg-sky-400" style={{ width: `${Math.round(actionValue * 100)}%` }} />
        </div>
      </div>

      {/* tier coin tallies: literal code + mythic metal + count */}
      <ul aria-label={UI.hud.coinsLabel} className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {TIERS.map((tier) => (
          <li
            key={tier}
            data-testid={`hud-coin-e${tier}`}
            className="flex items-baseline gap-1 text-2xs text-slate-300"
          >
            <span className="font-mono font-bold">{TIER_CODES[tier]}</span>
            <span className="text-slate-400">{TIER_METALS[tier]}</span>
            <span data-testid={`hud-coin-e${tier}-count`} className="font-mono">
              {coinCount(coins[tier])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
