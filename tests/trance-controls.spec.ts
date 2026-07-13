// tests/trance-controls.spec.ts — the per-world trance controls' pure helpers.
// Each control must round-trip: initialDraft rebuilds a draft from a stored 02
// Answer, and answerFields writes back EXACTLY the canon keys (nothing else).
// isComplete encodes structural completeness (law 7) + the one explicit lock
// (s5-dec needs a citation). These are the canon-fidelity guarantees behind the
// nine designed shrines (Worlds 2–8).

import { describe, expect, it } from 'vitest'
import type { Answer, Assumption } from '../src/core/schema'
import type { VaultEntry } from '../src/state/store'
import {
  answerFields,
  draftToText,
  initialDraft,
  isComplete,
  type ControlContext,
  type TranceDraft,
} from '../src/ui/TrancePanel'

/** A ctx with everything empty — overridden per test where a control reads store data. */
function ctx(overrides: Partial<ControlContext> = {}): ControlContext {
  return {
    vault: [],
    evidence: [],
    funeralCandidates: [],
    storedAnswer: undefined,
    sealedThreadAnswer: undefined,
    registerGuardian: () => 'guardian-x',
    hasGuardian: () => false,
    logQuote: () => {},
    seal: () => {},
    holdFuneral: () => {},
    ...overrides,
  }
}

function vaultEntry(id: string, text: string): VaultEntry {
  return { id, text, date: '2026-07-01T00:00:00.000Z' }
}

function guardian(statement: string, originStageId = 's3'): Assumption {
  return {
    id: `g-${statement}`,
    statement,
    originStageId,
    importance: 'dies',
    status: 'untested',
    killCriterion: '',
    createdAt: '2026-07-01T00:00:00.000Z',
  }
}

const NO_ASSUMPTIONS: readonly Assumption[] = []
const NO_VAULT: readonly VaultEntry[] = []

function draft(tag: Parameters<typeof initialDraft>[0], stored?: Answer, stageId = 's2'): TranceDraft {
  return initialDraft(tag, stored, stageId, NO_ASSUMPTIONS, NO_VAULT)
}

describe('verbatim (s2-th)', () => {
  it('pads to five quote rows from a stored answer', () => {
    const d = draft('verbatim', { text: 'she said A\nhe said B' })
    expect(d).toEqual({ kind: 'verbatim', quotes: ['she said A', 'he said B', '', '', ''] })
  })
  it('inscribes non-empty quotes as Answer.text, newline-joined', () => {
    const d: TranceDraft = { kind: 'verbatim', quotes: ['A', '', 'B', '', ''] }
    expect(answerFields(d, ctx())).toEqual({ text: 'A\nB' })
    expect(draftToText(d)).toBe('A\nB')
  })
  it('is complete with any ink, incomplete when blank', () => {
    expect(isComplete({ kind: 'verbatim', quotes: ['', '', '', '', ''] })).toBe(false)
    expect(isComplete({ kind: 'verbatim', quotes: ['', 'x', '', '', ''] })).toBe(true)
  })
})

describe('vault (s3-l1)', () => {
  it('re-selects the vault entry whose text matches the prior answer', () => {
    const vault = [vaultEntry('v1', 'a waste tracker'), vaultEntry('v2', 'a concierge run')]
    const d = initialDraft('vault', { text: 'a concierge run' }, 's3', NO_ASSUMPTIONS, vault)
    expect(d).toEqual({ kind: 'vault', selectedId: 'v2', fallback: '' })
  })
  it('falls back to free text when nothing matches (or the Vault is empty)', () => {
    const d = initialDraft('vault', { text: 'something else' }, 's3', NO_ASSUMPTIONS, NO_VAULT)
    expect(d).toEqual({ kind: 'vault', selectedId: null, fallback: 'something else' })
  })
  it('inscribes the selected entry text; else the fallback', () => {
    const vault = [vaultEntry('v1', 'a waste tracker')]
    expect(answerFields({ kind: 'vault', selectedId: 'v1', fallback: '' }, ctx({ vault }))).toEqual({
      text: 'a waste tracker',
    })
    expect(
      answerFields({ kind: 'vault', selectedId: null, fallback: '  free text  ' }, ctx()),
    ).toEqual({ text: 'free text' })
  })
  it('is complete with a selection OR a fallback', () => {
    expect(isComplete({ kind: 'vault', selectedId: null, fallback: '' })).toBe(false)
    expect(isComplete({ kind: 'vault', selectedId: 'v1', fallback: '' })).toBe(true)
    expect(isComplete({ kind: 'vault', selectedId: null, fallback: 'x' })).toBe(true)
  })
})

describe('ifthen (s3-l2)', () => {
  it('rebuilds ifPart/thenPart/withinDays from the stored answer', () => {
    const d = draft('ifthen', { ifPart: 'cafés lose stock', thenPart: '5 request it', withinDays: 7 }, 's3')
    expect(d).toEqual({
      kind: 'ifthen',
      ifPart: 'cafés lose stock',
      thenPart: '5 request it',
      withinDays: '7',
      registered: false,
    })
  })
  it('reattaches the registered flag when the IF-guardian already stands', () => {
    const g = guardian('cafés lose stock', 's3')
    const d = initialDraft('ifthen', { ifPart: 'cafés lose stock' }, 's3', [g], NO_VAULT)
    expect(d).toMatchObject({ kind: 'ifthen', registered: true })
  })
  it('inscribes exactly ifPart/thenPart/withinDays', () => {
    const d: TranceDraft = { kind: 'ifthen', ifPart: ' a ', thenPart: ' b ', withinDays: '7', registered: false }
    expect(answerFields(d, ctx())).toEqual({ ifPart: 'a', thenPart: 'b', withinDays: 7 })
  })
  it('drops withinDays when not a positive number (warn, never block)', () => {
    const nan: TranceDraft = { kind: 'ifthen', ifPart: 'a', thenPart: 'b', withinDays: 'soon', registered: false }
    expect(answerFields(nan, ctx())).toEqual({ ifPart: 'a', thenPart: 'b', withinDays: undefined })
    const zero: TranceDraft = { kind: 'ifthen', ifPart: 'a', thenPart: 'b', withinDays: '0', registered: false }
    expect(answerFields(zero, ctx()).withinDays).toBeUndefined()
  })
  it('needs both IF and THEN to be complete', () => {
    expect(isComplete({ kind: 'ifthen', ifPart: 'a', thenPart: '', withinDays: '', registered: false })).toBe(false)
    expect(isComplete({ kind: 'ifthen', ifPart: 'a', thenPart: 'b', withinDays: '', registered: false })).toBe(true)
  })
})

describe('seal (s4-th)', () => {
  it('inscribes the trimmed thread text', () => {
    expect(answerFields({ kind: 'seal', text: '  stop if <2  ' }, ctx())).toEqual({ text: 'stop if <2' })
  })
  it('is complete once there is ink', () => {
    expect(isComplete({ kind: 'seal', text: '   ' })).toBe(false)
    expect(isComplete({ kind: 'seal', text: 'x' })).toBe(true)
  })
})

describe('verdict (s5-th)', () => {
  it('rebuilds a stored yes/no; ignores anything else', () => {
    expect(draft('verdict', { verdict: 'yes' }, 's5')).toEqual({ kind: 'verdict', verdict: 'yes' })
    expect(draft('verdict', { verdict: 'maybe' }, 's5')).toEqual({ kind: 'verdict', verdict: '' })
    expect(draft('verdict', undefined, 's5')).toEqual({ kind: 'verdict', verdict: '' })
  })
  it('inscribes Answer.verdict; needs a ruling to be complete', () => {
    expect(answerFields({ kind: 'verdict', verdict: 'no' }, ctx())).toEqual({ verdict: 'no' })
    expect(isComplete({ kind: 'verdict', verdict: '' })).toBe(false)
    expect(isComplete({ kind: 'verdict', verdict: 'yes' })).toBe(true)
  })
})

describe('registry / funeral (s5-l5)', () => {
  it('opens with no selection; is complete only once a belief is chosen', () => {
    expect(draft('registry', undefined, 's5')).toEqual({ kind: 'registry', selectedId: null })
    expect(isComplete({ kind: 'registry', selectedId: null })).toBe(false)
    expect(isComplete({ kind: 'registry', selectedId: 'g-1' })).toBe(true)
  })
})

describe('decision (s5-dec) — the citation lock', () => {
  it('rebuilds pivot/persevere + citations from the stored answer', () => {
    const d = draft('decision', { decision: 'pivot', citedEvidenceIds: ['e-1'] }, 's5')
    expect(d).toEqual({ kind: 'decision', decision: 'pivot', citedEvidenceIds: ['e-1'] })
  })
  it('inscribes decision + citedEvidenceIds', () => {
    const d: TranceDraft = { kind: 'decision', decision: 'persevere', citedEvidenceIds: ['e-1', 'e-2'] }
    expect(answerFields(d, ctx())).toEqual({ decision: 'persevere', citedEvidenceIds: ['e-1', 'e-2'] })
  })
  it('does NOT cast without a decision AND at least one citation (the lock)', () => {
    expect(isComplete({ kind: 'decision', decision: '', citedEvidenceIds: ['e-1'] })).toBe(false)
    expect(isComplete({ kind: 'decision', decision: 'pivot', citedEvidenceIds: [] })).toBe(false)
    expect(isComplete({ kind: 'decision', decision: 'pivot', citedEvidenceIds: ['e-1'] })).toBe(true)
  })
})

describe('spine (s8-th)', () => {
  it('pads to five beats and rebuilds citations', () => {
    const d = draft('spine', { text: 'Priya\nlost a crate', citedEvidenceIds: ['e-1'] }, 's8')
    expect(d).toEqual({
      kind: 'spine',
      beats: ['Priya', 'lost a crate', '', '', ''],
      citedEvidenceIds: ['e-1'],
    })
  })
  it('inscribes beats as text + citedEvidenceIds', () => {
    const d: TranceDraft = { kind: 'spine', beats: ['A', '', 'B', '', ''], citedEvidenceIds: ['e-1'] }
    expect(answerFields(d, ctx())).toEqual({ text: 'A\nB', citedEvidenceIds: ['e-1'] })
  })
  it('an uncited spine still inscribes (warn, never block)', () => {
    expect(isComplete({ kind: 'spine', beats: ['A', '', '', '', ''], citedEvidenceIds: [] })).toBe(true)
    expect(isComplete({ kind: 'spine', beats: ['', '', '', '', ''], citedEvidenceIds: [] })).toBe(false)
  })
})

describe('joy (s3-joy, s8-l3)', () => {
  it('round-trips a single text field', () => {
    expect(draft('joy', { text: 'a hand-written thank-you' }, 's3')).toEqual({
      kind: 'joy',
      text: 'a hand-written thank-you',
    })
    expect(answerFields({ kind: 'joy', text: 'x' }, ctx())).toEqual({ text: 'x' })
    expect(isComplete({ kind: 'joy', text: '  ' })).toBe(false)
    expect(isComplete({ kind: 'joy', text: 'x' })).toBe(true)
  })
})
