// src/ui/OpeningOverlay.tsx — First Light (Mind & Myth A3): the invitation and
// the 11-beat induction. A letterboxed DOM layer over the LIVE world (the world
// never disappears — art floor §2.7); the Raven speaks in typewriter lines that
// complete instantly on any input and NEVER auto-advance (no timed reading).
// Every artifact beat writes REAL founders-quest:v3 records: the founder's own
// solution to the Vault, a firstLight-tagged guardian with a sealed kill
// criterion (D-I distinct elicitation — s1-l1 untouched), a verbatim E2 quote,
// and the first kill resolved by the founder's own admission (D-G carve-out).
// Replay (openingCompletedAt set) never writes twice — artifact beats show an
// "already done" continue instead. Zero network; pre-written text only (D-E).

import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { FIRST_LIGHT, TIER_CODES, TIER_METALS, UI } from '../strings'
import { useReducedMotion } from '../game/useReducedMotion'

// beat numbers (1 = invitation card; 2..11 = the induction)
const BEAT_COLD_OPEN = 2
const BEAT_MENTOR = 3
const BEAT_VAULT = 4
const BEAT_TIERS = 5
const BEAT_ASSUMPTION = 6
const BEAT_EVIDENCE = 7
const BEAT_KILL = 8
const BEAT_LEGEND = 9
const BEAT_CHART = 10
const BEAT_THRESHOLD = 11

const TYPE_MS_PER_CHAR = 16

/** Typewriter line: reveals; any key/click completes instantly; reduced motion
 *  renders whole. Never advances on its own — advancing is a button (a11y). */
function TypeLine({ text, reduced }: { text: string; reduced: boolean }): ReactElement {
  const [shown, setShown] = useState(reduced ? text.length : 0)
  const doneRef = useRef(reduced)

  useEffect(() => {
    setShown(reduced ? text.length : 0)
    doneRef.current = reduced
    if (reduced) return
    const started = performance.now()
    let raf = 0
    const tick = (): void => {
      const n = Math.floor((performance.now() - started) / TYPE_MS_PER_CHAR)
      if (n >= text.length || doneRef.current) {
        setShown(text.length)
        doneRef.current = true
        return
      }
      setShown(n)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const complete = (): void => {
      doneRef.current = true
      setShown(text.length)
    }
    window.addEventListener('keydown', complete)
    window.addEventListener('pointerdown', complete)
    return (): void => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', complete)
      window.removeEventListener('pointerdown', complete)
    }
  }, [text, reduced])

  return <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{text.slice(0, shown)}</p>
}

/** the letterboxed dialogue frame at the bottom — world stays visible above */
function DialogueFrame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-trance flex justify-center p-4 motion-safe:animate-quest-fade">
      <div
        role="log"
        aria-live="polite"
        data-testid="opening-dialogue"
        className="quest-panel pointer-events-auto w-full max-w-2xl p-5"
      >
        <p className="quest-eyebrow mb-2 text-2xs text-amber-accent-600">{FIRST_LIGHT.mentor}</p>
        {children}
      </div>
    </div>
  )
}

function ContinueButton({ onClick, label }: { onClick: () => void; label?: string }): ReactElement {
  return (
    <button
      type="button"
      data-testid="opening-continue"
      onClick={onClick}
      className="quest-btn quest-btn-gold mt-3 px-3 py-1.5 text-sm"
    >
      {label ?? FIRST_LIGHT.chrome.continueButton}
    </button>
  )
}

/** The invitation card (beat 1) — required-but-escapable; the skip is small,
 *  findable, never hidden, and exempt from override-logging (a courtesy). */
function Invitation({ onAccept, onSkip }: { onAccept: () => void; onSkip: () => void }): ReactElement {
  return (
    <div className="fixed inset-0 z-trance flex items-center justify-center p-4">
      <div className="quest-backdrop absolute inset-0" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={FIRST_LIGHT.invitation.title}
        data-testid="opening-invitation"
        className="quest-panel relative w-full max-w-lg p-7"
      >
        <h2 className="quest-heading text-xl font-semibold">{FIRST_LIGHT.invitation.title}</h2>
        {FIRST_LIGHT.invitation.body.map((line, i) => (
          <p key={i} className="mt-3 text-sm leading-relaxed text-ink-soft">
            {line}
          </p>
        ))}
        <div className="mt-6 flex items-end justify-between gap-4">
          <button
            type="button"
            data-testid="opening-accept"
            onClick={onAccept}
            className="quest-btn quest-btn-seal text-sm"
          >
            {FIRST_LIGHT.invitation.accept}
          </button>
          {/* secondary styled as secondary: small + muted, but present, legible,
              same screen — de-emphasis is hierarchy, hiding would be deception */}
          <button
            type="button"
            data-testid="opening-skip"
            onClick={onSkip}
            className="text-xs italic text-ink-faint underline-offset-2 hover:underline"
          >
            {FIRST_LIGHT.invitation.skip}
          </button>
        </div>
      </div>
    </div>
  )
}

/** wait-for-movement hook (beat 3): resolves on the first WASD/arrow keydown */
function useFirstMovement(active: boolean, onMove: () => void): void {
  const fired = useRef(false)
  useEffect(() => {
    if (!active) {
      fired.current = false
      return
    }
    const onKey = (e: KeyboardEvent): void => {
      const codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (!fired.current && codes.includes(e.code)) {
        fired.current = true
        onMove()
      }
    }
    window.addEventListener('keydown', onKey)
    return (): void => window.removeEventListener('keydown', onKey)
  }, [active, onMove])
}

export function OpeningOverlay(): ReactElement | null {
  const data = useQuestStore((s) => s.data)
  const markInvitationSeen = useQuestStore((s) => s.markInvitationSeen)
  const setOpeningBeat = useQuestStore((s) => s.setOpeningBeat)
  const completeOpening = useQuestStore((s) => s.completeOpening)
  const skipOpening = useQuestStore((s) => s.skipOpening)
  const captureVault = useQuestStore((s) => s.captureVault)
  const addEvidence = useQuestStore((s) => s.addEvidence)
  const registerFirstLightGuardian = useQuestStore((s) => s.registerFirstLightGuardian)
  const resolveFirstLight = useQuestStore((s) => s.resolveFirstLight)
  const recordFirstLightArtifact = useQuestStore((s) => s.recordFirstLightArtifact)
  const unlockChart = useQuestStore((s) => s.unlockChart)
  const uiMode = useUiStore((s) => s.mode)
  const openPanel = useUiStore((s) => s.openPanel)
  const reduced = useReducedMotion()

  const beat = data.openingBeatProgress?.beat ?? null
  const replay = data.openingCompletedAt !== null

  // per-beat local step + inputs (session-only; resume returns to beat start)
  const [step, setStep] = useState(0)
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [moved, setMoved] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const guardianRef = useRef<string | null>(null)

  useEffect(() => {
    // entering a new beat resets the local step machine
    setStep(0)
    setText1('')
    setText2('')
    setPick(null)
    setMoved(false)
  }, [beat])

  useFirstMovement(beat === BEAT_MENTOR && step >= 1, () => setMoved(true))

  // while a panel the beat opened is up, hide the dialogue (world+panel own the
  // screen); when it closes, the beat advances. The opened-flag is a REF scoped
  // to the beat that opened it and cleared synchronously before advancing — a
  // state-based flag survives into the next beat's first render and would skip
  // it (the beat-10 race this replaced).
  const panelOpen = uiMode !== 'roam'
  const panelOpenedForBeat = useRef<number | null>(null)
  useEffect(() => {
    if (uiMode !== 'roam' || panelOpenedForBeat.current !== beat) return
    panelOpenedForBeat.current = null
    if (beat === BEAT_LEGEND) setOpeningBeat(BEAT_CHART)
    else if (beat === BEAT_CHART) setOpeningBeat(BEAT_THRESHOLD)
  }, [uiMode, beat, setOpeningBeat])

  // ---- the invitation (beat 1) ----
  const pristine =
    Object.keys(data.answers).length === 0 &&
    data.assumptions.length === 0 &&
    data.evidence.length === 0 &&
    data.vault.length === 0
  const showInvitation =
    !data.invitationSeen &&
    data.openingCompletedAt === null &&
    data.openingSkippedAt === null &&
    beat === null &&
    pristine

  if (showInvitation) {
    return (
      <Invitation
        onAccept={() => {
          markInvitationSeen()
          setOpeningBeat(BEAT_COLD_OPEN)
        }}
        onSkip={() => {
          markInvitationSeen()
          skipOpening()
        }}
      />
    )
  }

  if (beat === null || panelOpen) return null

  const advance = (to: number): void => setOpeningBeat(to)

  // a small helper: a sequence of typewriter lines, then extra content.
  // `base` = the step value at which the sequence starts (input phases advance
  // `step` before handing over, so line indexing must offset by it).
  const lines = (all: readonly string[], after?: ReactNode, base = 0): ReactElement => {
    const at = Math.min(Math.max(step - base, 0), all.length - 1)
    return (
      <>
        <TypeLine text={all[at] ?? ''} reduced={reduced} />
        {at < all.length - 1 ? (
          <ContinueButton onClick={() => setStep(step + 1)} />
        ) : (
          after ?? null
        )}
        <p className="mt-2 text-2xs italic text-ink-faint">{FIRST_LIGHT.chrome.continueHint}</p>
      </>
    )
  }

  const inputField = (
    value: string,
    set: (v: string) => void,
    label: string,
    testId: string,
  ): ReactElement => (
    <label className="quest-label mt-3 flex flex-col gap-1 text-2xs">
      <span>{label}</span>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
      />
    </label>
  )

  const alreadyDone = (next: number): ReactElement => (
    <>
      <p className="mt-2 text-xs italic text-ink-faint">{FIRST_LIGHT.chrome.replayNote}</p>
      <ContinueButton onClick={() => advance(next)} label={FIRST_LIGHT.chrome.alreadyDone} />
    </>
  )

  let body: ReactElement | null = null

  switch (beat) {
    case BEAT_COLD_OPEN:
      body = lines(FIRST_LIGHT.beats.coldOpen, <ContinueButton onClick={() => advance(BEAT_MENTOR)} />)
      break

    case BEAT_MENTOR:
      body = (
        <>
          <TypeLine
            text={
              moved
                ? FIRST_LIGHT.beats.mentorMeetDone
                : FIRST_LIGHT.beats.mentorMeet[Math.min(step, FIRST_LIGHT.beats.mentorMeet.length - 1)] ?? ''
            }
            reduced={reduced}
          />
          {!moved && step < FIRST_LIGHT.beats.mentorMeet.length - 1 ? (
            <ContinueButton onClick={() => setStep(step + 1)} />
          ) : null}
          {moved ? <ContinueButton onClick={() => advance(BEAT_VAULT)} /> : null}
        </>
      )
      break

    case BEAT_VAULT:
      body =
        step === 0 ? (
          <>
            <TypeLine text={FIRST_LIGHT.beats.vaultAsk} reduced={reduced} />
            {replay ? (
              alreadyDone(BEAT_TIERS)
            ) : (
              <>
                {inputField(text1, setText1, UI.vault.captureLabel, 'opening-vault-text')}
                <ContinueButton
                  onClick={() => {
                    const v = text1.trim()
                    if (v === '') return
                    const entry = captureVault(v)
                    recordFirstLightArtifact(entry.id)
                    setStep(1)
                  }}
                  label={FIRST_LIGHT.chrome.inputContinue}
                />
              </>
            )}
          </>
        ) : (
          lines(FIRST_LIGHT.beats.vaultSealed, <ContinueButton onClick={() => advance(BEAT_TIERS)} />, 1)
        )
      break

    case BEAT_TIERS:
      body =
        step <= 1 ? (
          lines(FIRST_LIGHT.beats.tiersIntro, <ContinueButton onClick={() => setStep(2)} />)
        ) : step === 2 ? (
          <>
            <TypeLine text={FIRST_LIGHT.beats.classifyAsk} reduced={reduced} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {([0, 1, 2, 3, 4] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  data-testid={`opening-classify-${tier}`}
                  onClick={() => {
                    setPick(tier)
                    setStep(3)
                  }}
                  className="quest-btn quest-btn-quiet px-2.5 py-1 text-xs"
                >
                  {TIER_CODES[tier]} {TIER_METALS[tier]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <TypeLine
              text={pick === 1 ? FIRST_LIGHT.beats.classifyRight : FIRST_LIGHT.beats.classifyWrong}
              reduced={reduced}
            />
            <ContinueButton onClick={() => advance(BEAT_ASSUMPTION)} />
          </>
        )
      break

    case BEAT_ASSUMPTION:
      body = replay ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.assumptionAsk[0] ?? ''} reduced={reduced} />
          {alreadyDone(BEAT_EVIDENCE)}
        </>
      ) : step === 0 ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.assumptionAsk[0] ?? ''} reduced={reduced} />
          {inputField(text1, setText1, UI.registry.statementLabel, 'opening-assumption-text')}
          <ContinueButton
            onClick={() => {
              if (text1.trim() !== '') setStep(1)
            }}
            label={FIRST_LIGHT.chrome.inputContinue}
          />
        </>
      ) : step === 1 ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.killCriterionAsk} reduced={reduced} />
          {inputField(text2, setText2, UI.registry.killCriterionLabel, 'opening-kill-criterion')}
          <ContinueButton
            onClick={() => {
              const statement = text1.trim()
              const kill = text2.trim()
              if (statement === '' || kill === '') return
              const g = registerFirstLightGuardian(statement, kill)
              guardianRef.current = g.id
              setStep(2)
            }}
            label={FIRST_LIGHT.chrome.inputContinue}
          />
        </>
      ) : (
        <>
          <TypeLine text={FIRST_LIGHT.beats.assumptionSealed} reduced={reduced} />
          <ContinueButton onClick={() => advance(BEAT_EVIDENCE)} />
        </>
      )
      break

    case BEAT_EVIDENCE:
      body = replay ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.evidenceAsk[0] ?? ''} reduced={reduced} />
          {alreadyDone(BEAT_KILL)}
        </>
      ) : step === 0 ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.evidenceAsk[0] ?? ''} reduced={reduced} />
          {inputField(text1, setText1, UI.registry.evidenceTextLabel, 'opening-evidence-text')}
          {inputField(text2, setText2, UI.registry.evidenceSourceLabel, 'opening-evidence-source')}
          <ContinueButton
            onClick={() => {
              const quote = text1.trim()
              const source = text2.trim()
              if (quote === '' || source === '') return
              const entry = addEvidence({
                tier: 2, // a VERBATIM quote is Word (E2) — the copy teaches the rule (F7)
                text: quote,
                source,
                linkedAssumptionIds: guardianRef.current !== null ? [guardianRef.current] : [],
                stageId: 's1',
              })
              recordFirstLightArtifact(entry.id)
              setStep(1)
            }}
            label={FIRST_LIGHT.chrome.inputContinue}
          />
        </>
      ) : (
        <>
          <TypeLine text={FIRST_LIGHT.beats.evidenceLogged} reduced={reduced} />
          <ContinueButton onClick={() => advance(BEAT_KILL)} />
        </>
      )
      break

    case BEAT_KILL:
      body = replay ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.killAsk[0] ?? ''} reduced={reduced} />
          {alreadyDone(BEAT_LEGEND)}
        </>
      ) : step <= 1 ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.killAsk[Math.min(step, 1)] ?? ''} reduced={reduced} />
          {step === 0 ? (
            <ContinueButton onClick={() => setStep(1)} />
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="opening-kill-admit"
                onClick={() => {
                  const g = registerFirstLightGuardian(FIRST_LIGHT.beats.killAsk[0] ?? '', '')
                  resolveFirstLight(g.id, 'invalidated')
                  setStep(2)
                }}
                className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
              >
                {FIRST_LIGHT.beats.killAdmit}
              </button>
              <button
                type="button"
                data-testid="opening-kill-seen"
                onClick={() => {
                  registerFirstLightGuardian(FIRST_LIGHT.beats.killAsk[0] ?? '', '')
                  setStep(3)
                }}
                className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
              >
                {FIRST_LIGHT.beats.killSeen}
              </button>
            </div>
          )}
        </>
      ) : step === 2 ? (
        <>
          <TypeLine text={FIRST_LIGHT.beats.killCelebrate[0] ?? ''} reduced={reduced} />
          <p
            data-testid="opening-kill-xp"
            className="mt-2 text-sm font-semibold text-amber-accent-600 motion-safe:animate-quest-fade"
          >
            {FIRST_LIGHT.beats.killXp}
          </p>
          <ContinueButton onClick={() => advance(BEAT_LEGEND)} />
        </>
      ) : (
        <>
          <TypeLine text={FIRST_LIGHT.beats.killSeenResponse} reduced={reduced} />
          <ContinueButton onClick={() => advance(BEAT_LEGEND)} />
        </>
      )
      break

    case BEAT_LEGEND:
      body = (
        <>
          <TypeLine text={FIRST_LIGHT.beats.legendHandoff[0] ?? ''} reduced={reduced} />
          <ContinueButton
            onClick={() => {
              unlockChart()
              panelOpenedForBeat.current = BEAT_LEGEND
              openPanel('panel:legend')
            }}
            label={FIRST_LIGHT.legend.title}
          />
        </>
      )
      break

    case BEAT_CHART:
      body = lines(
        FIRST_LIGHT.beats.chartHandoff,
        <ContinueButton
          onClick={() => {
            panelOpenedForBeat.current = BEAT_CHART
            openPanel('panel:chart')
          }}
          label={FIRST_LIGHT.chart.title}
        />,
      )
      break

    case BEAT_THRESHOLD:
      body = (
        <>
          <TypeLine text={FIRST_LIGHT.beats.threshold} reduced={reduced} />
          <ContinueButton
            onClick={() => completeOpening()}
            label={FIRST_LIGHT.chrome.continueButton}
          />
        </>
      )
      break

    default:
      body = null
  }

  if (body === null) return null

  return (
    <>
      {/* letterbox bars — instant under reduced motion, subtle otherwise */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-trance h-10 bg-black/60" />
      <DialogueFrame>{body}</DialogueFrame>
    </>
  )
}
