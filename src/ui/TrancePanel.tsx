// src/ui/TrancePanel.tsx — the shrine writing panel (game-design §2 F3–F5).
// Question text renders VERBATIM from src/strings/questions.ts (plus its
// mechanic note); all chrome copy from src/strings/ui.ts. No <form> — explicit
// key handling: Enter = newline in textareas, Ctrl+Enter = inscribe,
// Esc = stand up. Drafts live in this module's in-memory map for the session
// only — never the store, never storage, never serialized (game-design §2.1).
//
// This file is also home to the shared dialog chrome (DialogShell +
// useFocusTrap) used by every DOM dialog surface — it lives here, on the
// primary dialog, so the module graph stays acyclic (UiRoot → panels → here).

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { tierOf } from '../core/metrics'
import type { Answer, Assumption, EvidenceEntry, Importance } from '../core/schema'
import { questStore, useQuestStore, type VaultEntry } from '../state/store'
import { useUiStore } from '../state/ui'
import { STAGES, UI, VAULT_SOLUTION_WORDS, type Question, type QuestionTag } from '../strings'
import { DecisionInput, type Decision } from './inputs/DecisionInput'
import { FiveWhysInput } from './inputs/FiveWhysInput'
import { FuneralInput, type FuneralCandidate } from './inputs/FuneralInput'
import { IfThenInput } from './inputs/IfThenInput'
import { JoyInput } from './inputs/JoyInput'
import { ListInput } from './inputs/ListInput'
import { NamesInput } from './inputs/NamesInput'
import { NumberInput } from './inputs/NumberInput'
import { QuickaddInput, type QuickaddEntry } from './inputs/QuickaddInput'
import { SealInput } from './inputs/SealInput'
import { SpineInput } from './inputs/SpineInput'
import { TextAnswer } from './inputs/TextAnswer'
import { VaultPickInput } from './inputs/VaultPickInput'
import { VerbatimInput } from './inputs/VerbatimInput'
import { VerdictInput, type Verdict } from './inputs/VerdictInput'

// ---------------------------------------------------------------------------
// Shared dialog chrome
// ---------------------------------------------------------------------------

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Focus trap for modal surfaces: moves focus in on mount (initialFocus first,
 * else the first focusable control, else the container), keeps Tab/Shift+Tab
 * cycling inside, and restores the previously focused element on unmount.
 *
 * The Tab listener sits on `document`, not the container: a commit action can
 * unmount/disable the focused control mid-dialog, dropping focus to <body> —
 * keyboard handling must keep working from that dead spot (adversarial review
 * 2), so any Tab while the trap is mounted is pulled back inside.
 */
export function useFocusTrap(
  initialFocus?: RefObject<HTMLElement | null>,
): MutableRefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (node === null) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const target = initialFocus?.current ?? node.querySelector<HTMLElement>(FOCUSABLE) ?? node
    target.focus()

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || event.defaultPrevented) return
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (first === undefined || last === undefined) {
        event.preventDefault()
        node.focus()
        return
      }
      const active = document.activeElement
      // focus fell outside the trap (e.g. a commit unmounted the focused
      // control) — pull it back to the first control instead of letting Tab
      // wander the page behind the modal
      if (!(active instanceof HTMLElement) || !node.contains(active)) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return (): void => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [initialFocus])

  return ref
}

export interface DialogShellProps {
  /** id of the element naming the dialog (aria-labelledby) */
  titleId: string
  /** id of the element describing the dialog (aria-describedby), when useful */
  describedById?: string
  onClose(): void
  role?: 'dialog' | 'alertdialog'
  /** QuestStyles z-layer class from tailwind.config (z-trance / z-panel / z-shadow) */
  layerClassName: string
  /** panel box classes; must include a max-width when overriding the default */
  panelClassName?: string
  initialFocus?: RefObject<HTMLElement | null>
  testId?: string
  children: ReactNode
}

/**
 * Modal shell: backdrop + semantic dialog (aria-modal, labelled), focus trap,
 * Esc-to-close (consistent across every surface). Escape listens at document
 * level while the dialog is mounted, so it works even when a commit action
 * just unmounted the focused control and focus sits on <body> (adversarial
 * review 2). No animation — the DOM panels are motion-free, so
 * prefers-reduced-motion needs no variant here.
 */
export function DialogShell({
  titleId,
  describedById,
  onClose,
  role = 'dialog',
  layerClassName,
  panelClassName = 'max-w-xl',
  initialFocus,
  testId,
  children,
}: DialogShellProps): ReactElement {
  const trapRef = useFocusTrap(initialFocus)

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // defaultPrevented marks the press as consumed, so stacked dialogs
      // (e.g. the Shadow over a panel) close one per Esc, not all at once
      event.preventDefault()
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return (): void => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className={`fixed inset-0 ${layerClassName} flex items-center justify-center p-4`}>
      <div
        className="quest-backdrop absolute inset-0 motion-safe:animate-quest-fade"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={trapRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        tabIndex={-1}
        data-testid={testId}
        className={`quest-panel relative max-h-[85vh] w-full overflow-y-auto p-7 motion-safe:animate-quest-rise ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trance drafts — session-only component state (game-design §2.1)
// ---------------------------------------------------------------------------

export type TranceDraft =
  | { kind: 'text'; text: string }
  | { kind: 'names'; names: string[] }
  | { kind: 'fivewhys'; whys: string[] }
  | { kind: 'number'; value: string; unit: string; context: string }
  | { kind: 'list'; items: string[] }
  // `pending` is the un-entered quickadd line — part of the draft, so Esc +
  // re-kneel never loses it (review 8c); it is NOT serialized on inscribe
  | { kind: 'quickadd'; entries: QuickaddEntry[]; pending: string }
  // ---- per-world controls (§2.1). Structured kinds resolve to exact 02 keys ----
  | { kind: 'verbatim'; quotes: string[] }
  | { kind: 'vault'; selectedId: string | null; fallback: string }
  // `registered` is remembered in the draft so re-kneel never re-offers the IF
  | { kind: 'ifthen'; ifPart: string; thenPart: string; withinDays: string; registered: boolean }
  | { kind: 'seal'; text: string }
  | { kind: 'verdict'; verdict: Verdict }
  | { kind: 'registry'; selectedId: string | null }
  | { kind: 'decision'; decision: Decision; citedEvidenceIds: string[] }
  | { kind: 'spine'; beats: string[]; citedEvidenceIds: string[] }
  | { kind: 'joy'; text: string }

/**
 * Store-derived data + side-effect callbacks the structured controls need but
 * the draft cannot hold: the Vault's captured ideas (vault pick), the ledger
 * (decision/spine citations), Stage-1 guardians (the funeral), the thread
 * sealed at s4-th (verdict reads it), and this shrine's stored answer (seal's
 * read-only lock). `seal`/`holdFuneral` are self-committing (they write AND
 * stand the founder up); the rest are inline affordances.
 */
export interface ControlContext {
  vault: readonly VaultEntry[]
  evidence: readonly EvidenceEntry[]
  funeralCandidates: readonly FuneralCandidate[]
  /** this shrine's stored answer — seal reads sealedAt to lock itself read-only */
  storedAnswer: Answer | undefined
  /** the s4-th answer — verdict shows the sealed thread above the ruling */
  sealedThreadAnswer: Answer | undefined
  registerGuardian(statement: string, importance: Importance, killCriterion: string): string
  /** true when a guardian with this exact statement already stands at this shrine's
   *  stage — the ifthen register affordance dedupes on it so an edited-then-re-kneeled
   *  IF can never mint a second guardian (which would inflate Truth's denominator). */
  hasGuardian(statement: string): boolean
  logQuote(text: string, source: string): void
  seal(text: string): void
  holdFuneral(assumptionId: string): void
}

/** Tags whose control owns its own commit button — the generic Inscribe is hidden. */
const SELF_COMMIT_TAGS: ReadonlySet<QuestionTag> = new Set<QuestionTag>(['seal', 'registry'])

/** Esc keeps the draft for the session — in memory only, never persisted. */
const sessionDrafts = new Map<string, TranceDraft>()

function splitLines(text: string | undefined): string[] {
  if (text === undefined || text === '') return []
  return text.split('\n')
}

function nonEmpty(line: string): boolean {
  return line.trim() !== ''
}

/**
 * Rebuild quickadd entries from stored answer lines, re-attaching guardians
 * registered in an earlier trance: an entry whose "This only works if <entry>"
 * statement already stands with the same origin stage keeps its guardianId, so
 * the affordance is not re-offered for already-registered entries (review 8c).
 */
export function reattachQuickaddEntries(
  lines: readonly string[],
  stageId: string,
  assumptions: readonly Assumption[],
): QuickaddEntry[] {
  return lines.map((text) => {
    const match = assumptions.find(
      (a) =>
        a.originStageId === stageId &&
        a.statement === `${UI.trance.quickaddStatementPrefix}${text}`,
    )
    return match === undefined ? { text } : { text, guardianId: match.id }
  })
}

/** Fresh draft for a tag, prefilled from the stored answer when one exists. */
export function initialDraft(
  tag: QuestionTag | null,
  stored: Answer | undefined,
  stageId: string,
  assumptions: readonly Assumption[],
  vault: readonly VaultEntry[],
): TranceDraft {
  switch (tag) {
    case 'names': {
      const names = splitLines(stored?.text)
      while (names.length < 3) names.push('')
      return { kind: 'names', names }
    }
    case 'fivewhys': {
      const whys = [...(stored?.whys ?? [])]
      while (whys.length < 5) whys.push('')
      return { kind: 'fivewhys', whys: whys.slice(0, 5) }
    }
    case 'number': {
      const lines = splitLines(stored?.text)
      const head = lines[0] ?? ''
      const space = head.indexOf(' ')
      return {
        kind: 'number',
        value: space === -1 ? head : head.slice(0, space),
        unit: space === -1 ? '' : head.slice(space + 1),
        context: lines.slice(1).join('\n'),
      }
    }
    case 'list': {
      const items = splitLines(stored?.text)
      if (items.length === 0) items.push('')
      return { kind: 'list', items }
    }
    case 'quickadd':
      return {
        kind: 'quickadd',
        entries: reattachQuickaddEntries(splitLines(stored?.text), stageId, assumptions),
        pending: '',
      }
    case 'verbatim': {
      const quotes = splitLines(stored?.text)
      while (quotes.length < 5) quotes.push('')
      return { kind: 'verbatim', quotes }
    }
    case 'vault': {
      const text = stored?.text ?? ''
      const match = text === '' ? undefined : vault.find((v) => v.text === text)
      return match !== undefined
        ? { kind: 'vault', selectedId: match.id, fallback: '' }
        : { kind: 'vault', selectedId: null, fallback: text }
    }
    case 'ifthen': {
      const ifPart = stored?.ifPart ?? ''
      // reattach the IF-guardian registered in an earlier trance (statement + origin)
      const registered =
        ifPart.trim() !== '' &&
        assumptions.some((a) => a.originStageId === stageId && a.statement === ifPart.trim())
      return {
        kind: 'ifthen',
        ifPart,
        thenPart: stored?.thenPart ?? '',
        withinDays: stored?.withinDays !== undefined ? String(stored.withinDays) : '',
        registered,
      }
    }
    case 'seal':
      return { kind: 'seal', text: stored?.text ?? '' }
    case 'verdict': {
      const v = stored?.verdict
      return { kind: 'verdict', verdict: v === 'yes' || v === 'no' ? v : '' }
    }
    case 'registry':
      return { kind: 'registry', selectedId: null }
    case 'decision': {
      const d = stored?.decision
      return {
        kind: 'decision',
        decision: d === 'pivot' || d === 'persevere' ? d : '',
        citedEvidenceIds: [...(stored?.citedEvidenceIds ?? [])],
      }
    }
    case 'spine': {
      const beats = splitLines(stored?.text)
      while (beats.length < 5) beats.push('')
      return { kind: 'spine', beats, citedEvidenceIds: [...(stored?.citedEvidenceIds ?? [])] }
    }
    case 'joy':
      return { kind: 'joy', text: stored?.text ?? '' }
    // story / falsify / untagged — and any not-yet-built tag — get plain prose
    default:
      return { kind: 'text', text: stored?.text ?? '' }
  }
}

function numberText(draft: Extract<TranceDraft, { kind: 'number' }>): string {
  const head = [draft.value.trim(), draft.unit.trim()].filter(nonEmpty).join(' ')
  const context = draft.context.trim()
  if (head === '') return context
  if (context === '') return head
  return `${head}\n${context}`
}

/** The draft's combined text — vault-nudge scanning and vault capture use this. */
export function draftToText(draft: TranceDraft): string {
  switch (draft.kind) {
    case 'text':
      return draft.text
    case 'names':
      return draft.names.filter(nonEmpty).join('\n')
    case 'fivewhys':
      return draft.whys.filter(nonEmpty).join('\n')
    case 'number':
      return numberText(draft)
    case 'list':
      return draft.items.filter(nonEmpty).join('\n')
    case 'quickadd':
      return draft.entries.map((entry) => entry.text).join('\n')
    case 'verbatim':
      return draft.quotes.filter(nonEmpty).join('\n')
    case 'vault':
      return draft.fallback
    case 'ifthen':
      return [draft.ifPart, draft.thenPart].map((s) => s.trim()).filter(nonEmpty).join(' → ')
    case 'seal':
      return draft.text
    case 'verdict':
      return draft.verdict
    case 'registry':
      return ''
    case 'decision':
      return draft.decision
    case 'spine':
      return draft.beats.filter(nonEmpty).join('\n')
    case 'joy':
      return draft.text
  }
}

/**
 * The exact 02 Answer fields the inscribe writes — nothing else. Structured
 * kinds map to their canon keys; `seal`/`registry` are self-committing (their
 * write happens in the control's own action), so their entries here are inert.
 */
export function answerFields(draft: TranceDraft, ctx: ControlContext): Partial<Answer> {
  switch (draft.kind) {
    case 'fivewhys':
      return { whys: draft.whys.map((why) => why.trim()) }
    case 'ifthen': {
      const withinDays = Number.parseInt(draft.withinDays, 10)
      return {
        ifPart: draft.ifPart.trim(),
        thenPart: draft.thenPart.trim(),
        withinDays: Number.isFinite(withinDays) && withinDays > 0 ? withinDays : undefined,
      }
    }
    case 'verdict':
      return { verdict: draft.verdict }
    case 'decision':
      return { decision: draft.decision, citedEvidenceIds: [...draft.citedEvidenceIds] }
    case 'spine':
      return {
        text: draft.beats.map((b) => b.trim()).filter(nonEmpty).join('\n'),
        citedEvidenceIds: [...draft.citedEvidenceIds],
      }
    case 'vault': {
      const picked = ctx.vault.find((v) => v.id === draft.selectedId)
      return { text: picked !== undefined ? picked.text : draft.fallback.trim() }
    }
    case 'seal':
      return { text: draft.text.trim() } // self-commit stamps sealedAt; unused here
    case 'registry':
      return {} // self-commit via holdFuneral; unused here
    default:
      return { text: draftToText(draft) }
  }
}

/** Structural completeness (law 7): fivewhys wants five rungs; others want ink. */
export function isComplete(draft: TranceDraft): boolean {
  switch (draft.kind) {
    case 'text':
      return draft.text.trim() !== ''
    case 'names':
      return draft.names.some(nonEmpty)
    case 'fivewhys':
      return draft.whys.every(nonEmpty)
    case 'number':
      return draft.value.trim() !== ''
    case 'list':
      return draft.items.some(nonEmpty)
    case 'quickadd':
      return draft.entries.length > 0
    case 'verbatim':
      return draft.quotes.some(nonEmpty)
    case 'vault':
      return draft.selectedId !== null || draft.fallback.trim() !== ''
    case 'ifthen':
      return draft.ifPart.trim() !== '' && draft.thenPart.trim() !== ''
    case 'seal':
      return draft.text.trim() !== ''
    case 'verdict':
      return draft.verdict !== ''
    case 'registry':
      return draft.selectedId !== null
    case 'decision':
      // the s5-dec lock: a decision does not cast without ≥1 evidence citation
      return draft.decision !== '' && draft.citedEvidenceIds.length > 0
    case 'spine':
      return draft.beats.some(nonEmpty)
    case 'joy':
      return draft.text.trim() !== ''
  }
}

// solution words from src/strings (03 Stage 1 rule); whole-word, case-insensitive
const SOLUTION_REGEX = new RegExp(`\\b(?:${VAULT_SOLUTION_WORDS.join('|')})\\b`, 'i')

interface LocatedQuestion {
  stageId: string
  question: Question
}

function locateQuestion(qid: string): LocatedQuestion | null {
  for (const stage of STAGES) {
    const question = stage.questions.find((q) => q.id === qid)
    if (question !== undefined) return { stageId: `s${stage.stage}`, question }
  }
  return null
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

type NudgeState = 'offer' | 'confirm' | 'captured' | 'dismissed'

interface VaultNudgeProps {
  state: NudgeState
  onFirstTap(): void
  onConfirm(): void
  onDismiss(): void
}

/** Gentle, dismissible, never blocks saving (03 Stage 1 rule; law 10). */
function VaultNudge({ state, onFirstTap, onConfirm, onDismiss }: VaultNudgeProps): ReactElement {
  return (
    <div
      role="status"
      data-testid="vault-nudge"
      className="quest-aside-violet mt-4 p-3 motion-safe:animate-quest-fade"
    >
      {state === 'captured' ? (
        <p className="text-sm font-medium">{UI.vault.nudgeCaptured}</p>
      ) : (
        <>
          <p className="text-sm">{UI.vault.nudgeText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state === 'confirm' ? (
              <button
                type="button"
                data-testid="vault-nudge-confirm"
                onClick={onConfirm}
                className="quest-btn quest-btn-violet px-3 py-1.5 text-sm"
              >
                {UI.vault.nudgeConfirm}
              </button>
            ) : (
              <button
                type="button"
                data-testid="vault-nudge-capture"
                onClick={onFirstTap}
                className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
              >
                {UI.vault.nudgeCapture}
              </button>
            )}
            <button
              type="button"
              data-testid="vault-nudge-dismiss"
              onClick={onDismiss}
              className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
            >
              {UI.vault.nudgeDismiss}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function renderControl(
  draft: TranceDraft,
  update: (next: TranceDraft) => void,
  ctx: ControlContext,
): ReactElement {
  switch (draft.kind) {
    case 'text':
      return <TextAnswer value={draft.text} onChange={(text) => update({ kind: 'text', text })} />
    case 'names':
      return (
        <NamesInput names={draft.names} onChange={(names) => update({ kind: 'names', names })} />
      )
    case 'fivewhys':
      return (
        <FiveWhysInput whys={draft.whys} onChange={(whys) => update({ kind: 'fivewhys', whys })} />
      )
    case 'number':
      return (
        <NumberInput
          value={draft.value}
          unit={draft.unit}
          context={draft.context}
          onChange={(next) => update({ kind: 'number', ...next })}
        />
      )
    case 'list':
      return <ListInput items={draft.items} onChange={(items) => update({ kind: 'list', items })} />
    case 'quickadd':
      return (
        <QuickaddInput
          entries={draft.entries}
          pending={draft.pending}
          onChange={({ entries, pending }) => update({ kind: 'quickadd', entries, pending })}
          onRegisterGuardian={ctx.registerGuardian}
        />
      )
    case 'verbatim':
      return (
        <VerbatimInput
          quotes={draft.quotes}
          onChange={(quotes) => update({ kind: 'verbatim', quotes })}
          onLogQuote={ctx.logQuote}
        />
      )
    case 'vault':
      return (
        <VaultPickInput
          vault={ctx.vault}
          selectedId={draft.selectedId}
          fallback={draft.fallback}
          onChange={(next) => update({ kind: 'vault', ...next })}
        />
      )
    case 'ifthen':
      return (
        <IfThenInput
          ifPart={draft.ifPart}
          thenPart={draft.thenPart}
          withinDays={draft.withinDays}
          registered={draft.registered}
          onChange={(next) =>
            update({
              kind: 'ifthen',
              ...next,
              // editing the IF retracts the "registered" mark so the affordance is
              // honestly re-offered for the NEW text (never silently stale)
              registered: draft.registered && next.ifPart.trim() === draft.ifPart.trim(),
            })
          }
          onRegister={(importance) => {
            const statement = draft.ifPart.trim()
            // dedupe: never mint a second guardian for a statement already standing
            if (!ctx.hasGuardian(statement)) {
              ctx.registerGuardian(statement, importance, draft.thenPart.trim())
            }
            update({ ...draft, registered: true })
          }}
        />
      )
    case 'seal':
      return (
        <SealInput
          text={draft.text}
          sealedAt={ctx.storedAnswer?.sealedAt}
          onChange={(text) => update({ kind: 'seal', text })}
          onSeal={(text) => ctx.seal(text)}
        />
      )
    case 'verdict':
      return (
        <VerdictInput
          sealedText={ctx.sealedThreadAnswer?.text}
          verdict={draft.verdict}
          onChange={(verdict) => update({ kind: 'verdict', verdict })}
        />
      )
    case 'registry':
      return (
        <FuneralInput
          candidates={ctx.funeralCandidates}
          selectedId={draft.selectedId}
          onSelect={(id) => update({ kind: 'registry', selectedId: id })}
          onHold={(id) => ctx.holdFuneral(id)}
        />
      )
    case 'decision':
      return (
        <DecisionInput
          evidence={ctx.evidence}
          decision={draft.decision}
          citedEvidenceIds={draft.citedEvidenceIds}
          onChange={(next) => update({ kind: 'decision', ...next })}
        />
      )
    case 'spine':
      return (
        <SpineInput
          beats={draft.beats}
          citedEvidenceIds={draft.citedEvidenceIds}
          evidence={ctx.evidence}
          onChange={(next) => update({ kind: 'spine', ...next })}
        />
      )
    case 'joy':
      return <JoyInput value={draft.text} onChange={(text) => update({ kind: 'joy', text })} />
  }
}

export interface TrancePanelProps {
  qid: string
}

/**
 * Mount with key={qid} so each shrine gets its own draft state. Opens when
 * ui.mode === 'trance' (UiRoot). The inscribe is one store transaction via
 * inscribeAnswer with the exact 02 Answer fields for the tag.
 */
export function TrancePanel({ qid }: TrancePanelProps): ReactElement | null {
  const located = locateQuestion(qid)
  const inscribeAnswer = useQuestStore((s) => s.inscribeAnswer)
  const captureVault = useQuestStore((s) => s.captureVault)
  const addGuardian = useQuestStore((s) => s.addGuardian)
  const addEvidence = useQuestStore((s) => s.addEvidence)
  const sealThread = useQuestStore((s) => s.sealThread)
  const invalidateAssumption = useQuestStore((s) => s.invalidateAssumption)
  // live store slices the structured controls read (re-render on change: e.g.
  // the seal flips read-only the instant sealedAt lands)
  const vault = useQuestStore((s) => s.data.vault)
  const evidence = useQuestStore((s) => s.data.evidence)
  const assumptions = useQuestStore((s) => s.data.assumptions)
  const storedAnswer = useQuestStore((s) =>
    located === null ? undefined : s.data.answers[located.stageId]?.[qid],
  )
  const sealedThreadAnswer = useQuestStore((s) => s.data.answers['s4']?.['s4-th'])
  const exitTrance = useUiStore((s) => s.exitTrance)
  const titleId = useId()

  const [draft, setDraft] = useState<TranceDraft>(() => {
    const kept = sessionDrafts.get(qid)
    if (kept !== undefined) return kept
    const stored =
      located === null ? undefined : questStore.getState().data.answers[located.stageId]?.[qid]
    return initialDraft(
      located?.question.tag ?? null,
      stored,
      located?.stageId ?? '',
      questStore.getState().data.assumptions,
      questStore.getState().data.vault,
    )
  })
  const [nudge, setNudge] = useState<NudgeState>('offer')

  if (located === null) return null
  const { stageId, question } = located

  const updateDraft = (next: TranceDraft): void => {
    sessionDrafts.set(qid, next)
    setDraft(next)
  }

  const complete = isComplete(draft)
  const selfCommit = question.tag !== null && SELF_COMMIT_TAGS.has(question.tag)

  const registerGuardian = (
    statement: string,
    importance: Importance,
    killCriterion: string,
  ): string => addGuardian({ statement, importance, killCriterion, originStageId: stageId }).id

  // Stage-1 guardians still standing — the Graveyard's headstones (s5-l5).
  // A funeral pays full honors only when E2+ evidence stands behind it (metrics).
  const funeralCandidates: FuneralCandidate[] = assumptions
    .filter((a) => a.originStageId === 's1' && a.status !== 'invalidated')
    .map((a) => ({ id: a.id, statement: a.statement, proven: tierOf(a, evidence) >= 2 }))

  const ctx: ControlContext = {
    vault,
    evidence,
    funeralCandidates,
    storedAnswer,
    sealedThreadAnswer,
    registerGuardian,
    hasGuardian: (statement) =>
      assumptions.some((a) => a.originStageId === stageId && a.statement === statement),
    logQuote: (text, source) =>
      addEvidence({ tier: 2, text, source, linkedAssumptionIds: [], stageId }),
    seal: (text) => {
      sealThread(stageId, qid, text)
      sessionDrafts.delete(qid)
      exitTrance()
    },
    holdFuneral: (assumptionId) => {
      const target = funeralCandidates.find((c) => c.id === assumptionId)
      invalidateAssumption(assumptionId)
      inscribeAnswer(stageId, qid, { text: target?.statement ?? '' })
      sessionDrafts.delete(qid)
      exitTrance()
    },
  }

  const inscribe = (): void => {
    // seal / registry own their commit (two-step confirm + store side effects)
    if (selfCommit || !complete) return
    inscribeAnswer(stageId, qid, answerFields(draft, ctx))
    sessionDrafts.delete(qid)
    exitTrance()
  }

  // the solution-word nudge is the 03 STAGE 1 rule — it fires only in s1 (review 8a)
  const nudgeVisible =
    stageId === 's1' && nudge !== 'dismissed' && SOLUTION_REGEX.test(draftToText(draft))

  return (
    <DialogShell
      titleId={titleId}
      onClose={exitTrance}
      layerClassName="z-trance"
      panelClassName="max-w-2xl"
      testId="trance-panel"
    >
      <div
        data-qid={qid}
        onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            inscribe()
          }
        }}
      >
        {/* a quiet decorative rule above the inked heading (no text) */}
        <div
          aria-hidden="true"
          className="mb-3 h-px w-16 rounded-full bg-gradient-to-r from-ink-line/70 to-transparent"
        />
        {/* the 03 question, verbatim, names the dialog */}
        <h2 id={titleId} className="quest-heading text-xl font-semibold leading-snug">
          {question.text}
        </h2>
        {question.mechanic !== undefined ? (
          <p className="quest-note mt-3 text-xs">{question.mechanic}</p>
        ) : null}

        {nudgeVisible ? (
          <VaultNudge
            state={nudge}
            onFirstTap={() => setNudge('confirm')}
            onConfirm={() => {
              captureVault(draftToText(draft))
              setNudge('captured')
            }}
            onDismiss={() => setNudge('dismissed')}
          />
        ) : null}

        <div className="mt-5">{renderControl(draft, updateDraft, ctx)}</div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-line/25 pt-4">
          <p className="text-2xs italic text-ink-faint">{UI.trance.keysHint}</p>
          {/* seal / registry commit through their own control; hide the generic
              Inscribe so there is one honest commit path, never two */}
          {selfCommit ? null : (
            <button
              type="button"
              data-testid="trance-inscribe"
              disabled={!complete}
              onClick={inscribe}
              className="quest-btn quest-btn-seal text-sm"
            >
              {UI.trance.inscribe}
            </button>
          )}
        </div>
      </div>
    </DialogShell>
  )
}
