// src/ui/FuneralRiteOverlay.tsx — the Funeral rite (Mind & Myth A4).
// Vigil → Eulogy → Committal → the inheritance, over the LIVE world (a rite
// over a void fails the phase — art floor). Spiritfarer-paced and player-
// controlled: every step advances on the founder's input, nothing is timed.
//
// The Eulogy recites the REAL evidence that killed the belief, verbatim from
// the Ledger — never a summary, never generated. The Committal is one
// deliberate input (the founder's line for the stone → holdFuneral, which
// also writes the Wisdom Codex). Skip is always allowed after ONE warning,
// logged as narrative-only consequence (skipFuneral) — no XP loss, ever.
// The CALLER gates the offer on !trough (the rite never fires in the trough);
// this surface holds whichever rite was opened.

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { tierOf } from '../core/metrics'
import type { Assumption } from '../core/schema'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { RITE, STAGES, TIER_CODES } from '../strings'
import { useFocusTrap } from './TrancePanel'

type RiteStep = 'vigil' | 'eulogy' | 'committal' | 'grant'

export function FuneralRiteOverlay(): ReactElement | null {
  const mode = useUiStore((s) => s.mode)
  const guardianId = useUiStore((s) => s.riteGuardianId)
  const guardian = useQuestStore((s) =>
    guardianId === null ? undefined : s.data.assumptions.find((a) => a.id === guardianId),
  )
  if (mode !== 'rite' || guardian === undefined || guardian.status !== 'invalidated') return null
  return <Rite key={guardian.id} guardian={guardian} />
}

/** world name for the belief's origin stage — "Born <world>." */
function worldOf(originStageId: string): string {
  const stage = STAGES.find((s) => `s${s.stage}` === originStageId)
  return stage?.world ?? originStageId
}

function Rite({ guardian }: { guardian: Assumption }): ReactElement {
  const evidence = useQuestStore((s) => s.data.evidence)
  const holdFuneral = useQuestStore((s) => s.holdFuneral)
  const skipFuneral = useQuestStore((s) => s.skipFuneral)
  const exitRite = useUiStore((s) => s.exitRite)
  const celebrate = useUiStore((s) => s.celebrate)
  const trapRef = useFocusTrap()

  // Esc steps away without holding OR skipping — the funeral stays pending
  // (derived queue) and the HUD ember re-offers it. Never trap a mourner.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      exitRite()
    }
    document.addEventListener('keydown', onKeyDown)
    return (): void => document.removeEventListener('keydown', onKeyDown)
  }, [exitRite])

  const [step, setStep] = useState<RiteStep>('vigil')
  const [line, setLine] = useState('')
  const [skipWarned, setSkipWarned] = useState(false)

  // the evidence that killed it: E2+ entries linked to this guardian, verbatim
  const killedBy = useMemo(
    () => evidence.filter((e) => e.tier >= 2 && e.linkedAssumptionIds.includes(guardian.id)),
    [evidence, guardian.id],
  )
  const proven = tierOf(guardian, evidence) >= 2
  const diedOn = (guardian.resolvedAt ?? '').slice(0, 10)

  const onSeal = (): void => {
    holdFuneral(guardian.id, line)
    setStep('grant')
    celebrate('funeral') // the world exhales — the grave is sealed (E-0)
  }

  const onSkip = (): void => {
    if (!skipWarned) {
      setSkipWarned(true) // the single warning — shown once, then it's a choice
      return
    }
    skipFuneral(guardian.id)
    exitRite()
  }

  return (
    <div className="fixed inset-0 z-trance flex flex-col justify-end">
      {/* the vigil's quiet — letterbox bars, world visible between them */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 h-12 bg-black/60" />
      <div className="flex justify-center p-4 pb-10">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label={RITE.eyebrow}
          tabIndex={-1}
          data-testid="rite-overlay"
          className="quest-panel pointer-events-auto w-full max-w-xl p-6 motion-safe:animate-quest-fade"
        >
          <p className="quest-eyebrow mb-1 text-2xs text-amber-accent-600">{RITE.eyebrow}</p>

          {step === 'vigil' ? (
            <section data-testid="rite-vigil" aria-live="polite">
              <h2 className="quest-heading text-lg font-semibold">{RITE.vigil.title}</h2>
              <p className="mt-1 text-sm italic text-ink-faint">{RITE.vigil.quiet}</p>
              <p className="mt-3 text-sm text-ink-soft">
                {RITE.vigil.beliefLabel}:{' '}
                <span data-testid="rite-belief" className="font-semibold text-ink">
                  “{guardian.statement}”
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {RITE.vigil.born} {worldOf(guardian.originStageId)}. {RITE.vigil.died} {diedOn}.
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <button
                  type="button"
                  data-testid="rite-continue"
                  onClick={() => setStep('eulogy')}
                  className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                >
                  {RITE.vigil.continue}
                </button>
                <SkipControl warned={skipWarned} onSkip={onSkip} onStay={() => setSkipWarned(false)} />
              </div>
            </section>
          ) : null}

          {step === 'eulogy' ? (
            <section data-testid="rite-eulogy" aria-live="polite">
              <h2 className="quest-heading text-lg font-semibold">{RITE.eulogy.title}</h2>
              {killedBy.length > 0 ? (
                <>
                  <p className="mt-2 text-sm text-ink-soft">{RITE.eulogy.intro}</p>
                  <ul className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
                    {killedBy.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-2">
                        <span className="quest-medallion mt-0.5 shrink-0 font-mono text-[10px] font-bold">
                          {TIER_CODES[entry.tier]}
                        </span>
                        <blockquote className="border-l-2 border-amber-accent-500/60 pl-2">
                          <p data-testid="rite-evidence" className="text-sm text-ink">
                            {entry.text}
                          </p>
                          {entry.source.trim() !== '' ? (
                            <p className="mt-0.5 text-2xs text-ink-faint">— {entry.source}</p>
                          ) : null}
                        </blockquote>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p data-testid="rite-unproven" className="mt-2 text-sm italic text-ink-faint">
                  {RITE.eulogy.unproven}
                </p>
              )}
              <div className="mt-4 flex items-end justify-between gap-4">
                <button
                  type="button"
                  data-testid="rite-continue"
                  onClick={() => setStep('committal')}
                  className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                >
                  {RITE.eulogy.continue}
                </button>
                <SkipControl warned={skipWarned} onSkip={onSkip} onStay={() => setSkipWarned(false)} />
              </div>
            </section>
          ) : null}

          {step === 'committal' ? (
            <section data-testid="rite-committal">
              <h2 className="quest-heading text-lg font-semibold">{RITE.committal.title}</h2>
              <label className="mt-3 flex flex-col gap-1">
                <span className="quest-label text-2xs">{RITE.committal.ask}</span>
                <textarea
                  data-testid="rite-line"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder={RITE.committal.placeholder}
                  rows={2}
                  className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                />
              </label>
              <div className="mt-4 flex items-end justify-between gap-4">
                <button
                  type="button"
                  data-testid="rite-seal"
                  onClick={onSeal}
                  className="quest-btn quest-btn-seal text-sm"
                >
                  {RITE.committal.seal}
                </button>
                <SkipControl warned={skipWarned} onSkip={onSkip} onStay={() => setSkipWarned(false)} />
              </div>
            </section>
          ) : null}

          {step === 'grant' ? (
            <section data-testid="rite-grant" aria-live="polite">
              <h2 className="quest-heading text-lg font-semibold">{RITE.grant.title}</h2>
              <p
                data-testid="rite-xp"
                className="mt-2 text-sm font-semibold text-amber-accent-600"
              >
                {proven ? RITE.grant.xpProven : RITE.grant.xpUnproven}
              </p>
              {line.trim() !== '' ? (
                <p className="mt-1 text-sm text-ink-soft">{RITE.grant.wisdom}</p>
              ) : null}
              <p className="mt-1 text-sm text-ink-soft">{RITE.grant.tombstone}</p>
              <button
                type="button"
                data-testid="rite-done"
                onClick={exitRite}
                className="quest-btn quest-btn-gold mt-4 px-3 py-1.5 text-sm"
              >
                {RITE.grant.done}
              </button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** The skip affordance: small and findable, one warning, then the choice. */
function SkipControl({
  warned,
  onSkip,
  onStay,
}: {
  warned: boolean
  onSkip(): void
  onStay(): void
}): ReactElement {
  if (!warned) {
    return (
      <button
        type="button"
        data-testid="rite-skip"
        onClick={onSkip}
        className="text-xs italic text-ink-faint underline-offset-2 hover:underline"
      >
        {RITE.skip.offer}
      </button>
    )
  }
  return (
    <div data-testid="rite-skip-warning" className="max-w-xs text-right">
      <p className="text-2xs italic leading-snug text-ink-faint">{RITE.skip.warning}</p>
      <div className="mt-1.5 flex justify-end gap-2">
        <button
          type="button"
          data-testid="rite-skip-confirm"
          onClick={onSkip}
          className="quest-btn quest-btn-quiet px-2 py-1 text-2xs"
        >
          {RITE.skip.confirm}
        </button>
        <button
          type="button"
          data-testid="rite-skip-cancel"
          onClick={onStay}
          className="quest-btn quest-btn-gold px-2 py-1 text-2xs"
        >
          {RITE.skip.cancel}
        </button>
      </div>
    </div>
  )
}
