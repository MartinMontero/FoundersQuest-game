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
      className="quest-hud pointer-events-none fixed left-4 top-4 z-hud flex w-80 select-none flex-col gap-3 p-4 motion-safe:animate-quest-fade"
    >
      <p data-testid="stage-banner" className="quest-eyebrow text-2xs text-amber-accent-200/90">
        {stageBanner(stage)}
      </p>

      {/* Truth leads — larger, first, a glowing sigil meter (game-design §4) */}
      <div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-gradient-to-br from-amber-accent-200 to-amber-accent-500 [box-shadow:0_0_8px_rgba(242,182,74,0.75)] motion-safe:animate-quest-sigil"
            />
            <span className="font-display text-sm font-semibold tracking-wide text-amber-accent-200">
              {UI.hud.truthLabel}
            </span>
          </span>
          <span
            data-testid="hud-truth-value"
            className="font-display text-base font-semibold text-amber-accent-200"
          >
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
          className={`quest-track mt-1.5 h-3 w-full rounded-full ${
            banked ? 'ring-1 ring-amber-accent-300/70 shadow-amber-glow' : ''
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-accent-300 to-amber-accent-500 [box-shadow:0_0_10px_rgba(242,182,74,0.6)]"
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
            className="mt-1.5 animate-pulse text-2xs italic text-amber-accent-300 motion-reduce:animate-none"
          >
            {UI.hud.truthBanked}
          </p>
        ) : null}
      </div>

      {/* Action follows — a smaller teal-rune banner meter */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium tracking-wide text-teal-rune-200">
            {UI.hud.actionLabel}
          </span>
          <span data-testid="hud-action-value" className="text-xs text-teal-rune-200">
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
          className="quest-track mt-1.5 h-1.5 w-full rounded-full"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-rune-300 to-teal-rune-500 [box-shadow:0_0_8px_rgba(63,217,200,0.5)]"
            style={{ width: `${Math.round(actionValue * 100)}%` }}
          />
        </div>
      </div>

      {/* tier coins as embossed medallions: literal code (E0–E4) struck when held */}
      <ul
        aria-label={UI.hud.coinsLabel}
        className="mt-0.5 grid grid-cols-5 gap-1.5 border-t border-amber-accent-500/20 pt-3"
      >
        {TIERS.map((tier) => {
          const struck = coins[tier] > 0
          return (
            <li
              key={tier}
              data-testid={`hud-coin-e${tier}`}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`quest-medallion font-mono text-[10px] font-bold ${
                  struck ? 'quest-medallion-struck' : ''
                }`}
              >
                {TIER_CODES[tier]}
              </span>
              <span className="text-[10px] leading-none text-parchment-300/70">
                {TIER_METALS[tier]}
              </span>
              <span
                data-testid={`hud-coin-e${tier}-count`}
                className={`font-mono text-2xs leading-none ${
                  struck ? 'text-amber-accent-200' : 'text-parchment-300/50'
                }`}
              >
                {coinCount(coins[tier])}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
