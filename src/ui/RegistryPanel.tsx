// src/ui/RegistryPanel.tsx — the Assumption Registry (G-menu): guardians
// listed riskiest-first with their derived tier (tierOf — max linked evidence
// tier, never stored), importance, and kill criterion; a create form; and a
// minimal link-evidence flow that logs an E2 entry (with source) against a
// guardian. Only E2+ moves Truth — and only via this derived link, never a
// self-declared tier.

import { useId, useRef, useState, type ReactElement } from 'react'
import { tierOf } from '../core/metrics'
import type { Assumption, Importance } from '../core/schema'
import { useQuestStore, useRiskiest } from '../state/store'
import { useUiStore } from '../state/ui'
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER, STATUS_LABELS, UI, tierLabel } from '../strings'
import { focusAfterCommit } from './focus'
import { DialogShell } from './TrancePanel'

// ASSUMPTION: guardians created from this panel originate from the Stage 1
// world — the only stage in this slice. Phase 3 passes the active stage in.
const PANEL_ORIGIN_STAGE_ID = 's1'

/** E2 — the tier this minimal link-evidence flow logs (task scope). */
const LINKED_EVIDENCE_TIER = 2 as const

function isImportance(value: string): value is Importance {
  return value === 'dies' || value === 'wobbles' || value === 'shrugs'
}

export interface RegistryPanelProps {
  /** deep-link from the Shadow: focus the riskiest guardian's row on open */
  focusRiskiest?: boolean
}

export function RegistryPanel({ focusRiskiest = false }: RegistryPanelProps): ReactElement {
  const assumptions = useQuestStore((s) => s.data.assumptions)
  const evidence = useQuestStore((s) => s.data.evidence)
  const addGuardian = useQuestStore((s) => s.addGuardian)
  const addEvidence = useQuestStore((s) => s.addEvidence)
  const riskiestGuardian = useRiskiest()
  const closePanel = useUiStore((s) => s.closePanel)
  const titleId = useId()
  const riskiestRef = useRef<HTMLLIElement | null>(null)
  const statementRef = useRef<HTMLInputElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  // create form
  const [statement, setStatement] = useState('')
  const [importance, setImportance] = useState<Importance>('wobbles')
  const [killCriterion, setKillCriterion] = useState('')

  // link-evidence (one open row at a time)
  const [linkOpenId, setLinkOpenId] = useState<string | null>(null)
  const [evidenceText, setEvidenceText] = useState('')
  const [evidenceSource, setEvidenceSource] = useState('')

  const create = (): void => {
    if (statement.trim() === '') return
    addGuardian({
      statement: statement.trim(),
      importance,
      killCriterion: killCriterion.trim(),
      originStageId: PANEL_ORIGIN_STAGE_ID,
    })
    setStatement('')
    setImportance('wobbles')
    setKillCriterion('')
    // the create button disables itself once the statement clears — focus the
    // statement field so the keyboard is never stranded (adversarial review 2)
    focusAfterCommit(() => statementRef.current)
  }

  const linkEvidence = (guardian: Assumption): void => {
    if (evidenceText.trim() === '' || evidenceSource.trim() === '') return
    addEvidence({
      tier: LINKED_EVIDENCE_TIER,
      text: evidenceText.trim(),
      source: evidenceSource.trim(),
      linkedAssumptionIds: [guardian.id],
      stageId: guardian.originStageId,
    })
    setEvidenceText('')
    setEvidenceSource('')
    setLinkOpenId(null)
    // the whole link row (incl. the focused add button) unmounts on commit
    focusAfterCommit(() => closeRef.current)
  }

  // riskiest first, the rest in creation order (game-design §3: G-menu order)
  const sorted = [...assumptions].sort((a, b) => {
    if (riskiestGuardian !== null) {
      if (a.id === riskiestGuardian.id) return -1
      if (b.id === riskiestGuardian.id) return 1
    }
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
  })

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
      testId="registry-panel"
      initialFocus={focusRiskiest && riskiestGuardian !== null ? riskiestRef : undefined}
    >
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {UI.registry.panelTitle}
      </h2>

      {sorted.length === 0 ? (
        <p data-testid="registry-empty" className="mt-3 text-sm italic text-ink-faint">
          {UI.registry.empty}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {sorted.map((guardian) => {
            const isRiskiest = riskiestGuardian !== null && guardian.id === riskiestGuardian.id
            const meta = [
              IMPORTANCE_LABELS[guardian.importance],
              STATUS_LABELS[guardian.status],
              tierLabel(tierOf(guardian, evidence)),
            ].join(UI.common.metaSeparator)
            return (
              <li
                key={guardian.id}
                ref={isRiskiest ? riskiestRef : undefined}
                tabIndex={isRiskiest ? -1 : undefined}
                data-testid="registry-guardian"
                data-guardian-id={guardian.id}
                data-riskiest={isRiskiest ? 'true' : undefined}
                className={`quest-aside p-3 ${
                  isRiskiest ? 'border-amber-accent-500 bg-amber-accent-400/18 shadow-amber-glow' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{guardian.statement}</p>
                  {isRiskiest ? (
                    <span
                      data-testid="registry-riskiest"
                      className="rounded-full bg-amber-accent-400 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-ink shadow-amber-glow"
                    >
                      {UI.registry.riskiestBadge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-2xs tracking-wide text-ink-faint">{meta}</p>
                <p className="mt-1.5 text-xs text-ink-soft">
                  <span className="text-ink-faint">{UI.registry.killCriterionCaption} </span>
                  {guardian.killCriterion.trim() === ''
                    ? UI.registry.killCriterionEmpty
                    : guardian.killCriterion}
                </p>

                {linkOpenId === guardian.id ? (
                  <div className="quest-aside mt-2 flex flex-col gap-2 p-2.5 motion-safe:animate-quest-fade">
                    <label className="quest-label flex flex-col gap-1 text-2xs">
                      <span>{UI.registry.evidenceTextLabel}</span>
                      <input
                        data-testid="registry-evidence-text"
                        value={evidenceText}
                        onChange={(event) => setEvidenceText(event.target.value)}
                        className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                      />
                    </label>
                    <label className="quest-label flex flex-col gap-1 text-2xs">
                      <span>{UI.registry.evidenceSourceLabel}</span>
                      <input
                        data-testid="registry-evidence-source"
                        value={evidenceSource}
                        onChange={(event) => setEvidenceSource(event.target.value)}
                        className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-testid="registry-evidence-add"
                        disabled={evidenceText.trim() === '' || evidenceSource.trim() === ''}
                        onClick={() => linkEvidence(guardian)}
                        className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                      >
                        {UI.registry.evidenceAdd}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkOpenId(null)}
                        className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
                      >
                        {UI.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="registry-link-toggle"
                    onClick={() => {
                      setLinkOpenId(guardian.id)
                      setEvidenceText('')
                      setEvidenceSource('')
                    }}
                    className="quest-btn quest-btn-quiet mt-2 px-2 py-1 text-2xs"
                  >
                    {UI.registry.linkEvidenceToggle}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* create form — no <form> tag; explicit button commit */}
      <fieldset className="quest-aside mt-5 p-4">
        <legend className="quest-label px-1.5 text-2xs">{UI.registry.createLegend}</legend>
        <div className="flex flex-col gap-2">
          <label className="quest-label flex flex-col gap-1 text-2xs">
            <span>{UI.registry.statementLabel}</span>
            <input
              ref={statementRef}
              data-testid="registry-statement"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
            />
          </label>
          <label className="quest-label flex flex-col gap-1 text-2xs">
            <span>{UI.registry.importanceLabel}</span>
            <select
              data-testid="registry-importance"
              value={importance}
              onChange={(event) => {
                if (isImportance(event.target.value)) setImportance(event.target.value)
              }}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
            >
              {IMPORTANCE_ORDER.map((option) => (
                <option key={option} value={option}>
                  {IMPORTANCE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="quest-label flex flex-col gap-1 text-2xs">
            <span>{UI.registry.killCriterionLabel}</span>
            <input
              data-testid="registry-kill"
              value={killCriterion}
              onChange={(event) => setKillCriterion(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm normal-case tracking-normal text-slate-100"
            />
          </label>
          <button
            type="button"
            data-testid="registry-create"
            disabled={statement.trim() === ''}
            onClick={create}
            className="quest-btn quest-btn-gold self-start px-3 py-1.5 text-sm"
          >
            {UI.registry.createButton}
          </button>
        </div>
      </fieldset>

      <div className="mt-6">
        <button
          ref={closeRef}
          type="button"
          data-testid="registry-close"
          onClick={closePanel}
          className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
        >
          {UI.common.close}
        </button>
      </div>
    </DialogShell>
  )
}
