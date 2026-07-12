// src/ui/FieldPanel.tsx — Field Mode's surface (A-101). Four rooms in one
// responsive panel: the Hunt List (profiles + slots + logged-before-outcome
// attempts), the Lantern (momentum, held in the trough), Field Day, and the
// Beam (export + validated import with preview/confirm). Every mechanic here
// is a thin call into the invariant-tested store/core — the panel owns only
// drafts. Imported text renders as plain React text everywhere (§8 rule 6).

import { useId, useMemo, useState, type ReactElement } from 'react'
import {
  buildBeamEnvelope,
  planImport,
  validateBeam,
  type ImportPlan,
} from '../core/fieldImport'
import type { AttemptChannel, AttemptOutcome, HuntSlot } from '../core/schema'
import { useQuestStore, useTrough } from '../state/store'
import { useUiStore } from '../state/ui'
import { FIELD, TIER_CODES } from '../strings'
import { DialogShell } from './TrancePanel'

const CHANNELS: readonly AttemptChannel[] = ['in-person', 'call', 'video', 'live-chat']
const OUTCOMES: readonly AttemptOutcome[] = ['quote', 'declined', 'no-show', 'no-story']

function slotLabel(state: HuntSlot['state']): string {
  switch (state) {
    case 'open':
      return FIELD.hunt.slotOpen
    case 'attempted':
      return FIELD.hunt.slotAttempted
    case 'hollow':
      return FIELD.hunt.slotHollow
    case 'filled':
      return FIELD.hunt.slotFilled
  }
}

export function FieldPanel(): ReactElement {
  const data = useQuestStore((s) => s.data)
  const addHuntProfile = useQuestStore((s) => s.addHuntProfile)
  const startAttempt = useQuestStore((s) => s.startAttempt)
  const resolveAttempt = useQuestStore((s) => s.resolveAttempt)
  const startFieldDay = useQuestStore((s) => s.startFieldDay)
  const endFieldDay = useQuestStore((s) => s.endFieldDay)
  const applyFieldImport = useQuestStore((s) => s.applyFieldImport)
  const closePanel = useUiStore((s) => s.closePanel)
  const inTrough = useTrough()
  const titleId = useId()

  const [profileDraft, setProfileDraft] = useState('')
  const [goalDraft, setGoalDraft] = useState('5')
  const [retroDraft, setRetroDraft] = useState('')
  const [beamCopied, setBeamCopied] = useState(false)
  const [pasteDraft, setPasteDraft] = useState('')
  const [importState, setImportState] = useState<
    | { kind: 'idle' }
    | { kind: 'error'; error: string }
    | { kind: 'preview'; plan: ImportPlan; beamId: string }
    | { kind: 'done'; written: number }
  >({ kind: 'idle' })

  const day = data.fieldDay.current
  const slotsByProfile = useMemo(() => {
    const map = new Map<string, HuntSlot[]>()
    for (const slot of data.huntList.slots) {
      map.set(slot.profileId, [...(map.get(slot.profileId) ?? []), slot])
    }
    return map
  }, [data.huntList.slots])
  const unresolved = data.fieldJournal.attempts.filter((a) => a.outcome === undefined)

  const onCopyBeam = (): void => {
    const envelope = buildBeamEnvelope(
      data,
      `beam-${data.fieldJournal.attempts.length}-${data.evidence.length}`,
      new Date().toISOString(),
    )
    void navigator.clipboard?.writeText(JSON.stringify(envelope)).then(() => {
      setBeamCopied(true)
    })
  }

  const onPreview = (): void => {
    const result = validateBeam(pasteDraft, 'paste')
    if (!result.ok) {
      setImportState({ kind: 'error', error: result.error })
      return
    }
    setImportState({
      kind: 'preview',
      plan: planImport(data, result.envelope),
      beamId: result.envelope.beamId,
    })
  }

  const onConfirmImport = (plan: ImportPlan, beamId: string): void => {
    const audit = applyFieldImport(plan, beamId, 'paste')
    const written = Object.values(audit.counts).reduce((a, b) => a + b, 0)
    setImportState({ kind: 'done', written })
    setPasteDraft('')
  }

  const writeCount = (plan: ImportPlan): number =>
    plan.writes.profiles.length + plan.writes.slots.length + plan.writes.attempts.length +
    plan.writes.evidence.length + plan.writes.fieldDayLog.length

  return (
    <DialogShell
      titleId={titleId}
      onClose={closePanel}
      testId="field-panel"
      layerClassName="z-panel"
      panelClassName="max-w-2xl"
    >
      <h2 id={titleId} className="quest-heading text-xl font-semibold">
        {FIELD.title}
      </h2>

      {/* the Lantern — momentum, honestly held in low weather */}
      <section className="mt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{FIELD.lantern.heading}</h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-ink">
          <span aria-hidden="true" className="flex gap-0.5">
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < data.momentum.value ? 'bg-amber-accent-500' : 'bg-white/10'}`}
              />
            ))}
          </span>
          <span data-testid="field-lantern" className="tabular-nums">
            {data.momentum.value}/7
          </span>
          {inTrough ? (
            <span data-testid="field-lantern-held" className="text-2xs italic text-ink-faint">
              {FIELD.lantern.held}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-2xs italic text-ink-faint">{FIELD.lantern.gloss}</p>
      </section>

      {/* the Hunt List */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{FIELD.hunt.heading}</h3>
        <p className="mt-0.5 text-2xs italic text-ink-faint">{FIELD.hunt.hint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="text"
            value={profileDraft}
            onChange={(e) => setProfileDraft(e.target.value)}
            placeholder={FIELD.hunt.placeholder}
            aria-label={FIELD.hunt.hint}
            data-testid="field-profile-input"
            className="quest-input min-w-0 flex-1 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            data-testid="field-profile-add"
            onClick={() => {
              if (profileDraft.trim() === '') return
              addHuntProfile(profileDraft.trim())
              setProfileDraft('')
            }}
            className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
          >
            {FIELD.hunt.add}
          </button>
        </div>
        {data.huntList.profiles.length === 0 ? (
          <p data-testid="field-hunt-empty" className="mt-2 text-sm italic text-ink-faint">
            {FIELD.hunt.empty}
          </p>
        ) : (
          <ul className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
            {data.huntList.profiles.map((profile, pIndex) => (
              <li key={profile.id} data-testid={`field-profile-${pIndex + 1}`} className="quest-aside p-2.5">
                <p className="text-sm font-semibold text-ink">{profile.label}</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {(slotsByProfile.get(profile.id) ?? []).map((slot, sIndex) => (
                    <li key={slot.id} className="flex flex-wrap items-center gap-2">
                      <span className="quest-medallion shrink-0 font-mono text-[10px] font-bold">
                        {slotLabel(slot.state)}
                      </span>
                      {slot.state === 'open' ? (
                        <span className="flex flex-wrap gap-1">
                          {CHANNELS.map((channel) => (
                            <button
                              key={channel}
                              type="button"
                              data-testid={`field-attempt-p${pIndex + 1}s${sIndex + 1}-${channel}`}
                              onClick={() => startAttempt(slot.id, channel)}
                              className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
                            >
                              {FIELD.hunt.channels[channel]}
                            </button>
                          ))}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {unresolved.length > 0 ? (
          <div className="mt-2">
            <p className="text-2xs italic text-ink-faint">{FIELD.hunt.hollowNote}</p>
            <ul className="mt-1 flex flex-col gap-1.5">
              {unresolved.map((attempt, aIndex) => (
                <li key={attempt.id} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-soft">
                    {FIELD.hunt.channels[attempt.channel]} · {FIELD.hunt.resolve}:
                  </span>
                  {OUTCOMES.map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      data-testid={`field-resolve-${aIndex + 1}-${outcome}`}
                      onClick={() => resolveAttempt(attempt.id, outcome)}
                      className="quest-btn quest-btn-quiet px-2 py-0.5 text-2xs"
                    >
                      {FIELD.hunt.outcomes[outcome]}
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Field Day */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{FIELD.day.heading}</h3>
        {day === null || day.endedAt !== undefined ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              {FIELD.day.goalLabel}
              <input
                type="number"
                min={1}
                max={20}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                data-testid="field-day-goal"
                className="quest-input w-16 px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              data-testid="field-day-start"
              onClick={() => startFieldDay(Math.max(1, Math.min(20, Number(goalDraft) || 5)))}
              className="quest-btn quest-btn-gold px-3 py-1.5 text-sm"
            >
              {FIELD.day.start}
            </button>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span data-testid="field-day-running" className="text-sm font-semibold text-ink">
              {FIELD.day.running(day.attemptIds.length, day.goalAttempts)}
            </span>
            <input
              type="text"
              value={retroDraft}
              onChange={(e) => setRetroDraft(e.target.value)}
              placeholder={FIELD.day.retroPlaceholder}
              aria-label={FIELD.day.retroPlaceholder}
              data-testid="field-day-retro"
              className="quest-input min-w-0 flex-1 px-2 py-1 text-sm"
            />
            <button
              type="button"
              data-testid="field-day-end"
              onClick={() => {
                endFieldDay(retroDraft)
                setRetroDraft('')
              }}
              className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
            >
              {FIELD.day.end}
            </button>
          </div>
        )}
      </section>

      {/* the Beam — export + validated import */}
      <section className="mt-4 border-t border-white/10 pt-3">
        <h3 className="quest-label text-2xs text-amber-accent-600">{FIELD.beam.heading}</h3>
        <p className="mt-0.5 text-2xs italic text-ink-faint">{FIELD.beam.gloss}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="field-beam-copy"
            onClick={onCopyBeam}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
          >
            {FIELD.beam.copy}
          </button>
          {beamCopied ? (
            <span data-testid="field-beam-copied" className="text-2xs italic text-ink-faint">
              {FIELD.beam.copied}
            </span>
          ) : null}
        </div>
        <label className="mt-3 flex flex-col gap-1">
          <span className="quest-label text-2xs">{FIELD.beam.pasteLabel}</span>
          <textarea
            value={pasteDraft}
            onChange={(e) => {
              setPasteDraft(e.target.value)
              setImportState({ kind: 'idle' })
            }}
            rows={2}
            data-testid="field-import-paste"
            className="quest-input px-2 py-1.5 font-mono text-xs normal-case tracking-normal"
          />
        </label>
        <div className="mt-2">
          <button
            type="button"
            data-testid="field-import-preview"
            disabled={pasteDraft.trim() === ''}
            onClick={onPreview}
            className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {FIELD.beam.preview}
          </button>
        </div>
        {importState.kind === 'error' ? (
          <p data-testid="field-import-error" role="alert" className="mt-2 text-sm text-red-800">
            {importState.error}
          </p>
        ) : null}
        {importState.kind === 'preview' ? (
          <div data-testid="field-import-previewbox" className="quest-aside mt-2 p-2.5">
            <p className="text-xs text-ink-soft">{FIELD.beam.counts({
              profiles: importState.plan.writes.profiles.length,
              slots: importState.plan.writes.slots.length,
              attempts: importState.plan.writes.attempts.length,
              evidence: importState.plan.writes.evidence.length,
              fieldDayLog: importState.plan.writes.fieldDayLog.length,
            })}</p>
            <ul className="mt-1.5 flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
              {importState.plan.writes.evidence.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2">
                  <span className="quest-medallion mt-0.5 shrink-0 font-mono text-[10px] font-bold">
                    {TIER_CODES[entry.tier]}
                  </span>
                  <span className="min-w-0 text-xs text-ink">
                    {entry.text.slice(0, 120)}
                    <span className="text-ink-faint"> — {entry.source} · {entry.date}</span>
                  </span>
                </li>
              ))}
            </ul>
            {importState.plan.conflicts.length > 0 ? (
              <p className="mt-1.5 text-2xs italic text-ink-faint">
                {FIELD.beam.conflictNote(importState.plan.conflicts.length)}
              </p>
            ) : null}
            {importState.plan.blankedLinks.length > 0 ? (
              <p className="mt-1 text-2xs italic text-ink-faint">{FIELD.beam.blankedNote}</p>
            ) : null}
            <div className="mt-2 flex gap-2">
              {writeCount(importState.plan) > 0 ? (
                <button
                  type="button"
                  data-testid="field-import-confirm"
                  onClick={() => onConfirmImport(importState.plan, importState.beamId)}
                  className="quest-btn quest-btn-seal text-sm"
                >
                  {FIELD.beam.confirm(writeCount(importState.plan))}
                </button>
              ) : (
                <p data-testid="field-import-nothingnew" className="text-sm italic text-ink-faint">
                  {FIELD.beam.nothingNew}
                </p>
              )}
              <button
                type="button"
                data-testid="field-import-cancel"
                onClick={() => setImportState({ kind: 'idle' })}
                className="quest-btn quest-btn-quiet px-3 py-1.5 text-sm"
              >
                {FIELD.beam.cancel}
              </button>
            </div>
          </div>
        ) : null}
        {importState.kind === 'done' ? (
          <p data-testid="field-import-done" className="mt-2 text-sm font-semibold text-amber-accent-600">
            {FIELD.beam.confirm(importState.written)} ✓
          </p>
        ) : null}
      </section>
    </DialogShell>
  )
}
