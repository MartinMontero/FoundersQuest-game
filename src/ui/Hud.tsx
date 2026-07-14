// src/ui/Hud.tsx — persistent meters over the canvas (game-design §4), styled to
// the OoT-inspired iconographic corner HUD (art-direction pillar 5): chunky
// rounded corner clusters, warm gold + teal, readable at a glance — a game HUD,
// not a document. Truth LEADS (top-left, the "life" slot) as a glowing crystal
// gauge; Action is a smaller bar beneath it; the tier "currency metals" E0–E4
// (never translate, canon 01) sit bottom-left as a collectible coin tray with
// their mythic metal names beside them.
//
// CHROME ONLY: this component never computes a metric — every value arrives via a
// selector and every e2e-read value keeps its exact test id and rendered text
// (hud-truth-value, hud-action-value, hud-truth-banked, hud-coin-e*-count). The
// trance/journal parchment panels are untouched (they stay diegetic writing
// surfaces). Cluster fills are near-opaque so the HUD reads on the constrained
// tier, where backdrop-filter is dropped.

import { useEffect, useRef, useState, type ReactElement } from 'react'
import { pendingFunerals, restlessGhosts } from '../core/confrontation'
import { egoIntegrated } from '../core/ego'
import type { EvidenceTier } from '../core/schema'
import { milestoneIdsForStage } from '../game/contracts'
import { founderDisplayName, useFounderStore } from '../state/founder'
import { useJourneyStore } from '../state/journey'
import { useAction, useEvidenceBanked, useQuestStore, useTierCounts, useTrough, useTruth } from '../state/store'
import { useUiStore } from '../state/ui'
import { EGO, FIELD, FIRST_LIGHT, RITE, STAGES, TIER_CODES, TIER_METALS, UI, coinCount, formatPercent, stageBanner } from '../strings'

const TIERS: readonly EvidenceTier[] = [0, 1, 2, 3, 4]

export function Hud(): ReactElement | null {
  const currentStage = useJourneyStore((s) => s.currentStage)
  const truthValue = useTruth()
  const actionValue = useAction(milestoneIdsForStage(currentStage))
  const banked = useEvidenceBanked()
  const coins = useTierCounts()
  const founderName = useFounderStore((s) => s.name)
  const chartUnlocked = useQuestStore((s) => s.data.chartUnlocked)
  const openPanel = useUiStore((s) => s.openPanel)
  const openRename = useFounderStore((s) => s.openRename)
  // the funeral ember: pending rites first, then restless ghosts (lay to rest).
  // NEVER offered in the trough (the rite queues — canon cadence law) and only
  // from roam, so it can't stomp a trance or an open panel.
  const roaming = useUiStore((s) => s.mode === 'roam')
  const inTrough = useTrough()
  const pendingRiteId = useQuestStore((s) => pendingFunerals(s.data)[0]?.id ?? null)
  const ghostRiteId = useQuestStore((s) => restlessGhosts(s.data)[0]?.guardianId ?? null)
  const enterRite = useUiStore((s) => s.enterRite)
  const hasDistance = useQuestStore((s) => egoIntegrated(s.data))
  // the Action bar flashes when it MOVES upward (a milestone raise) — pure
  // presentation: a keyed remount re-fires the one-shot teal pulse each time
  const actionPctNow = Math.round(actionValue * 100)
  const prevActionPct = useRef(actionPctNow)
  const [actionPulse, setActionPulse] = useState(0)
  useEffect(() => {
    if (actionPctNow > prevActionPct.current) setActionPulse((n) => n + 1)
    prevActionPct.current = actionPctNow
  }, [actionPctNow])

  const stage = STAGES.find((s) => s.stage === currentStage)
  if (stage === undefined) return null

  const riteOfferId = pendingRiteId ?? ghostRiteId
  const riteOffer = roaming && !inTrough && riteOfferId !== null

  const truthText = truthValue === null ? UI.hud.truthUnlit : formatPercent(truthValue)
  const actionText = formatPercent(actionValue)
  const truthPct = truthValue === null ? 0 : Math.round(truthValue * 100)
  const actionPct = Math.round(actionValue * 100)

  // Full-viewport, pointer-transparent layer: it still wraps every HUD element
  // (data-testid="hud") while its children anchor to the screen corners.
  return (
    <div
      data-testid="hud"
      className="pointer-events-none fixed inset-0 z-hud select-none motion-safe:animate-quest-fade"
    >
      {/* Top-left: the founder's name, the world banner, Truth (lead), Action */}
      <div className="quest-hud-cluster absolute left-4 top-4 flex w-72 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2 border-b border-amber-accent-300/15 pb-2">
          <span className="text-2xs uppercase tracking-[0.2em] text-parchment-300/60">
            {UI.founder.hudTitle}
          </span>
          <button
            type="button"
            data-testid="hud-founder-name"
            onClick={openRename}
            title={UI.founder.renameHint}
            className="quest-heading pointer-events-auto max-w-[60%] truncate rounded font-display text-sm font-semibold text-amber-accent-200 transition hover:text-amber-accent-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent-300/60"
          >
            {founderDisplayName(founderName)}
          </button>
        </div>
        <p
          data-testid="stage-banner"
          className="quest-hud-title text-sm font-semibold leading-snug"
        >
          {stageBanner(stage)}
        </p>

        {/* the Cartographer's Chart — in the HUD once handed over (skippers included) */}
        {chartUnlocked ? (
          <div className="pointer-events-auto flex gap-1.5">
            <button
              type="button"
              data-testid="hud-chart"
              title={FIRST_LIGHT.chart.title}
              onClick={() => openPanel('panel:chart')}
              className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
            >
              {FIRST_LIGHT.chart.hudChart}
            </button>
            <button
              type="button"
              data-testid="hud-legend"
              title={FIRST_LIGHT.legend.title}
              onClick={() => openPanel('panel:legend')}
              className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
            >
              {FIRST_LIGHT.chart.hudLegend}
            </button>
            <button
              type="button"
              data-testid="hud-field"
              title={FIELD.title}
              onClick={() => openPanel('panel:field')}
              className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
            >
              {FIELD.hudButton}
            </button>
          </div>
        ) : null}

        {/* the funeral ember — a queued rite (or a restless ghost) awaits */}
        {riteOffer ? (
          <button
            type="button"
            data-testid="hud-funeral"
            onClick={() => {
              if (riteOfferId !== null) enterRite(riteOfferId)
            }}
            className="quest-btn quest-btn-gold pointer-events-auto self-start px-2 py-0.5 text-2xs"
          >
            {pendingRiteId !== null ? RITE.hud.pending : RITE.hud.ghost}
          </button>
        ) : null}

        {/* Truth leads — a glowing crystal gauge, the "life" slot (game-design §4) */}
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="quest-crystal motion-safe:animate-quest-sigil" />
              <span className="font-display text-sm font-semibold tracking-wide text-amber-accent-200">
                {UI.hud.truthLabel}
              </span>
            </span>
            <span
              data-testid="hud-truth-value"
              className="font-display text-lg font-semibold text-amber-accent-100 [text-shadow:0_0_10px_rgba(242,182,74,0.45)]"
            >
              {truthText}
            </span>
          </div>
          <div
            role="meter"
            aria-label={UI.hud.truthLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={truthPct}
            aria-valuetext={truthText}
            data-testid="hud-truth"
            className={`quest-track mt-1.5 h-3.5 w-full rounded-full ${
              banked
                ? 'ring-2 ring-amber-accent-300/70 shadow-amber-glow motion-safe:animate-quest-truth-glow'
                : ''
            }`}
          >
            <div className="quest-fill-truth h-full rounded-full" style={{ width: `${truthPct}%` }} />
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

        {/* Action follows — a smaller teal-rune bar */}
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
            key={actionPulse}
            role="meter"
            aria-label={UI.hud.actionLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={actionPct}
            aria-valuetext={actionText}
            data-testid="hud-action"
            className={`quest-track mt-1.5 h-2 w-full rounded-full ${
              actionPulse > 0 ? 'motion-safe:animate-quest-action-pulse' : ''
            }`}
          >
            <div
              className="quest-fill-action h-full rounded-full"
              style={{ width: `${actionPct}%` }}
            />
          </div>
          {/* Cartographer's Distance — the Ego's capstone (A5): once integrated,
              the drift between Action and Truth reads permanently, from here on */}
          {hasDistance ? (
            <p
              data-testid="hud-distance"
              title={EGO.capstone.hudTitle}
              className="mt-1 text-2xs text-parchment-300/70"
            >
              {EGO.capstone.hudLabel}: {EGO.capstone.hudValue(Math.max(0, actionPct - truthPct))}
            </p>
          ) : null}
        </div>
      </div>

      {/* Bottom-left: the tier "currency metals" E0–E4 as a collectible coin tray.
          Literal code (E0–E4) struck when held; mythic metal name + tally beside. */}
      <ul
        aria-label={UI.hud.coinsLabel}
        className="quest-hud-cluster absolute bottom-4 left-4 flex gap-2 px-3 py-2.5"
      >
        {TIERS.map((tier) => {
          const struck = coins[tier] > 0
          return (
            <li
              key={tier}
              data-testid={`hud-coin-e${tier}`}
              className="flex w-12 flex-col items-center gap-1 text-center"
            >
              <span
                className={`quest-medallion font-mono text-[10px] font-bold ${
                  struck ? 'quest-medallion-struck' : ''
                }`}
              >
                {TIER_CODES[tier]}
              </span>
              <span className="whitespace-nowrap text-[10px] leading-none text-parchment-300/70">
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
