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
import type { Answer, Importance } from '../core/schema'
import { questStore, useQuestStore } from '../state/store'
import { useUiStore } from '../state/ui'
import { STAGES, UI, VAULT_SOLUTION_WORDS, type Question, type QuestionTag } from '../strings'
import { FiveWhysInput } from './inputs/FiveWhysInput'
import { ListInput } from './inputs/ListInput'
import { NamesInput } from './inputs/NamesInput'
import { NumberInput } from './inputs/NumberInput'
import { QuickaddInput, type QuickaddEntry } from './inputs/QuickaddInput'
import { TextAnswer } from './inputs/TextAnswer'

// ---------------------------------------------------------------------------
// Shared dialog chrome
// ---------------------------------------------------------------------------

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Focus trap for modal surfaces: moves focus in on mount (initialFocus first,
 * else the first focusable control, else the container), keeps Tab/Shift+Tab
 * cycling inside, and restores the previously focused element on unmount.
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
      if (event.key !== 'Tab') return
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (first === undefined || last === undefined) {
        event.preventDefault()
        node.focus()
        return
      }
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return (): void => {
      node.removeEventListener('keydown', onKeyDown)
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
 * Esc-to-close (consistent across every surface). No animation — the DOM
 * panels are motion-free, so prefers-reduced-motion needs no variant here.
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
  return (
    <div className={`fixed inset-0 ${layerClassName} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" onClick={onClose} />
      <div
        ref={trapRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        tabIndex={-1}
        data-testid={testId}
        onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
          }
        }}
        className={`relative max-h-[85vh] w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl ${panelClassName}`}
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
  | { kind: 'quickadd'; entries: QuickaddEntry[] }

/** Esc keeps the draft for the session — in memory only, never persisted. */
const sessionDrafts = new Map<string, TranceDraft>()

function splitLines(text: string | undefined): string[] {
  if (text === undefined || text === '') return []
  return text.split('\n')
}

function nonEmpty(line: string): boolean {
  return line.trim() !== ''
}

/** Fresh draft for a tag, prefilled from the stored answer when one exists. */
function initialDraft(tag: QuestionTag | null, stored: Answer | undefined): TranceDraft {
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
      return { kind: 'quickadd', entries: splitLines(stored?.text).map((text) => ({ text })) }
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
  }
}

/** The exact 02 Answer fields the inscribe writes — nothing else. */
function answerFields(draft: TranceDraft): Partial<Answer> {
  if (draft.kind === 'fivewhys') return { whys: draft.whys.map((why) => why.trim()) }
  return { text: draftToText(draft) }
}

/** Structural completeness (law 7): fivewhys wants five rungs; others want ink. */
function isComplete(draft: TranceDraft): boolean {
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
      className="mt-3 rounded border border-violet-500/50 bg-violet-500/10 p-3"
    >
      {state === 'captured' ? (
        <p className="text-sm text-violet-200">{UI.vault.nudgeCaptured}</p>
      ) : (
        <>
          <p className="text-sm text-violet-200">{UI.vault.nudgeText}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {state === 'confirm' ? (
              <button
                type="button"
                data-testid="vault-nudge-confirm"
                onClick={onConfirm}
                className="rounded bg-violet-400 px-3 py-1.5 text-sm font-semibold text-slate-950"
              >
                {UI.vault.nudgeConfirm}
              </button>
            ) : (
              <button
                type="button"
                data-testid="vault-nudge-capture"
                onClick={onFirstTap}
                className="rounded border border-violet-400 px-3 py-1.5 text-sm text-violet-200"
              >
                {UI.vault.nudgeCapture}
              </button>
            )}
            <button
              type="button"
              data-testid="vault-nudge-dismiss"
              onClick={onDismiss}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300"
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
  registerGuardian: (statement: string, importance: Importance, killCriterion: string) => string,
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
          onChange={(entries) => update({ kind: 'quickadd', entries })}
          onRegisterGuardian={registerGuardian}
        />
      )
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
  const exitTrance = useUiStore((s) => s.exitTrance)
  const titleId = useId()

  const [draft, setDraft] = useState<TranceDraft>(() => {
    const kept = sessionDrafts.get(qid)
    if (kept !== undefined) return kept
    const stored =
      located === null ? undefined : questStore.getState().data.answers[located.stageId]?.[qid]
    return initialDraft(located?.question.tag ?? null, stored)
  })
  const [nudge, setNudge] = useState<NudgeState>('offer')

  if (located === null) return null
  const { stageId, question } = located

  const updateDraft = (next: TranceDraft): void => {
    sessionDrafts.set(qid, next)
    setDraft(next)
  }

  const complete = isComplete(draft)

  const inscribe = (): void => {
    if (!complete) return
    inscribeAnswer(stageId, qid, answerFields(draft))
    sessionDrafts.delete(qid)
    exitTrance()
  }

  const registerGuardian = (
    statement: string,
    importance: Importance,
    killCriterion: string,
  ): string => addGuardian({ statement, importance, killCriterion, originStageId: stageId }).id

  const nudgeVisible = nudge !== 'dismissed' && SOLUTION_REGEX.test(draftToText(draft))

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
        {/* the 03 question, verbatim, names the dialog */}
        <h2 id={titleId} className="text-lg font-semibold leading-snug text-slate-100">
          {question.text}
        </h2>
        {question.mechanic !== undefined ? (
          <p className="mt-1 text-2xs text-slate-400">{question.mechanic}</p>
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

        <div className="mt-4">{renderControl(draft, updateDraft, registerGuardian)}</div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-2xs text-slate-400">{UI.trance.keysHint}</p>
          <button
            type="button"
            data-testid="trance-inscribe"
            disabled={!complete}
            onClick={inscribe}
            className="rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {UI.trance.inscribe}
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
