// src/core/serializer.ts — buildJournalMd(data, mode): the SINGLE serializer for
// the Journal download ('full') and the Council's input ('compact'), per canon
// 02 (Serialization, as amended) and 04 (Mechanics).
//
// Structural rules, by construction:
// - Family Dinner data NEVER serializes in either mode. This module never
//   references those three schema keys at all — no key name appears anywhere
//   in this file, comments included; tests assert both the behavior (populated
//   keys → byte-identical output) and the source. Confidentiality is
//   structural, not policy (05, 2026-07-05).
// - No import path to src/key exists (guards.spec.ts asserts it). The player's
//   API key lives under its own storage key and cannot reach this document.
// - Pure function of its `data` argument: no storage reads, no clock reads, no
//   network. Equal inputs produce byte-identical output.
// - A reading's stored `journal` snapshot never serializes in either mode —
//   that is what keeps readings from recursively bloating successors (02).
//
// Fence-neutralization (documented choice, per 02 / A-101 §8 rule 6):
// EVERY interpolated data-sourced field is rendered through one of two
// helpers below — not just the obvious quote fields (answers, field notes,
// quotes, evidence text, source labels, statements, kill criteria, labels,
// retro lines, reading bodies, commitments, follow-ups) but also dates,
// timestamps, ids, stage/qid headings, statuses, and sealedAt/createdAt/
// resolvedAt values; numeric fields (withinDays, weather values, tallies,
// momentum) are coerced via Number() before interpolation, so a poisoned
// record can never smuggle text through a "number". Both first BREAK FENCE RUNS — any run of 3+ consecutive
// backticks or tildes has its characters interleaved with spaces, so a code
// fence can never open or close — and then either collapse newlines to spaces
// (inline positions) or prefix every line with '> ' (block positions), so no
// user-controlled line can sit at column 0 masquerading as document structure
// (a fake '## Council Readings' heading arrives as '> ## Council Readings').
// The same treatment applies in both modes, including imported/beamed text.

import { tierOf, trough } from './metrics'
import type {
  Answer,
  AttemptChannel,
  AttemptOutcome,
  QuestData,
  TrailEntry,
} from './schema'

export type JournalMode = 'full' | 'compact'

/** Compact mode (Council input) carries only the last 3 prior readings … (02) */
export const COMPACT_PRIOR_READINGS = 3
/** … each truncated to 600 chars, so readings never bloat successors (02). */
export const COMPACT_READING_CHARS = 600

/** Neutral empty-section marker — absence is evidence, so sections always render (04). */
const NONE = '(none)'

/** Break any fence run (3+ backticks or 3+ tildes) by interleaving spaces. */
function breakFences(text: string): string {
  return text.replace(/([`~])\1{2,}/g, (run) => run.split('').join(' '))
}

/** User text in an inline position: fences broken, newlines collapsed. */
function inline(text: string): string {
  return breakFences(text).replace(/\s*\r?\n\s*/g, ' ')
}

/** User text in a block position: fences broken, every line '> '-prefixed. */
function quoted(text: string): string {
  return breakFences(text)
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n')
}

/**
 * The single serializer (02). 'full' = the Journal download, everything.
 * 'compact' = the Council's input: same structure, but only the last 3 prior
 * readings truncated to 600 chars (reading text only — follow-ups and
 * commitments are carried by 'full'; 02), and a Field journal reduced to
 * totals + the momentum line (A-101 §11).
 */
export function buildJournalMd(data: QuestData, mode: JournalMode): string {
  const out: string[] = []
  out.push("# Founder's Quest — Journal")
  pushAnswers(out, data)
  pushFieldNotes(out, data)
  pushAssumptions(out, data)
  pushEvidence(out, data)
  pushVault(out, data)
  pushTrail(out, data)
  pushWeather(out, data)
  pushSideQuests(out, data)
  pushCouncil(out, data, mode)
  pushFieldJournal(out, data, mode)
  return `${out.join('\n')}\n`
}

// ---- Answers (03 qids as headings; mythic stage names are Phase 3 strings work) ----

function pushAnswers(out: string[], data: QuestData): void {
  out.push('', '## Answers')
  let any = false
  for (const stageId of Object.keys(data.answers).sort()) {
    const stage = data.answers[stageId]
    if (stage === undefined) continue
    const qids = Object.keys(stage).sort()
    if (qids.length === 0) continue
    any = true
    out.push('', `### ${inline(stageId)}`)
    for (const qid of qids) {
      const answer = stage[qid]
      if (answer === undefined) continue
      out.push('', `#### ${inline(qid)}`)
      pushAnswerBody(out, answer)
    }
  }
  if (!any) out.push(NONE)
}

function pushAnswerBody(out: string[], answer: Answer): void {
  if (answer.text !== undefined && answer.text !== '') out.push(quoted(answer.text))
  if (answer.whys !== undefined && answer.whys.length > 0) {
    out.push('Whys:')
    answer.whys.forEach((why, i) => out.push(`> ${i + 1}. ${inline(why)}`))
  }
  if (answer.ifPart !== undefined) out.push(`IF: ${inline(answer.ifPart)}`)
  if (answer.thenPart !== undefined) out.push(`THEN: ${inline(answer.thenPart)}`)
  if (answer.withinDays !== undefined) out.push(`WITHIN: ${Number(answer.withinDays)} days`)
  if (answer.sealedAt !== undefined) out.push(`Sealed at: ${inline(answer.sealedAt)}`)
  if (answer.verdict !== undefined) out.push(`Verdict: ${inline(answer.verdict)}`)
  if (answer.decision !== undefined) out.push(`Decision: ${inline(answer.decision)}`)
  if (answer.citedEvidenceIds !== undefined && answer.citedEvidenceIds.length > 0) {
    out.push(`Cited evidence: ${inline(answer.citedEvidenceIds.join(', '))}`)
  }
}

// ---- Field notes ----

function pushFieldNotes(out: string[], data: QuestData): void {
  out.push('', '## Field notes')
  let any = false
  for (const stageId of Object.keys(data.fieldNotes).sort()) {
    const note = data.fieldNotes[stageId]
    if (note === undefined || note === '') continue
    any = true
    out.push('', `### ${inline(stageId)}`, quoted(note))
  }
  if (!any) out.push(NONE)
}

// ---- Assumption registry (tier is DERIVED via tierOf, never stored — 02) ----

function pushAssumptions(out: string[], data: QuestData): void {
  out.push('', '## Assumption registry')
  if (data.assumptions.length === 0) {
    out.push(NONE)
    return
  }
  for (const a of data.assumptions) {
    const resolved = a.resolvedAt !== undefined ? ` · resolved ${inline(a.resolvedAt)}` : ''
    out.push(
      `- [${inline(a.status)}] ${inline(a.statement)} — importance: ${inline(a.importance)} · tier: E${tierOf(a, data.evidence)} · kill criterion: ${inline(a.killCriterion)} · created ${inline(a.createdAt)}${resolved}`,
    )
  }
}

// ---- Evidence ledger ----
// '(imported)' is DERIVED: an evidence id is imported iff it appears in any
// fieldJournal.imports[].evidenceIds — provenance is never stored on the
// evidence entry itself (A-101 §1; canon 02's evidence shape has no origin).

function pushEvidence(out: string[], data: QuestData): void {
  out.push('', '## Evidence ledger')
  if (data.evidence.length === 0) {
    out.push(NONE)
    return
  }
  const importedIds = new Set<string>()
  for (const imp of data.fieldJournal.imports) {
    for (const id of imp.evidenceIds) importedIds.add(id)
  }
  for (const e of data.evidence) {
    const imported = importedIds.has(e.id) ? ' (imported)' : ''
    out.push(
      `- E${Number(e.tier)} · ${inline(e.text)} — source: ${inline(e.source)} · ${inline(e.date)}${imported}`,
    )
  }
}

// ---- Vault (locked: count only until vaultUnlocked — 01/02) ----

function pushVault(out: string[], data: QuestData): void {
  out.push('', '## Vault')
  if (!data.vaultUnlocked) {
    out.push(`Sealed: ${data.vault.length} idea(s) captured. Contents stay locked until Stage 3.`)
    return
  }
  if (data.vault.length === 0) {
    out.push(NONE)
    return
  }
  for (const v of data.vault) out.push(`- ${inline(v.text)} — ${inline(v.date)}`)
}

// ---- Trail (overrides MUST appear with their written reasons — canon 01) ----

function trailLine(t: TrailEntry): string {
  if (t.type === 'loop') {
    let line = `- Loop: ${inline(t.name)}`
    if (t.fromId !== undefined && t.toId !== undefined)
      line += ` (${inline(t.fromId)} → ${inline(t.toId)})`
    if (t.learning !== undefined) line += ` — learning: ${inline(t.learning)}`
    if (t.critique !== undefined) line += ` — critique: ${inline(t.critique)}`
    return `${line} — ${inline(t.date)}`
  }
  if (t.type === 'gate-pass') return `- Gate passed: ${inline(t.name)} — ${inline(t.date)}`
  const reason = t.reason !== undefined && t.reason !== '' ? inline(t.reason) : '(no reason recorded)'
  return `- Gate overridden: ${inline(t.name)} — reason: ${reason} — ${inline(t.date)}`
}

const GATE_IDS = ['act1', 'act2', 'act3'] as const

function pushTrail(out: string[], data: QuestData): void {
  out.push('', '## Trail')
  const lines: string[] = data.trail.map(trailLine)
  for (const gid of GATE_IDS) {
    const rec = data.gates[gid]
    if (rec === undefined) continue
    let line = `- Gate ${gid}: ${inline(rec.status)}`
    if (rec.reason !== undefined) line += ` — reason: ${inline(rec.reason)}`
    lines.push(`${line} — ${inline(rec.date)}`)
  }
  if (lines.length === 0) {
    out.push(NONE)
    return
  }
  out.push(...lines)
}

// ---- Weather trail ----

function pushWeather(out: string[], data: QuestData): void {
  out.push('', '## Weather trail')
  if (data.weather.length === 0) {
    out.push(NONE)
    return
  }
  for (const w of data.weather) out.push(`- ${inline(w.date)} · ${Number(w.value)}/5`)
}

// ---- Side quests ----

function pushSideQuests(out: string[], data: QuestData): void {
  out.push('', '## Side quests')
  const ids = Object.keys(data.sideQuests).sort()
  let any = false
  for (const id of ids) {
    const q = data.sideQuests[id]
    if (q === undefined) continue
    any = true
    const done = q.completedAt !== undefined ? ` · completed ${inline(q.completedAt)}` : ' · open'
    out.push(`- [${inline(id)}] ${inline(q.text)} — started ${inline(q.startedAt)}${done}`)
  }
  if (!any) out.push(NONE)
}

// ---- Council Readings (every reading carries its model label — 02/05) ----

function pushCouncil(out: string[], data: QuestData, mode: JournalMode): void {
  out.push('', '## Council Readings')
  const readings =
    mode === 'compact' ? data.council.slice(-COMPACT_PRIOR_READINGS) : data.council
  if (readings.length === 0) {
    out.push(NONE)
    return
  }
  for (const r of readings) {
    out.push('', `### ${inline(r.date)} — model: ${inline(r.model)} · ${inline(r.source)}`)
    const body = mode === 'compact' ? r.reading.slice(0, COMPACT_READING_CHARS) : r.reading
    out.push(quoted(body))
    if (mode === 'full') {
      if (r.commitment !== undefined) out.push(`Commitment: ${inline(r.commitment)}`)
      if (r.followups.length > 0) {
        out.push('Follow-ups:')
        for (const f of r.followups) out.push(`- Q: ${inline(f.q)}`, `  A: ${inline(f.a)}`)
      }
    }
    // r.journal (the snapshot exactly as sent) is deliberately not rendered
    // in either mode — it exists for durable follow-up replay only (02).
  }
}

// ---- Field journal (A-101 §11; compact = totals + momentum line only) ----

function pushFieldJournal(out: string[], data: QuestData, mode: JournalMode): void {
  out.push('', '## Field journal')
  if (mode === 'full' && data.huntList.profiles.length > 0) {
    out.push('Profiles:')
    for (const p of data.huntList.profiles) {
      let open = 0
      let hollow = 0
      let filled = 0
      for (const s of data.huntList.slots) {
        if (s.profileId !== p.id) continue
        if (s.state === 'open') open += 1
        else if (s.state === 'hollow') hollow += 1
        else if (s.state === 'filled') filled += 1
      }
      const retired = p.retiredAt !== undefined ? ' · retired' : ''
      out.push(`- ${inline(p.label)} — open ${open} · hollow ${hollow} · filled ${filled}${retired}`)
    }
  }
  const attempts = data.fieldJournal.attempts
  out.push(`Attempts: ${attempts.length} total`)
  if (attempts.length > 0) {
    const byOutcome: Record<AttemptOutcome | 'unresolved', number> = {
      quote: 0,
      declined: 0,
      'no-show': 0,
      'no-story': 0,
      unresolved: 0,
    }
    const byChannel: Record<AttemptChannel, number> = {
      'in-person': 0,
      call: 0,
      video: 0,
      'live-chat': 0,
    }
    for (const a of attempts) {
      byOutcome[a.outcome ?? 'unresolved'] += 1
      byChannel[a.channel] += 1
    }
    out.push(
      `- by outcome: quote ${byOutcome.quote} · declined ${byOutcome.declined} · no-show ${byOutcome['no-show']} · no-story ${byOutcome['no-story']} · unresolved ${byOutcome.unresolved}`,
      `- by channel: in-person ${byChannel['in-person']} · call ${byChannel.call} · video ${byChannel.video} · live-chat ${byChannel['live-chat']}`,
    )
  }
  // Momentum line: stored value + held-in-trough flag (02 trough definition;
  // the freeze is honored by the tick — the journal only reports the state).
  const held = trough(data) ? ' (held — trough)' : ''
  out.push(`Momentum: ${Number(data.momentum.value)}/7${held}`)
  if (mode === 'full' && data.fieldDay.log.length > 0) {
    out.push('Field Days:')
    for (const d of data.fieldDay.log) {
      let line = `- ${inline(d.date)} · ${Number(d.attemptCount)}/${Number(d.goalAttempts)} attempts · filled ${Number(d.filled)} · hollow ${Number(d.hollow)}`
      if (d.retro !== undefined) line += ` — retro: ${inline(d.retro)}`
      out.push(line)
    }
  }
}
