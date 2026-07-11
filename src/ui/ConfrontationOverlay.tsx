// src/ui/ConfrontationOverlay.tsx — the Proving Circle (Mind & Myth A4).
// The confrontation loop's DOM surface, over the LIVE world (the art floor
// bans form-modals-over-darkness): a top status strip for the guardian's
// argument state and a bottom-docked frame for the Ledger, the golden thread,
// and the outcome staging. Everything mechanical is derived from the store —
// this component owns only presentation state (feedback line, outcome flash).
//
// The three rulings surface here exactly as the core enforces them:
// - B2: citing E0/E1 shows the bounce line and nothing else changes.
// - B3: a spent argument (hp 0) narrates; only the recorded verdict resolves.
// - D-C: the Ledger and the thread are NEVER skill-locked. The action wrapper
//   (poise/window rhythm) accelerates access; the auto-window guarantees it.

import { useEffect, useRef, useState, type ReactElement } from 'react'
import {
  argumentStateFrom,
  finisherAvailable,
  openConfrontation,
  type CitationImpact,
} from '../core/confrontation'
import { tierOf } from '../core/metrics'
import type { Assumption } from '../core/schema'
import { useQuestStore, useTrough } from '../state/store'
import { useUiStore } from '../state/ui'
import { CONFRONTATION, TIER_CODES } from '../strings'
import { useFocusTrap } from './TrancePanel'

/** The Circle mounts only in arena mode; the inner component keeps hooks stable. */
export function ConfrontationOverlay(): ReactElement | null {
  const mode = useUiStore((s) => s.mode)
  const guardianId = useUiStore((s) => s.arenaGuardianId)
  if (mode !== 'arena') return null
  return <Arena key={guardianId ?? 'empty'} guardianId={guardianId} />
}

/** Esc leaves the circle — the record persists, the thread never expires. */
function useEscapeToLeave(): void {
  const exitArena = useUiStore((s) => s.exitArena)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      exitArena()
    }
    document.addEventListener('keydown', onKeyDown)
    return (): void => document.removeEventListener('keydown', onKeyDown)
  }, [exitArena])
}

function Arena({ guardianId }: { guardianId: string | null }): ReactElement {
  const guardian = useQuestStore((s) =>
    guardianId === null ? undefined : s.data.assumptions.find((a) => a.id === guardianId),
  )
  useEscapeToLeave()
  if (guardian === undefined) return <EmptyCircle />
  return <Confrontation guardian={guardian} />
}

function EmptyCircle(): ReactElement {
  const exitArena = useUiStore((s) => s.exitArena)
  const trapRef = useFocusTrap()
  return (
    <div className="fixed inset-0 z-trance flex items-end justify-center p-4 pb-8">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={CONFRONTATION.empty.title}
        tabIndex={-1}
        data-testid="arena-empty"
        className="quest-panel w-full max-w-xl p-6 motion-safe:animate-quest-fade"
      >
        <p className="quest-eyebrow mb-1 text-2xs text-amber-accent-600">
          {CONFRONTATION.eyebrow}
        </p>
        <h2 className="quest-heading text-lg font-semibold">{CONFRONTATION.empty.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{CONFRONTATION.empty.body}</p>
        <button
          type="button"
          data-testid="arena-leave"
          onClick={exitArena}
          className="quest-btn quest-btn-quiet mt-4 px-3 py-1.5 text-sm"
        >
          {CONFRONTATION.empty.leave}
        </button>
      </div>
    </div>
  )
}

/** A segmented meter — filled/empty pips, honest numbers alongside. */
function Meter({
  label,
  value,
  max,
  tone,
  testId,
}: {
  label: string
  value: number
  max: number
  tone: 'argument' | 'composure'
  testId: string
}): ReactElement {
  const filled = tone === 'argument' ? 'bg-amber-accent-500' : 'bg-teal-300/80'
  return (
    <div className="flex items-center gap-2">
      <span className="quest-label w-20 text-2xs">{label}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-sm ${i < value ? filled : 'bg-white/10'}`}
          />
        ))}
      </span>
      <span data-testid={testId} className="text-2xs tabular-nums text-ink-faint">
        {value}/{max}
      </span>
    </div>
  )
}

function Confrontation({ guardian }: { guardian: Assumption }): ReactElement {
  const data = useQuestStore((s) => s.data)
  const startConfrontation = useQuestStore((s) => s.startConfrontation)
  const cite = useQuestStore((s) => s.citeInConfrontation)
  const recordVerdict = useQuestStore((s) => s.recordConfrontationVerdict)
  const resolve = useQuestStore((s) => s.resolveConfrontation)
  const exitArena = useUiStore((s) => s.exitArena)
  const enterRite = useUiStore((s) => s.enterRite)
  const trough = useTrough()
  const trapRef = useFocusTrap()

  // stepping into the circle IS testing the belief (idempotent in the store)
  useEffect(() => {
    startConfrontation(guardian.id)
  }, [startConfrontation, guardian.id])

  const confrontation = openConfrontation(data, guardian.id)
  const citations = confrontation?.citations ?? []
  const argument = argumentStateFrom(guardian.importance, citations, data.evidence)
  const finisher = finisherAvailable(confrontation)

  // presentation-only state: the last impact line and the post-strike staging
  const [feedback, setFeedback] = useState<CitationImpact | null>(null)
  const [struck, setStruck] = useState<'invalidated' | 'validated' | null>(null)
  // proven honors are read AFTER the strike from the live record
  const proven = tierOf(guardian, data.evidence) >= 2

  const onCite = (evidenceId: string): void => {
    const impact = cite(guardian.id, evidenceId)
    if (impact !== null) setFeedback(impact)
  }

  const onStrike = (): void => {
    const outcome = confrontation?.outcome
    if (outcome === undefined) return
    resolve(guardian.id)
    setStruck(outcome)
  }

  const criterion = guardian.killCriterion.trim()

  return (
    <div className="pointer-events-none fixed inset-0 z-trance flex flex-col">
      {/* top status strip — the guardian's argument state, world visible below */}
      <div className="flex justify-center p-3">
        <div className="quest-panel pointer-events-auto w-full max-w-2xl px-4 py-2.5">
          <p className="quest-eyebrow text-2xs text-amber-accent-600">
            {CONFRONTATION.eyebrow}
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">{CONFRONTATION.challenge.opens}</p>
          <blockquote
            data-testid="arena-statement"
            className="mt-1 border-l-2 border-amber-accent-500/60 pl-2 text-sm font-semibold text-ink"
          >
            {guardian.statement}
          </blockquote>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
            <Meter
              label={CONFRONTATION.challenge.hpLabel}
              value={argument.hp}
              max={argument.hpMax}
              tone="argument"
              testId="arena-hp"
            />
            <Meter
              label={CONFRONTATION.challenge.composureLabel}
              value={argument.composure}
              max={argument.composureMax}
              tone="composure"
              testId="arena-composure"
            />
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* bottom frame — Ledger · golden thread · outcome */}
      <div className="flex justify-center p-4 pb-6">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label={CONFRONTATION.eyebrow}
          tabIndex={-1}
          data-testid="arena-overlay"
          className="quest-panel pointer-events-auto w-full max-w-2xl p-5 motion-safe:animate-quest-fade"
        >
          {struck !== null ? (
            <Outcome
              outcome={struck}
              proven={proven}
              trough={trough}
              onRite={() => {
                exitArena()
                enterRite(guardian.id)
              }}
              onLeave={exitArena}
            />
          ) : (
            <>
              {/* the feedback line — impact copy, spoken to screen readers */}
              <p
                data-testid="arena-feedback"
                aria-live="polite"
                className="min-h-5 text-sm italic text-ink-soft"
              >
                {feedback !== null ? CONFRONTATION.impact[feedback] : ''}
              </p>
              {argument.hp === 0 ? (
                <p data-testid="arena-spent" className="mt-1 text-sm text-amber-accent-600">
                  {CONFRONTATION.challenge.spent}
                </p>
              ) : null}

              <Ledger citations={citations} onCite={onCite} />

              {/* the golden thread — verdict before interpretation */}
              <section className="mt-4 border-t border-white/10 pt-3">
                <h3 className="quest-label text-2xs text-amber-accent-600">
                  {CONFRONTATION.thread.title}
                </h3>
                {criterion !== '' ? (
                  <>
                    <p className="mt-1 text-xs text-ink-faint">
                      {CONFRONTATION.thread.sealedIntro}
                    </p>
                    <blockquote
                      data-testid="arena-criterion"
                      className="mt-1 border-l-2 border-amber-accent-500/60 pl-2 text-sm text-ink"
                    >
                      {guardian.killCriterion}
                    </blockquote>
                  </>
                ) : (
                  <p data-testid="arena-criterion" className="mt-1 text-xs italic text-ink-faint">
                    {CONFRONTATION.thread.unsealed}
                  </p>
                )}
                {finisher ? (
                  <>
                    <p className="mt-2 text-sm text-amber-accent-600">
                      {CONFRONTATION.thread.ignited}
                    </p>
                    <button
                      type="button"
                      data-testid="arena-finisher"
                      onClick={onStrike}
                      className="quest-btn quest-btn-seal mt-2 text-sm"
                    >
                      {CONFRONTATION.thread.strike}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-ink-soft">
                      {CONFRONTATION.thread.verdictAsk}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="arena-verdict-tripped"
                        onClick={() => recordVerdict(guardian.id, 'invalidated')}
                        className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                      >
                        {CONFRONTATION.thread.tripped}
                        <span className="ml-1.5 text-2xs font-normal text-ink-faint">
                          {CONFRONTATION.thread.trippedGloss}
                        </span>
                      </button>
                      <button
                        type="button"
                        data-testid="arena-verdict-held"
                        onClick={() => recordVerdict(guardian.id, 'validated')}
                        className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
                      >
                        {CONFRONTATION.thread.held}
                        <span className="ml-1.5 text-2xs font-normal text-ink-faint">
                          {CONFRONTATION.thread.heldGloss}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Ledger({
  citations,
  onCite,
}: {
  citations: readonly string[]
  onCite(id: string): void
}): ReactElement {
  const evidence = useQuestStore((s) => s.data.evidence)
  return (
    <section className="mt-3">
      <h3 className="quest-label text-2xs text-amber-accent-600">{CONFRONTATION.ledger.title}</h3>
      <p className="mt-0.5 text-2xs italic text-ink-faint">{CONFRONTATION.ledger.hint}</p>
      {evidence.length === 0 ? (
        <p data-testid="arena-ledger-empty" className="mt-2 text-sm italic text-ink-faint">
          {CONFRONTATION.ledger.empty}
        </p>
      ) : (
        <ul data-testid="arena-ledger" className="mt-2 flex max-h-36 flex-col gap-1 overflow-y-auto pr-1">
          {evidence.map((entry, index) => {
            const cited = citations.includes(entry.id)
            return (
              <li key={entry.id} className="flex items-center gap-2">
                <span className="quest-medallion shrink-0 font-mono text-[10px] font-bold">
                  {TIER_CODES[entry.tier]}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-soft" title={entry.text}>
                  {entry.text}
                </span>
                <button
                  type="button"
                  data-testid={`arena-cite-${index + 1}`}
                  disabled={cited}
                  onClick={() => onCite(entry.id)}
                  className="quest-btn quest-btn-quiet shrink-0 px-2 py-0.5 text-2xs disabled:opacity-40"
                >
                  {cited ? CONFRONTATION.ledger.cited : CONFRONTATION.ledger.cite}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Both outcomes are wins — equally authored (D-D). */
function Outcome({
  outcome,
  proven,
  trough,
  onRite,
  onLeave,
}: {
  outcome: 'invalidated' | 'validated'
  proven: boolean
  trough: boolean
  onRite(): void
  onLeave(): void
}): ReactElement {
  const leaveRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    leaveRef.current?.focus()
  }, [])
  const copy = CONFRONTATION.outcome[outcome]
  const xpLine = proven ? copy.xpProven : copy.xpUnproven
  return (
    <div data-testid="arena-outcome" aria-live="polite">
      <h3 className="quest-heading text-xl font-semibold text-amber-accent-500">{copy.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{copy.body}</p>
      <p data-testid="arena-xp" className="mt-2 text-sm font-semibold text-amber-accent-600">
        {xpLine}
      </p>
      {outcome === 'invalidated' ? (
        trough ? (
          <p data-testid="arena-rite-queued" className="mt-2 text-sm italic text-ink-faint">
            {CONFRONTATION.outcome.invalidated.riteQueued}
          </p>
        ) : (
          <button
            type="button"
            data-testid="arena-to-rite"
            onClick={onRite}
            className="quest-btn quest-btn-gold mt-3 px-3 py-1.5 text-sm"
          >
            {CONFRONTATION.outcome.invalidated.toRite}
          </button>
        )
      ) : null}
      <div className="mt-3">
        <button
          ref={leaveRef}
          type="button"
          data-testid="arena-outcome-leave"
          onClick={onLeave}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {CONFRONTATION.outcome.leave}
        </button>
      </div>
    </div>
  )
}
