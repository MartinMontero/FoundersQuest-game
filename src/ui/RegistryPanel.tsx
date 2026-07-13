// src/ui/RegistryPanel.tsx — the Assumption Registry (G-menu): guardians
// listed riskiest-first with their derived tier (tierOf — max linked evidence
// tier, never stored), importance, and kill criterion; a create form; and a
// minimal link-evidence flow that logs an E2 entry (with source) against a
// guardian. Only E2+ moves Truth — and only via this derived link, never a
// self-declared tier.

import { useId, useRef, useState, type ReactElement } from 'react'
import { tierOf } from '../core/metrics'
import type { Assumption, HunchProvenance, Importance } from '../core/schema'
import { useQuestStore, useRiskiest } from '../state/store'
import { useUiStore } from '../state/ui'
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER, STATUS_LABELS, UI, tierLabel } from '../strings'
import { focusAfterCommit } from './focus'
import { DialogShell } from './TrancePanel'

const PROVENANCE_ORDER: readonly HunchProvenance[] = ['earned', 'adjacent', 'wild', 'borrowed']

function isProvenance(value: string): value is HunchProvenance {
  return value === 'earned' || value === 'adjacent' || value === 'wild' || value === 'borrowed'
}

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
  const addHunch = useQuestStore((s) => s.addHunch)
  const tagHunch = useQuestStore((s) => s.tagHunch)
  const seedGuardianFromHunch = useQuestStore((s) => s.seedGuardianFromHunch)
  const riskiestGuardian = useRiskiest()
  const openPanel = useUiStore((s) => s.openPanel)
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

  // whispers (A2): capture + one open seed form at a time
  const [hunchText, setHunchText] = useState('')
  const [seedOpenId, setSeedOpenId] = useState<string | null>(null)
  const [seedImportance, setSeedImportance] = useState<Importance>('dies')
  const [seedKill, setSeedKill] = useState('')
  const hunchRef = useRef<HTMLInputElement | null>(null)

  const hunches = evidence.filter((e) => e.tier === 0)

  const captureHunch = (): void => {
    const text = hunchText.trim()
    if (text === '') return
    addHunch(text) // one commit — capture never asks for provenance (D-M)
    setHunchText('')
    focusAfterCommit(() => hunchRef.current)
  }

  const seedFromHunch = (evidenceId: string): void => {
    seedGuardianFromHunch(evidenceId, seedImportance, seedKill.trim(), PANEL_ORIGIN_STAGE_ID)
    setSeedOpenId(null)
    setSeedKill('')
    setSeedImportance('dies')
    // the seed form (incl. its focused button) unmounts on commit
    focusAfterCommit(() => hunchRef.current)
  }

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

      {/* ---- Whispers (A2): two-tap capture, zero justification; the tag is
           optional and post-capture (D-M); the rune warns, never nags ---- */}
      <fieldset className="quest-aside mt-5 p-4" data-testid="whispers">
        <legend className="quest-label px-1.5 text-2xs">{UI.hunch.whispersLegend}</legend>
        <div className="flex gap-2">
          <label className="quest-label flex flex-1 flex-col gap-1 text-2xs">
            <span>{UI.hunch.captureLabel}</span>
            <input
              ref={hunchRef}
              data-testid="hunch-capture-text"
              value={hunchText}
              onChange={(event) => setHunchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  captureHunch()
                }
              }}
              className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
            />
          </label>
          <button
            type="button"
            data-testid="hunch-capture-add"
            disabled={hunchText.trim() === ''}
            onClick={captureHunch}
            className="quest-btn quest-btn-quiet self-end px-3 py-1.5 text-sm"
          >
            {UI.hunch.captureButton}
          </button>
        </div>

        {hunches.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {hunches.map((hunch, index) => {
              const seeded = hunch.linkedAssumptionIds.length > 0
              return (
                <li key={hunch.id} data-testid={`hunch-${index + 1}`} className="quest-aside p-2.5">
                  <div className="flex items-start gap-2">
                    {/* the wicked-domain rune: standing, unobtrusive, plain hover text */}
                    <span
                      role="img"
                      aria-label={UI.hunch.runeLabel}
                      title={UI.hunch.runeText}
                      className="mt-0.5 cursor-help text-sm text-[#5f43aa]"
                    >
                      {UI.hunch.runeGlyph}
                    </span>
                    <p className="flex-1 text-sm text-ink">{hunch.text}</p>
                    <span className="quest-eyebrow text-2xs text-ink-faint">{tierLabel(0)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-end gap-2 pl-6">
                    <label className="quest-label flex flex-col gap-1 text-2xs">
                      <span>{UI.hunch.provenanceLabel}</span>
                      <select
                        data-testid={`hunch-provenance-${index + 1}`}
                        value={hunch.provenance ?? ''}
                        onChange={(event) => {
                          if (isProvenance(event.target.value)) tagHunch(hunch.id, event.target.value)
                        }}
                        className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                      >
                        <option value="" disabled>
                          {UI.hunch.provenanceUntagged}
                        </option>
                        {PROVENANCE_ORDER.map((rung) => (
                          <option key={rung} value={rung}>
                            {UI.hunch.provenanceOptions[rung]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {seeded ? (
                      <p
                        data-testid={`hunch-seeded-${index + 1}`}
                        className="quest-eyebrow pb-2 text-2xs text-amber-accent-600"
                      >
                        {UI.hunch.seeded}
                      </p>
                    ) : seedOpenId === hunch.id ? (
                      <span className="flex flex-wrap items-end gap-2">
                        <label className="quest-label flex flex-col gap-1 text-2xs">
                          <span>{UI.registry.importanceLabel}</span>
                          <select
                            data-testid="hunch-seed-importance"
                            value={seedImportance}
                            onChange={(event) => {
                              if (isImportance(event.target.value)) setSeedImportance(event.target.value)
                            }}
                            className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
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
                            data-testid="hunch-seed-kill"
                            value={seedKill}
                            onChange={(event) => setSeedKill(event.target.value)}
                            className="quest-input px-2 py-1.5 text-sm normal-case tracking-normal"
                          />
                        </label>
                        <button
                          type="button"
                          data-testid="hunch-seed-confirm"
                          onClick={() => seedFromHunch(hunch.id)}
                          className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
                        >
                          {UI.hunch.seedButton}
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`hunch-seed-${index + 1}`}
                        onClick={() => setSeedOpenId(hunch.id)}
                        className="quest-btn quest-btn-quiet px-2 py-1 text-2xs text-amber-accent-600"
                      >
                        {UI.hunch.seedButton}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}

        <button
          type="button"
          data-testid="calibration-open"
          onClick={() => openPanel('panel:calibration')}
          className="quest-btn quest-btn-quiet mt-3 px-3 py-1.5 text-sm"
        >
          {UI.hunch.calibrationOpen}
        </button>
      </fieldset>

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
