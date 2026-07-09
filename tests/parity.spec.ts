// String parity — src/strings must byte-match the in-repo canon (03 questions, 04 Council).
// This suite re-reads docs/canon at test time and re-derives every string with the exact
// extraction rules documented in src/strings/questions.ts and src/strings/council.ts.
// Any canon drift fails the suite — that is the point.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ACT_GATES,
  COMMITMENT_GATE_COPY,
  CONSENT_COPY,
  COUNCIL_FAILURE_COPY,
  COUNCIL_SYSTEM_PROMPT,
  ERROR_KEY_FAILURE,
  ERROR_NETWORK,
  FAMILY_DINNER_ANNOTATION,
  FAMILY_DINNER_RULES,
  HINTS,
  KEY_COPY,
  MODEL_ACCESS_OFFER,
  NAMED_LOOPS,
  NAMED_LOOPS_RULE,
  NEVER_TRANSLATE,
  SIDE_QUESTS,
  SIDE_QUESTS_RULE,
  STAGES,
  STANDING_CAPTION,
  THIN_INK,
  WEATHER_ANNOTATION,
  WEATHER_LABELS,
  WEATHER_TROUGH_RULE,
} from '../src/strings'

const ROOT = join(__dirname, '..')
const canon03 = readFileSync(join(ROOT, 'docs', 'canon', '03-content-canon.md'), 'utf8')
const canon04 = readFileSync(join(ROOT, 'docs', 'canon', '04-council.md'), 'utf8')
const canon01 = readFileSync(join(ROOT, 'docs', 'canon', '01-constitution.md'), 'utf8')

const lines03 = canon03.split('\n')
const lines04 = canon04.split('\n')

// The two joy questions carry a bold `**[...]**` label instead of a lowercase `[tag]`
// marker in 03; code tags them 'joy' and keeps the label in `text` verbatim.
const JOY_IDS = new Set(['s3-joy', 's8-l3'])

// ---- 03 parser (mirrors the transcription rules in src/strings/questions.ts) ----

interface ParsedQuestion {
  id: string
  tag: string | null
  text: string
  mechanic?: string
}

interface ParsedStage {
  stage: number
  name: string
  epithet: string
  world: string
  note?: string
  rule?: string
  sections: { beforeQid: string; heading: string }[]
  questions: ParsedQuestion[]
  milestones: string[]
}

/** trailing italic parenthesized annotation ` *(...)*` → { text, mechanic: '(...)' } */
function splitMechanic(raw: string): { text: string; mechanic?: string } {
  const m = /^(.*) \*(\(.*\))\*$/.exec(raw)
  if (m !== null && m[1] !== undefined && m[2] !== undefined) {
    return { text: m[1], mechanic: m[2] }
  }
  return { text: raw }
}

function parseQuestionRest(id: string, rest: string): ParsedQuestion {
  // lowercase `[tag]` marker (first comma token is the tag, e.g. `[spine, evidence-locked]`)
  const tagged = /^\[([a-z]+)(?:, [a-z-]+)*\] (.*)$/.exec(rest)
  let tag: string | null = null
  let raw = rest
  if (tagged !== null && tagged[1] !== undefined && tagged[2] !== undefined) {
    tag = tagged[1]
    raw = tagged[2]
  } else if (JOY_IDS.has(id)) {
    tag = 'joy'
  }
  const { text, mechanic } = splitMechanic(raw)
  return mechanic === undefined ? { id, tag, text } : { id, tag, text, mechanic }
}

function parse03Stages(): ParsedStage[] {
  const stages: ParsedStage[] = []
  let current: ParsedStage | null = null
  let pendingSection: string | null = null

  for (const line of lines03) {
    const heading = /^## Stage (\d+) · (.+?) — \*(.+?)\* · (.+)$/.exec(line)
    if (heading !== null) {
      const stage = Number(heading[1])
      const name = heading[2] ?? ''
      const epithet = heading[3] ?? ''
      const worldRaw = heading[4] ?? ''
      const { text: world, mechanic: note } = splitMechanic(worldRaw)
      current = { stage, name, epithet, world, sections: [], questions: [], milestones: [] }
      if (note !== undefined) current.note = note
      stages.push(current)
      pendingSection = null
      continue
    }
    if (current === null) continue
    if (line.startsWith('## ') || line.startsWith('**⛩')) {
      // gates and later sections end the stage block
      current = null
      continue
    }

    if (/^(?:Rule|Field rules banner): /.test(line) && current.questions.length === 0) {
      current.rule = line
      continue
    }
    if (line.startsWith('**')) {
      pendingSection = line // full line verbatim; anchored to the next question id
      continue
    }
    const question = /^- (s\d+-[a-z0-9]+) (.*)$/.exec(line)
    if (question !== null && question[1] !== undefined && question[2] !== undefined) {
      const parsed = parseQuestionRest(question[1], question[2])
      if (pendingSection !== null) {
        current.sections.push({ beforeQid: parsed.id, heading: pendingSection })
        pendingSection = null
      }
      current.questions.push(parsed)
      continue
    }
    const milestones = /^Milestones: (.+)\.$/.exec(line)
    if (milestones !== null && milestones[1] !== undefined) {
      current.milestones = milestones[1].split(' · ')
    }
  }
  return stages
}

describe('03 parity — question bank', () => {
  const parsed = parse03Stages()

  it('canon has 8 stages and 57 question ids, all unique', () => {
    expect(parsed).toHaveLength(8)
    const ids = parsed.flatMap((s) => s.questions.map((q) => q.id))
    expect(ids).toHaveLength(57)
    expect(new Set(ids).size).toBe(57)
  })

  it('STAGES mirrors canon stage count and order', () => {
    expect(STAGES.map((s) => s.stage)).toEqual(parsed.map((s) => s.stage))
  })

  for (const [i, canonStage] of parsed.entries()) {
    describe(`Stage ${canonStage.stage}`, () => {
      it('heading fields match (number, name, epithet, world, note)', () => {
        const code = STAGES[i]
        expect(code).toBeDefined()
        if (code === undefined) return
        expect(code.stage).toBe(canonStage.stage)
        expect(code.name).toBe(canonStage.name)
        expect(code.epithet).toBe(canonStage.epithet)
        expect(code.world).toBe(canonStage.world)
        expect(code.note).toBe(canonStage.note)
      })

      it('rule/banner line matches verbatim', () => {
        expect(STAGES[i]?.rule).toBe(canonStage.rule)
      })

      it('section headers match verbatim and anchor to the same question', () => {
        expect(STAGES[i]?.sections ?? []).toEqual(canonStage.sections)
      })

      it('question ids, tags, texts, and mechanics match byte-for-byte', () => {
        const code = STAGES[i]?.questions ?? []
        expect(code.map((q) => q.id)).toEqual(canonStage.questions.map((q) => q.id))
        for (const [j, canonQ] of canonStage.questions.entries()) {
          const codeQ = code[j]
          expect(codeQ).toBeDefined()
          if (codeQ === undefined) continue
          expect(codeQ.tag).toBe(canonQ.tag)
          expect(codeQ.text).toBe(canonQ.text)
          expect(codeQ.mechanic).toBe(canonQ.mechanic)
        }
      })

      it('milestones match verbatim', () => {
        expect(STAGES[i]?.milestones).toEqual(canonStage.milestones)
      })
    })
  }
})

describe('03 parity — gates, loops, side quests, dinner, weather', () => {
  it('the three Act Gates match name, position, and criteria verbatim', () => {
    const gateLines = lines03.filter((l) => l.startsWith('**⛩'))
    expect(gateLines).toHaveLength(3)
    expect(ACT_GATES).toHaveLength(3)
    expect(ACT_GATES.map((g) => g.id)).toEqual(['act1', 'act2', 'act3'])
    for (const [i, gate] of ACT_GATES.entries()) {
      // reconstruct the canon line from the stored fields — byte-for-byte
      expect(`**${gate.name}** (after Stage ${gate.afterStage}): ${gate.criteria}`).toBe(
        gateLines[i],
      )
    }
  })

  it('named loops heading and line match verbatim', () => {
    const idx = lines03.indexOf(`## Named loops *${NAMED_LOOPS_RULE}*`)
    expect(idx).toBeGreaterThan(-1)
    const reconstructed =
      NAMED_LOOPS.map((l) => `${l.name} (${l.from}→${l.to})`).join(' · ') + '.'
    expect(reconstructed).toBe(lines03[idx + 1])
  })

  it('side quests heading and line match verbatim', () => {
    const idx = lines03.indexOf(`## Side Quests *${SIDE_QUESTS_RULE}*`)
    expect(idx).toBeGreaterThan(-1)
    const reconstructed = SIDE_QUESTS.map((q) => `${q.name} (${q.note})`).join(' · ') + '.'
    expect(reconstructed).toBe(lines03[idx + 1])
  })

  it('Family Dinner heading and rules text match verbatim (strings only — no UI reads them)', () => {
    const idx = lines03.indexOf(`## Family Dinner *${FAMILY_DINNER_ANNOTATION}*`)
    expect(idx).toBeGreaterThan(-1)
    expect(FAMILY_DINNER_RULES).toBe(lines03[idx + 1])
  })

  it('weather heading, scale labels, and trough rule match verbatim', () => {
    const idx = lines03.indexOf(`## Weather *${WEATHER_ANNOTATION}*`)
    expect(idx).toBeGreaterThan(-1)
    const scale = ([1, 2, 3, 4, 5] as const).map((v) => `${v} ${WEATHER_LABELS[v]}`).join(' · ')
    expect(`${scale}. ${WEATHER_TROUGH_RULE}`).toBe(lines03[idx + 1])
  })

  it('hints are an empty placeholder until the Phase 3 canon diff', () => {
    expect(HINTS).toEqual({})
  })
})

// ---- 04 parser (mirrors the extraction rules in src/strings/council.ts) ----

/**
 * EXTRACTION RULE (must match the comment in src/strings/council.ts): find the heading
 * '## Canonical system prompt (verbatim)'; take the first contiguous run of lines beginning
 * with '>' after it; strip the '> ' prefix ('>' alone → empty line); join with '\n'.
 */
function extract04Blockquote(): string {
  const start = lines04.indexOf('## Canonical system prompt (verbatim)')
  expect(start).toBeGreaterThan(-1)
  let i = start + 1
  while (i < lines04.length && !(lines04[i] ?? '').startsWith('>')) i++
  const out: string[] = []
  for (; i < lines04.length; i++) {
    const line = lines04[i]
    if (line === undefined || !line.startsWith('>')) break
    out.push(line === '>' ? '' : line.slice(2))
  }
  return out.join('\n')
}

/** the single double-quoted span on the 04 line containing `label` */
function quoted04Copy(label: string): string {
  const line = lines04.find((l) => l.includes(label))
  expect(line, `04 line with label "${label}"`).toBeDefined()
  if (line === undefined) return ''
  const first = line.indexOf('"')
  const last = line.lastIndexOf('"')
  expect(first).toBeGreaterThan(-1)
  expect(last).toBeGreaterThan(first)
  return line.slice(first + 1, last)
}

describe('04 parity — Council copy', () => {
  it('COUNCIL_SYSTEM_PROMPT is byte-exact to the 04 blockquote', () => {
    expect(COUNCIL_SYSTEM_PROMPT).toBe(extract04Blockquote())
  })

  it('canonical copy strings are byte-exact to their 04 quoted spans', () => {
    expect(KEY_COPY).toBe(quoted04Copy('**Key (BYOK, once, removable):**'))
    expect(CONSENT_COPY).toBe(quoted04Copy('**Consent (once, stored):**'))
    expect(COMMITMENT_GATE_COPY).toBe(quoted04Copy('**Commitment gate (one-way feedback, PIE):**'))
    expect(STANDING_CAPTION).toBe(quoted04Copy('**Standing caption:**'))
    expect(ERROR_NETWORK).toBe(quoted04Copy('**Error (network/5xx):**'))
    expect(ERROR_KEY_FAILURE).toBe(quoted04Copy('**Key failure (401/credit):**'))
    expect(MODEL_ACCESS_OFFER).toBe(quoted04Copy('**Model access (offer):**'))
    expect(THIN_INK).toBe(quoted04Copy('Thin-ink guard:'))
  })

  it('CONSENT_COPY carries the cost-transparency sentence', () => {
    expect(CONSENT_COPY).toContain(
      "Each reading spends a little of your key's credit — about a journal in, a page out.",
    )
  })

  it('the failure-code map covers the three canonical classes with canon copy', () => {
    expect(COUNCIL_FAILURE_COPY).toEqual({
      network: ERROR_NETWORK,
      key: ERROR_KEY_FAILURE,
      'model-access': MODEL_ACCESS_OFFER,
    })
  })
})

describe('01 parity — never-translate invariants', () => {
  it('NEVER_TRANSLATE lists the tier codes and both named invariants from 01', () => {
    expect([...NEVER_TRANSLATE]).toEqual([
      'E0',
      'E1',
      'E2',
      'E3',
      'E4',
      "Founder's Quest",
      'Genesis Framework',
    ])
    const line = canon01.split('\n').find((l) => l.includes('Never-translate invariants:'))
    expect(line).toBeDefined()
    if (line === undefined) return
    expect(line).toContain('E0–E4') // en dash in 01 expands to the five tier codes
    expect(line).toContain('"Founder\'s Quest,"')
    expect(line).toContain('"Genesis Framework."')
  })
})
