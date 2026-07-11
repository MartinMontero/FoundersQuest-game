// src/ui/EgoOverlay.tsx — the Ego at the W8 Launch Threshold (Mind & Myth A5).
// One surface, three faces: the trough DELAY (D-F — never a block, the copy
// says the threshold keeps), the OFFER, and the five-phase FIGHT.
//
// The Ego is derived fresh from the record on entry (src/core/ego.ts — D-B:
// never stored) and the fight's progress is deliberately session-only: no
// canon key exists for it, so leaving re-forms the Ego. The ONLY writes are
// the founder's deliberate acts — returning a projection as a test
// (markTesting) and the integration line (integrateEgo). Every word spoken
// here is pre-written in src/strings/ego.ts (D-E): zero API spend.

import { useMemo, useRef, useState, type ReactElement } from 'react'
import { useEffect } from 'react'
import {
  citationLands,
  damagePhaseFor,
  deriveEgo,
  egoCiteDamage,
  type EgoPhase,
} from '../core/ego'
import type { EvidenceEntry, QuestData } from '../core/schema'
import { milestoneIdsForStage } from '../game/contracts'
import { useQuestStore, useTrough } from '../state/store'
import { useUiStore } from '../state/ui'
import { EGO, TIER_CODES } from '../strings'
import { useFocusTrap } from './TrancePanel'

export function EgoOverlay(): ReactElement | null {
  const mode = useUiStore((s) => s.mode)
  if (mode !== 'ego') return null
  return <Threshold />
}

function useEscapeToLeave(): void {
  const exitEgo = useUiStore((s) => s.exitEgo)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      exitEgo()
    }
    document.addEventListener('keydown', onKeyDown)
    return (): void => document.removeEventListener('keydown', onKeyDown)
  }, [exitEgo])
}

/** shared frame: bottom-docked panel over the LIVE world (art floor) */
function Frame({
  children,
  testId,
}: {
  children: React.ReactNode
  testId: string
}): ReactElement {
  const trapRef = useFocusTrap()
  return (
    <div className="fixed inset-0 z-trance flex flex-col justify-end">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 h-12 bg-black/60" />
      <div className="flex justify-center p-4 pb-8">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label={EGO.eyebrow}
          tabIndex={-1}
          data-testid={testId}
          className="quest-panel pointer-events-auto w-full max-w-2xl p-6 motion-safe:animate-quest-fade"
        >
          <p className="quest-eyebrow mb-1 text-2xs text-amber-accent-600">{EGO.eyebrow}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

function Threshold(): ReactElement {
  const trough = useTrough()
  const exitEgo = useUiStore((s) => s.exitEgo)
  const [entered, setEntered] = useState(false)
  useEscapeToLeave()

  // D-F: the trough DELAYS the offer — the pre-written line, a way back, no fight
  if (trough) {
    return (
      <Frame testId="ego-trough">
        <h2 className="quest-heading text-lg font-semibold">{EGO.trough.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{EGO.trough.body}</p>
        <button
          type="button"
          data-testid="ego-leave"
          onClick={exitEgo}
          className="quest-btn quest-btn-quiet mt-4 px-3 py-1.5 text-sm"
        >
          {EGO.trough.leave}
        </button>
      </Frame>
    )
  }

  if (!entered) {
    return (
      <Frame testId="ego-offer">
        <h2 className="quest-heading text-lg font-semibold">{EGO.offer.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{EGO.offer.body}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            data-testid="ego-enter"
            onClick={() => setEntered(true)}
            className="quest-btn quest-btn-seal text-sm"
          >
            {EGO.offer.enter}
          </button>
          <button
            type="button"
            data-testid="ego-leave"
            onClick={exitEgo}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
          >
            {EGO.offer.leave}
          </button>
        </div>
      </Frame>
    )
  }

  return <Fight />
}

type Feedback =
  | { kind: 'bounce' }
  | { kind: 'deflect'; phase: EgoPhase }
  | { kind: 'land'; phase: EgoPhase }
  | { kind: 'shield'; reason: string }
  | null

function feedbackLine(feedback: Feedback): string {
  if (feedback === null) return ''
  switch (feedback.kind) {
    case 'bounce':
      return EGO.fight.bounce
    case 'shield':
      return `${EGO.fight.shieldIntro} “${feedback.reason}” — ${EGO.fight.shieldBreaks}`
    case 'deflect':
    case 'land': {
      const phase = feedback.phase
      const copy =
        phase === 'denial'
          ? EGO.phases.denial
          : phase === 'rationalization'
            ? EGO.phases.rationalization
            : phase === 'sunk-cost'
              ? EGO.phases.sunkCost
              : null
      if (copy === null) return ''
      return feedback.kind === 'land' ? copy.land : copy.deflect
    }
  }
}

function Fight(): ReactElement {
  const data = useQuestStore((s) => s.data)
  const markTesting = useQuestStore((s) => s.markTesting)
  const integrateEgo = useQuestStore((s) => s.integrateEgo)
  const exitEgo = useUiStore((s) => s.exitEgo)

  // the Ego forms from the record as the fight opens; hpMax is pinned so the
  // phase thresholds stay stable while untested beliefs get returned mid-fight
  const milestoneIds = useMemo(() => milestoneIdsForStage(8), [])
  const ego = deriveEgo(data, milestoneIds)
  const hpMaxRef = useRef(ego.hp)
  const hpMax = hpMaxRef.current

  // session-only fight state (no canon key exists for progress — by design)
  const [dealt, setDealt] = useState(0)
  const [brokenShields, setBrokenShields] = useState(0)
  const [cited, setCited] = useState<readonly string[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [line, setLine] = useState('')
  const [integrated, setIntegrated] = useState(false)

  const hpLeft = Math.max(0, hpMax - dealt)
  const projectionDone = ego.untestedIds.length === 0
  const phase: EgoPhase =
    hpLeft === 0
      ? 'identity-fusion'
      : hpLeft <= hpMax / 3 && !projectionDone
        ? 'projection'
        : damagePhaseFor(hpMax, hpLeft)

  const phaseCopy =
    phase === 'denial'
      ? EGO.phases.denial
      : phase === 'rationalization'
        ? EGO.phases.rationalization
        : phase === 'projection'
          ? EGO.phases.projection
          : phase === 'sunk-cost'
            ? EGO.phases.sunkCost
            : EGO.phases.fusion

  const sealedBy = (entry: EvidenceEntry, record: QuestData): boolean =>
    entry.linkedAssumptionIds.some((id) => {
      const a = record.assumptions.find((x) => x.id === id)
      return a !== undefined && a.killCriterion.trim() !== ''
    })

  const cutsChain = (entry: EvidenceEntry, record: QuestData): boolean =>
    entry.linkedAssumptionIds.some(
      (id) => record.assumptions.find((x) => x.id === id)?.status === 'invalidated',
    )

  const onCite = (entry: EvidenceEntry): void => {
    if (cited.includes(entry.id)) return
    if (entry.tier <= 1) {
      setFeedback({ kind: 'bounce' }) // B2 holds against the Ego too — no spend
      return
    }
    const lands = citationLands(phase, entry.tier, {
      sealed: sealedBy(entry, data),
      cutsChain: cutsChain(entry, data),
    })
    setCited([...cited, entry.id]) // a coin spends once per fight, land or not
    if (!lands) {
      setFeedback({ kind: 'deflect', phase })
      return
    }
    if (brokenShields < ego.shields.length) {
      const shield = ego.shields[brokenShields]
      setBrokenShields(brokenShields + 1)
      setFeedback({ kind: 'shield', reason: shield?.reason ?? '' })
      return
    }
    setDealt(dealt + egoCiteDamage(entry.tier, ego.founderEdge))
    setFeedback({ kind: 'land', phase })
  }

  const onIntegrate = (): void => {
    if (line.trim() === '') return
    integrateEgo(line)
    setIntegrated(true)
  }

  if (integrated) {
    return (
      <Frame testId="ego-integrated">
        <h2 className="quest-heading text-xl font-semibold text-amber-accent-500">
          {EGO.integration.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{EGO.integration.body}</p>
        <p data-testid="ego-capstone" className="mt-2 text-sm font-semibold text-amber-accent-600">
          {EGO.integration.capstone}
        </p>
        <button
          type="button"
          data-testid="ego-done"
          onClick={exitEgo}
          className="quest-btn quest-btn-gold mt-4 px-3 py-1.5 text-sm"
        >
          {EGO.integration.done}
        </button>
      </Frame>
    )
  }

  return (
    <Frame testId="ego-fight">
      {/* the Ego's state — conviction, walls, the unmourned */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="quest-label text-2xs">
          {EGO.fight.hpLabel}{' '}
          <span data-testid="ego-hp" className="tabular-nums text-ink">
            {hpLeft}/{hpMax}
          </span>
        </span>
        {ego.shields.length > 0 ? (
          <span className="quest-label text-2xs">
            {EGO.fight.shieldsLabel}{' '}
            <span data-testid="ego-shields" className="tabular-nums text-ink">
              {ego.shields.length - brokenShields}/{ego.shields.length}
            </span>
          </span>
        ) : null}
        {ego.ghostIds.length > 0 ? (
          <span data-testid="ego-ghosts" className="quest-label text-2xs">
            {EGO.fight.ghostsLabel} <span className="tabular-nums text-ink">{ego.ghostIds.length}</span>
          </span>
        ) : null}
      </div>

      {/* the phase — its title and the Ego's pre-written line */}
      <h2 data-testid="ego-phase" className="quest-heading mt-3 text-lg font-semibold">
        {phaseCopy.title}
      </h2>
      <p className="mt-1 text-sm italic text-ink">{phaseCopy.enter}</p>

      {/* the feedback line */}
      <p
        data-testid="ego-feedback"
        aria-live="polite"
        className="mt-2 min-h-5 text-sm italic text-ink-soft"
      >
        {feedbackLine(feedback)}
      </p>

      {phase === 'projection' ? (
        <section data-testid="ego-projection" className="mt-2">
          <p className="text-sm text-ink-soft">{EGO.phases.projection.body}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {ego.untestedIds.map((id, index) => {
              const a = data.assumptions.find((x) => x.id === id)
              if (a === undefined) return null
              return (
                <li key={id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-ink" title={a.statement}>
                    “{a.statement}”
                  </span>
                  <button
                    type="button"
                    data-testid={`ego-return-${index + 1}`}
                    onClick={() => markTesting(id)}
                    className="quest-btn quest-btn-gold shrink-0 px-2 py-0.5 text-2xs"
                  >
                    {EGO.phases.projection.returnOne}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {phase === 'identity-fusion' ? (
        <section data-testid="ego-fusion" className="mt-2">
          <p className="text-sm text-ink-soft">{EGO.phases.fusion.body}</p>
          <label className="mt-3 flex flex-col gap-1">
            <span className="quest-label text-2xs">{EGO.phases.fusion.ask}</span>
            <textarea
              data-testid="ego-line"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder={EGO.phases.fusion.placeholder}
              rows={2}
              className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
            />
          </label>
          <button
            type="button"
            data-testid="ego-integrate"
            onClick={onIntegrate}
            className="quest-btn quest-btn-seal mt-3 text-sm"
          >
            {EGO.phases.fusion.seal}
          </button>
        </section>
      ) : null}

      {phase !== 'identity-fusion' && phase !== 'projection' ? (
        <section className="mt-3">
          <p className="quest-label text-2xs text-amber-accent-600">{EGO.fight.ledgerHint}</p>
          {data.evidence.length === 0 ? (
            <p data-testid="ego-ledger-empty" className="mt-2 text-sm italic text-ink-faint">
              {EGO.fight.ledgerEmpty}
            </p>
          ) : (
            <ul
              data-testid="ego-ledger"
              className="mt-2 flex max-h-36 flex-col gap-1 overflow-y-auto pr-1"
            >
              {data.evidence.map((entry, index) => {
                const spent = cited.includes(entry.id)
                return (
                  <li key={entry.id} className="flex items-center gap-2">
                    <span className="quest-medallion shrink-0 font-mono text-[10px] font-bold">
                      {TIER_CODES[entry.tier]}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-xs text-ink-soft"
                      title={entry.text}
                    >
                      {entry.text}
                    </span>
                    <button
                      type="button"
                      data-testid={`ego-cite-${index + 1}`}
                      disabled={spent}
                      onClick={() => onCite(entry)}
                      className="quest-btn quest-btn-quiet shrink-0 px-2 py-0.5 text-2xs disabled:opacity-40"
                    >
                      {spent ? EGO.fight.cited : EGO.fight.cite}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}
    </Frame>
  )
}
